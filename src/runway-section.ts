import {
  clamp,
  wrapN,
  shortestIndexDelta,
  computeRingSlot,
  computeClassicSlot,
  validateBagItems,
  addToBag,
  generateShortlistText,
  StylingBagItem,
} from './runway-logic';
import { LOOKS, PRODUCTS, ProductItem } from './data';
import { formatGhs, toGhs } from './currency';
import { getBundleDiscountPercent } from './bundle-store';

const STORAGE_KEY = 'runway-styling-bag-v3';

export class RunwaySection extends HTMLElement {
  private index = 0;
  private target = 0;
  private cur = 0;
  private vel = 0;
  private still = false;
  private playing = false;
  private engaged = false;
  private panelHover = false;
  private zoomed = false;
  private isMobile = false;

  private frameH = 0;
  private stageW = 0;
  private stageH = 0;
  private unit = 120;
  private fs = 1.08;
  private modelH = 560;
  private speed = 5000;

  // Classic mode body states
  private classicStates: Array<{
    x: number;
    g: number;
    from: number;
    vel: number;
    trip: boolean;
  }> = [];

  // DOM elements
  private stageEl!: HTMLElement;
  private actorsEl!: HTMLElement;
  private heroesEl!: HTMLElement;
  private sweepEl!: HTMLElement;
  private cursorEl: HTMLElement | null = null;
  private walkLineEl: HTMLElement | null = null;
  private ticksContainer!: HTMLElement;
  private autoBtn!: HTMLElement;
  private liveRegion!: HTMLElement;
  private lbEl!: HTMLElement;
  private lbStageEl!: HTMLElement;
  private lbKickerEl!: HTMLElement;
  private lbNameEl!: HTMLElement;
  private lbCloseBtn!: HTMLElement;
  private panelInnerEl!: HTMLElement;
  private piecesLabel!: HTMLElement;

  private bodies: HTMLElement[] = [];
  private heroes: HTMLElement[] = [];
  private ticks: HTMLElement[] = [];
  private panels: HTMLElement[] = [];

  private prevBtn: HTMLButtonElement | null = null;
  private nextBtn: HTMLButtonElement | null = null;
  private prevNameEl: HTMLElement | null = null;
  private nextNameEl: HTMLElement | null = null;

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTarget = 0;
  private dragPointerId = -1;
  private velocitySamples: Array<{ x: number; time: number }> = [];
  private suppressClicksUntil = 0;

  // Cursor inertia
  private cursorX = 0;
  private cursorY = 0;
  private targetCursorX = 0;
  private targetCursorY = 0;
  private cursorRafId = 0;

  // Main render loop
  private rafId = 0;
  private lastTime = 0;
  private isVisible = false;

  // Autoplay
  private autoTimer: number | null = null;

  // Wheel accumulator
  private wheelAcc = 0;
  private wheelLockUntil = 0;
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipePointerId = -1;

  // Mobile sheet host
  private sheetHost: HTMLElement | null = null;
  private activePickingCard: HTMLElement | null = null;

  // Observers & Cleanups
  private resizeObserver: ResizeObserver | null = null;
  private visibilityObserver: IntersectionObserver | null = null;
  private revealObserver: IntersectionObserver | null = null;
  private debouncedResizeTimer: number | null = null;
  private lastWindowWidth = 0;
  private lastWindowHeight = 0;

  connectedCallback() {
    this.initElements();
    this.initDataAndClones();
    this.initBag();
    this.measure(true);
    this.detectFeet();
    this.syncBundleDiscounts();
    window.addEventListener('runway:discount-updated', this.handleDiscountUpdated);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startOffset = prefersReduced ? 0 : 1.15;
    this.cur = -startOffset;
    this.target = 0;

    this.classList.add('rw--js');

    this.bindEvents();
    this.initCursor();
    this.setIndex(0, true);

    // Re-measure after initial layout reflow
    setTimeout(() => {
      this.measure(true);
      this.kick();
    }, 60);

    // Reveal observer
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.classList.add('is-revealed');
            });
          });
          this.revealObserver?.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -22% 0px' }
    );
    this.revealObserver.observe(this);

    // Visibility observer for render loop
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        this.isVisible = entries[0].isIntersecting;
        if (this.isVisible) {
          this.kick();
        }
      },
      { threshold: 0 }
    );
    this.visibilityObserver.observe(this);

    // Autoplay start
    const shouldAutoplay = this.dataset.autoplay === 'true' && !prefersReduced;
    this.speed = parseInt(this.dataset.speed || '5000', 10);
    if (shouldAutoplay) {
      this.play(true);
    }

    this.kick();
  }

  disconnectedCallback() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.cursorRafId) cancelAnimationFrame(this.cursorRafId);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.resizeObserver?.disconnect();
    this.visibilityObserver?.disconnect();
    this.revealObserver?.disconnect();
    if (this.sheetHost) {
      this.closeMobileSheet();
      this.sheetHost.remove();
      this.sheetHost = null;
    }
    window.removeEventListener('runway:discount-updated', this.handleDiscountUpdated);
  }

  private handleDiscountUpdated = () => {
    this.syncBundleDiscounts();
  };

  public syncBundleDiscounts() {
    const percent = getBundleDiscountPercent();
    if (!this.panels) return;

    this.panels.forEach((panel, i) => {
      const look = LOOKS[i];
      if (!look) return;
      const bundleTotal = look.items.reduce((total, itemRef) => total + PRODUCTS[itemRef.productId].price, 0);
      const discountMultiplier = percent > 0 ? (100 - percent) / 100 : 1;
      const bundleDiscounted = bundleTotal * discountMultiplier;

      const noteEl = panel.querySelector<HTMLElement>('.rw__bundle-note');
      if (noteEl) {
        noteEl.textContent = percent > 0 ? `Bundle all 3 and save ${percent}%` : 'Complete the 3-piece look';
      }

      const priceContainer = panel.querySelector<HTMLElement>('.rw__bundle-price');
      if (priceContainer) {
        if (percent > 0) {
          priceContainer.innerHTML = `<s>${formatGhs(toGhs(bundleTotal))}</s> <strong>${formatGhs(toGhs(bundleDiscounted))}</strong>`;
        } else {
          priceContainer.innerHTML = `<strong>${formatGhs(toGhs(bundleTotal))}</strong>`;
        }
      }

      const ctaMobile = panel.querySelector<HTMLElement>('.rw__cta-m');
      if (ctaMobile) {
        ctaMobile.textContent = `Add full look — ${formatGhs(toGhs(bundleDiscounted))}`;
      }
    });
  }

  /* ------------------------------------------------------------------------
   * Elements & Clones
   * ------------------------------------------------------------------------ */
  private initElements() {
    this.stageEl = this.querySelector('[data-rw-stage]') as HTMLElement;
    this.actorsEl = this.querySelector('[data-rw-actors]') as HTMLElement;
    this.heroesEl = this.querySelector('[data-rw-heroes]') as HTMLElement;
    this.sweepEl = this.querySelector('.rw__sweep') as HTMLElement;
    this.cursorEl = this.querySelector('[data-rw-cursor]') as HTMLElement | null;
    this.walkLineEl = this.querySelector('.rw__walk-line') as HTMLElement | null;
    this.ticksContainer = this.querySelector('.rw__ticks') as HTMLElement;
    this.autoBtn = this.querySelector('[data-rw-auto]') as HTMLElement;
    this.liveRegion = this.querySelector('[data-rw-live]') as HTMLElement;
    this.lbEl = this.querySelector('[data-rw-lb]') as HTMLElement;
    this.lbStageEl = this.querySelector('[data-rw-lb-stage]') as HTMLElement;
    this.lbKickerEl = this.querySelector('[data-rw-lb-kicker]') as HTMLElement;
    this.lbNameEl = this.querySelector('[data-rw-lb-name]') as HTMLElement;
    this.lbCloseBtn = this.querySelector('[data-rw-zoom-close]') as HTMLElement;
    this.panelInnerEl = this.querySelector('.rw__panel-inner') as HTMLElement;
    this.piecesLabel = this.querySelector('[data-rw-pieces]') as HTMLElement;

    this.heroes = Array.from(this.querySelectorAll('.rw__hero'));
    this.panels = Array.from(this.querySelectorAll('.rw__look-panel'));
    this.ticks = Array.from(this.querySelectorAll('.rw__tick'));

    this.prevBtn = this.querySelector<HTMLButtonElement>('[data-rw-prev]');
    this.nextBtn = this.querySelector<HTMLButtonElement>('[data-rw-next]');
    this.prevNameEl = this.querySelector<HTMLElement>('[data-rw-prev-name]');
    this.nextNameEl = this.querySelector<HTMLElement>('[data-rw-next-name]');
  }

  private initDataAndClones() {
    const originalBodies = Array.from(this.actorsEl.querySelectorAll<HTMLElement>('.rw__model'));
    this.bodies = [...originalBodies];

    // Clone bodies 0..5 into 6..11
    originalBodies.forEach((orig, i) => {
      const clone = orig.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-index', String(i + 6));
      clone.setAttribute('data-rw-clone', '');
      const img = clone.querySelector('img');
      if (img) {
        img.setAttribute('loading', 'lazy');
      }
      this.actorsEl.appendChild(clone);
      this.bodies.push(clone);
    });

    // Image decode listeners
    this.querySelectorAll<HTMLImageElement>('img[data-model-image]').forEach((img) => {
      const setDecoded = () => img.classList.add('is-decoded');
      if (img.complete && img.naturalWidth) {
        setDecoded();
      } else if (img.decode) {
        img.decode().then(setDecoded).catch(() => {
          if (img.naturalWidth) setDecoded();
          else img.addEventListener('load', setDecoded, { once: true });
        });
      } else {
        img.addEventListener('load', setDecoded, { once: true });
      }
    });

    // Init classic mode springs
    this.classicStates = this.bodies.map((_, i) => ({
      x: i,
      g: i,
      from: i,
      vel: 0,
      trip: false,
    }));
  }

  /* ------------------------------------------------------------------------
   * Layout Measurement
   * ------------------------------------------------------------------------ */
  private measure(force = false) {
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    if (!force && winW === this.lastWindowWidth && Math.abs(winH - this.lastWindowHeight) < 20) {
      return;
    }

    this.lastWindowWidth = winW;
    this.lastWindowHeight = winH;
    // Use the compact queue only on phones, portrait small tablets, or short viewports.
    // Landscape tablets retain the two-column runway so the stage and products remain visible together.
    this.isMobile =
      winW <= 749 ||
      (winW <= 900 && winH > winW) ||
      (winW <= 1180 && winH < 600);

    // Header height calculation
    let headerH = 88;
    const headerEl = document.querySelector<HTMLElement>('.shopify-section-group-header-group');
    if (headerEl && !this.contains(headerEl)) {
      headerH = headerEl.offsetHeight;
    }

    if (!this.isMobile) {
      this.frameH = Math.max(480, winH - headerH);
      this.style.setProperty('--rw-frame-h', `${this.frameH}px`);
      this.fs = 1.05;
    } else {
      this.frameH = Math.max(420, winH - headerH);
      this.style.setProperty('--rw-frame-h', `${this.frameH}px`);
      this.fs = 1.0;
    }
    this.style.setProperty('--rw-fs', String(this.fs));

    const stageRect = this.stageEl.getBoundingClientRect();
    this.stageW = stageRect.width || winW;

    if (!this.isMobile) {
      this.stageH = stageRect.height || this.frameH;
      // Use one shared frame for every model while leaving a small stage margin.
      const bottomPad = 24;
      const safeHeadroom = 18;
      const maxSafeH = (this.stageH - bottomPad - safeHeadroom) / this.fs;
      this.modelH = Math.max(180, Math.min(Math.round(maxSafeH), 520));
      this.unit = Math.max(120, 0.3 * this.stageW);
      this.stageEl.style.setProperty('--rw-hx', `${0.5 * this.stageW}px`);
      this.stageEl.style.setProperty('--rw-hy', `${bottomPad}px`);
      this.style.setProperty('--rw-ax', '50%');
    } else {
      // Keep the stage within the available first viewport while preserving full-body framing.
      this.stageH = Math.max(320, stageRect.height || 420);
      const bottomPad = 16;
      const safeHeadroom = 16;
      const maxSafeH = (this.stageH - bottomPad - safeHeadroom) / this.fs;
      this.modelH = Math.max(180, Math.min(Math.round(maxSafeH), 460));
      this.unit = Math.max(90, this.stageW * 0.32 * 1.6);
      this.stageEl.style.setProperty('--rw-hx', `${0.32 * this.stageW}px`);
      this.stageEl.style.setProperty('--rw-hy', `${bottomPad}px`);
      this.style.setProperty('--rw-ax', '32%');
    }

    this.style.setProperty('--rw-model-h', `${this.modelH}px`);
    this.stageEl.style.setProperty('--rw-model-h', `${this.modelH}px`);

    if (!this.isMobile && this.sheetHost) {
      this.closeMobileSheet();
    }
  }

  /* ------------------------------------------------------------------------
   * Feet Detection
   * ------------------------------------------------------------------------ */
  private detectFeet() {
    LOOKS.forEach((look, i) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = look.probe;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 48;
            canvas.height = Math.round((48 * img.naturalHeight) / img.naturalWidth) || 85;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let lastRow = height - 1;
            outer: for (let y = height - 1; y >= 0; y--) {
              for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];
                if (alpha > 40) {
                  lastRow = y;
                  break outer;
                }
              }
            }

            const footFraction = clamp((height - 1 - lastRow) / height, 0, 0.4);
            const hero = this.heroes[i];
            if (hero) hero.style.setProperty('--rw-foot', String(footFraction));
            this.bodies.forEach((b) => {
              if (parseInt(b.getAttribute('data-index') || '0', 10) % 6 === i) {
                b.style.setProperty('--rw-foot', String(footFraction));
              }
            });
          } catch {
            // Tainted canvas fallback
          }
        };
      } catch {
        // Ignored
      }
    });
  }

  /* ------------------------------------------------------------------------
   * Index Navigation & State
   * ------------------------------------------------------------------------ */
  private setStill(val: boolean) {
    if (this.still !== val) {
      this.still = val;
      if (val) {
        this.classList.add('rw--still');
      } else {
        this.classList.remove('rw--still');
      }
    }
  }

  public setIndex(i: number, silent = false) {
    const prevIndex = this.index;
    this.index = ((i % 6) + 6) % 6;

    if (!silent) {
      if (this.zoomed) this.closePopup();
      if (this.isMobile) this.closeMobileSheet();
    }

    // Set progress token
    this.style.setProperty('--rw-progress', ((this.index + 1) / 6).toFixed(3));

    // Update heroes
    this.heroes.forEach((h, idx) => {
      if (idx === this.index) {
        h.classList.add('is-on');
        h.classList.remove('was');
        h.removeAttribute('aria-hidden');
        const zoomBtn = h.querySelector<HTMLElement>('[data-rw-zoom]');
        if (zoomBtn) zoomBtn.tabIndex = 0;
      } else if (idx === prevIndex && !silent) {
        h.classList.remove('is-on');
        h.classList.add('was');
        h.setAttribute('aria-hidden', 'true');
        const zoomBtn = h.querySelector<HTMLElement>('[data-rw-zoom]');
        if (zoomBtn) zoomBtn.tabIndex = -1;
      } else {
        h.classList.remove('is-on', 'was');
        h.setAttribute('aria-hidden', 'true');
        const zoomBtn = h.querySelector<HTMLElement>('[data-rw-zoom]');
        if (zoomBtn) zoomBtn.tabIndex = -1;
      }
    });

    // Update body accessibility
    const targetRound = Math.round(this.target);
    this.bodies.forEach((b) => {
      const a = parseInt(b.getAttribute('data-index') || '0', 10);
      const hit = b.querySelector<HTMLElement>('.rw__hit');
      let k = a - targetRound;
      if (!this.isMobile) {
        k = ((k % 12) + 12) % 12;
        if (k > 6) k -= 12;
        const activeA11y = k !== 0 && Math.abs(k) <= 2;
        if (hit) hit.tabIndex = activeA11y ? 0 : -1;
        if (activeA11y) b.removeAttribute('aria-hidden');
        else b.setAttribute('aria-hidden', 'true');
      } else {
        const goal = wrapN(a - targetRound, 12);
        const activeA11y = goal !== 0 && goal <= 3;
        if (hit) hit.tabIndex = activeA11y ? 0 : -1;
        if (activeA11y) b.removeAttribute('aria-hidden');
        else b.setAttribute('aria-hidden', 'true');
      }
    });

    // Update ticks
    this.ticks.forEach((tick, idx) => {
      const isCur = idx === this.index;
      tick.setAttribute('aria-current', isCur ? 'true' : 'false');
      if (idx < this.index) {
        tick.classList.add('is-past');
      } else {
        tick.classList.remove('is-past');
      }
    });

    // Update panels
    this.panels.forEach((p, idx) => {
      if (idx === this.index) {
        p.removeAttribute('hidden');
        if (!silent) {
          p.classList.remove('is-in');
          void p.offsetHeight; // force reflow
          p.classList.add('is-in');
        } else {
          p.classList.add('is-in');
        }
      } else {
        p.setAttribute('hidden', '');
        p.classList.remove('is-in');
      }
    });

    // Update pieces label
    if (this.piecesLabel) {
      this.piecesLabel.textContent = '3 pieces';
      if (!silent) {
        this.piecesLabel.classList.remove('is-swap');
        void this.piecesLabel.offsetHeight;
        this.piecesLabel.classList.add('is-swap');
      }
    }

    // Update navigation look names on buttons
    const prevLook = LOOKS[(this.index + 5) % 6];
    const nextLook = LOOKS[(this.index + 1) % 6];
    if (this.prevNameEl) this.prevNameEl.textContent = `${prevLook.lookNum} ${prevLook.name}`;
    if (this.nextNameEl) this.nextNameEl.textContent = `${nextLook.lookNum} ${nextLook.name}`;
    if (this.prevBtn) this.prevBtn.setAttribute('aria-label', `Previous: Look ${prevLook.lookNum} ${prevLook.name}`);
    if (this.nextBtn) this.nextBtn.setAttribute('aria-label', `Next: Look ${nextLook.lookNum} ${nextLook.name}`);

    // Clear hot states
    this.clearHot();

    if (!silent) {
      // Replay sweep
      this.stageEl.classList.remove('is-sweep');
      void this.stageEl.offsetHeight;
      this.stageEl.classList.add('is-sweep');

      // Announce look in live region
      if (this.liveRegion) {
        this.liveRegion.textContent = `Look ${this.index + 1}: ${LOOKS[this.index].name}`;
      }
    }

    this.restartAutoplayBar();
    this.kick();
  }

  public next() {
    this.moveTo(Math.round(this.target) + 1);
  }

  public prev() {
    this.moveTo(Math.round(this.target) - 1);
  }

  public go(i: number) {
    const d = shortestIndexDelta(i, this.index, 6);
    this.moveTo(Math.round(this.target) + d);
  }

  public moveTo(T: number) {
    this.target = T;
    this.setStill(false);
    this.setIndex(((T % 6) + 6) % 6);
  }

  /* ------------------------------------------------------------------------
   * Autoplay
   * ------------------------------------------------------------------------ */
  private play(start: boolean) {
    this.playing = start;
    if (start) {
      this.classList.add('is-playing');
      this.autoBtn?.setAttribute('aria-pressed', 'true');
      this.restartAutoplayBar();
      this.scheduleAutoplay();
    } else {
      this.classList.remove('is-playing');
      this.autoBtn?.setAttribute('aria-pressed', 'false');
      if (this.autoTimer) clearTimeout(this.autoTimer);
      this.ticks.forEach((t) => t.classList.remove('is-run'));
    }
  }

  private restartAutoplayBar() {
    if (!this.playing) return;
    this.ticks.forEach((t) => t.classList.remove('is-run'));
    const curTick = this.ticks[this.index];
    if (curTick) {
      void curTick.offsetHeight;
      curTick.classList.add('is-run');
    }
    this.scheduleAutoplay();
  }

  private scheduleAutoplay() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (!this.playing) return;

    this.autoTimer = window.setTimeout(() => {
      const canAdvance =
        this.playing &&
        this.isVisible &&
        !this.isDragging &&
        !document.hidden &&
        !this.panelHover &&
        !this.zoomed &&
        !this.engaged;

      if (canAdvance) {
        this.next();
      } else {
        this.restartAutoplayBar();
      }
    }, this.speed);
  }

  private engage() {
    this.engaged = true;
    this.play(false);
  }

  /* ------------------------------------------------------------------------
   * Hot Linking & Pins
   * ------------------------------------------------------------------------ */
  private clearHot() {
    this.querySelectorAll('.is-hot').forEach((el) => el.classList.remove('is-hot'));
  }

  public hot(n: number, scroll = false) {
    this.clearHot();

    // Pin in popup or hero
    const activePin = (this.zoomed ? this.lbEl : this.heroes[this.index])?.querySelector(
      `.rw__pin[data-rw-pin="${n}"]`
    );
    activePin?.classList.add('is-hot');

    // Panel row
    const activePanel = this.panels[this.index];
    const row = activePanel?.querySelector<HTMLElement>(`.rw__item[data-rw-card="${n}"]`);
    if (row) {
      row.classList.add('is-hot');
      if (scroll) {
        const list = activePanel.querySelector<HTMLElement>('.rw__items');
        if (this.isMobile && list) {
          const cardLeft = row.getBoundingClientRect().left;
          const listLeft = list.getBoundingClientRect().left;
          list.scrollBy({ left: cardLeft - listLeft - 20, behavior: 'smooth' });
        } else if (list && list.scrollHeight > list.clientHeight) {
          const offset = row.offsetTop - list.offsetTop - 12;
          list.scrollTo({ top: offset, behavior: 'smooth' });
        } else {
          const rect = row.getBoundingClientRect();
          if (rect.top < 0 || rect.bottom > window.innerHeight - 140) {
            window.scrollBy({ top: rect.top - 0.3 * window.innerHeight, behavior: 'smooth' });
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------------------
   * Render Loop
   * ------------------------------------------------------------------------ */
  private kick() {
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.renderLoop.bind(this));
    }
  }

  private renderLoop(time: number) {
    this.rafId = 0;
    if (!this.isVisible) {
      this.lastTime = 0;
      return;
    }

    let delta = this.lastTime ? time - this.lastTime : 16.67;
    this.lastTime = time;
    delta = Math.min(100, Math.max(1, delta));

    let stillNow = true;

    if (!this.isMobile) {
      const K = 95;
      const C = 19.4868;

      while (delta > 0) {
        const stepDelta = Math.min(34, delta);
        delta -= stepDelta;
        const dt = stepDelta / 1000;
        const subSteps = 3;
        const h = dt / subSteps;

        for (let s = 0; s < subSteps; s++) {
          const acc = -K * (this.cur - this.target) - C * this.vel;
          this.vel += acc * h;
          this.cur += this.vel * h;
        }

        if (Math.abs(this.cur - this.target) <= 0.001 && Math.abs(this.vel) <= 0.001) {
          this.cur = this.target;
          this.vel = 0;
          break;
        }
      }

      if (this.cur !== this.target || this.vel !== 0) {
        stillNow = false;
      }

      this.setStill(stillNow);
      this.renderRing();
    } else {
      const K = 95;
      const C = 19.4868;

      while (delta > 0) {
        const stepDelta = Math.min(34, delta);
        delta -= stepDelta;
        const dt = stepDelta / 1000;
        const subSteps = 3;
        const h = dt / subSteps;

        this.classicStates.forEach((st, i) => {
          const goal = wrapN(i - this.target, 12);

          if (Math.abs(goal - st.g) > 6) {
            st.from = st.x;
            st.trip = true;
          }

          const tau = this.isDragging ? 0.016 : st.trip ? 0.1 : 0.03 + 0.04 * Math.min(goal, 4);
          st.g += (goal - st.g) * (1 - Math.exp(-dt / tau));

          for (let s = 0; s < subSteps; s++) {
            const acc = -K * (st.x - st.g) - C * st.vel;
            st.vel += acc * h;
            st.x += st.vel * h;
          }

          if (Math.abs(st.x - goal) > 0.001 || Math.abs(st.vel) > 0.001) {
            stillNow = false;
          } else {
            st.x = goal;
            st.vel = 0;
          }

          if (Math.abs(st.x - goal) < 0.02) {
            st.trip = false;
          }
        });
      }

      this.setStill(stillNow);
      this.renderClassic();
    }

    if (!stillNow || this.isDragging) {
      this.kick();
    }
  }

  private renderRing() {
    this.bodies.forEach((body, a) => {
      const slot = computeRingSlot(
        a,
        this.cur,
        this.stageW,
        this.stageH,
        false,
        this.fs,
        this.still
      );
      this.put(body, slot.x, slot.bottom, slot.scale, slot.opacity, slot.blur, slot.zIndex);
    });
  }

  private renderClassic() {
    this.bodies.forEach((body, i) => {
      const st = this.classicStates[i];
      const slot = computeClassicSlot(st.x, this.stageW, this.still);
      this.put(body, slot.x, slot.bottom, slot.scale, slot.opacity, slot.blur, slot.zIndex);
    });
  }

  private put(
    el: HTMLElement,
    x: number,
    bottom: number,
    scale: number,
    opacity: number,
    blur: number,
    zIndex: number
  ) {
    const w = el.offsetWidth || this.modelH * 0.5625;
    if (x + (w * scale) / 2 < -4 || x - (w * scale) / 2 > this.stageW + 4) {
      opacity = 0;
    }

    el.style.transform = `translate3d(${x.toFixed(1)}px, ${(-bottom).toFixed(1)}px, 0) translateX(-50%) scale(${scale.toFixed(3)})`;
    el.style.opacity = opacity.toFixed(3);
    el.style.zIndex = String(zIndex);
    el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = opacity < 0.5 ? 'none' : 'auto';

    if (blur > 0.05) {
      el.style.filter = `blur(${blur.toFixed(1)}px)`;
    } else {
      el.style.filter = '';
    }
  }

  /* ------------------------------------------------------------------------
   * Custom Cursor
   * ------------------------------------------------------------------------ */
  private initCursor() {
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasFinePointer) {
      this.cursorEl?.remove();
      this.cursorEl = null;
      return;
    }

    this.classList.add('rw--cursor');

    const updateCursor = () => {
      this.cursorRafId = 0;
      if (!this.cursorEl) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lerp = prefersReduced ? 1 : 0.18;

      this.cursorX += (this.targetCursorX - this.cursorX) * lerp;
      this.cursorY += (this.targetCursorY - this.cursorY) * lerp;

      this.cursorEl.style.transform = `translate3d(${this.cursorX.toFixed(1)}px, ${this.cursorY.toFixed(1)}px, 0)`;

      if (
        Math.abs(this.targetCursorX - this.cursorX) > 0.2 ||
        Math.abs(this.targetCursorY - this.cursorY) > 0.2
      ) {
        this.cursorRafId = requestAnimationFrame(updateCursor);
      }
    };

    this.stageEl.addEventListener('pointerenter', (e) => {
      const rect = this.stageEl.getBoundingClientRect();
      this.cursorX = this.targetCursorX = e.clientX - rect.left;
      this.cursorY = this.targetCursorY = e.clientY - rect.top;
      this.cursorEl?.classList.add('is-on');
      updateCursor();
    });

    this.stageEl.addEventListener('pointerleave', () => {
      this.cursorEl?.classList.remove('is-on', 'is-view', 'is-link');
    });

    this.stageEl.addEventListener('pointermove', (e) => {
      const rect = this.stageEl.getBoundingClientRect();
      this.targetCursorX = e.clientX - rect.left;
      this.targetCursorY = e.clientY - rect.top;

      if (!this.cursorRafId) {
        this.cursorRafId = requestAnimationFrame(updateCursor);
      }

      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('.rw__pin')) {
        this.cursorEl?.classList.add('is-link');
        this.cursorEl?.classList.remove('is-view');
      } else {
        this.cursorEl?.classList.add('is-view');
        this.cursorEl?.classList.remove('is-link');
      }
    });
  }

  /* ------------------------------------------------------------------------
   * Event Bindings
   * ------------------------------------------------------------------------ */
  private bindEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      if (this.debouncedResizeTimer) clearTimeout(this.debouncedResizeTimer);
      this.debouncedResizeTimer = window.setTimeout(() => {
        this.measure();
        this.kick();
      }, 120);
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.measure();
      this.kick();
    });
    this.resizeObserver.observe(this.stageEl);

    // Panel hover
    const panelCol = this.querySelector('.rw__panel');
    panelCol?.addEventListener('pointerenter', () => {
      this.panelHover = true;
    });
    panelCol?.addEventListener('pointerleave', () => {
      this.panelHover = false;
      this.restartAutoplayBar();
    });

    // Engagement triggers
    this.panelInnerEl.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('button, a, input, select, label')) {
        this.engage();
      }
    });
    this.panelInnerEl.addEventListener('change', () => {
      this.engage();
    });

    // Keep vertical page scrolling available while supporting horizontal look swipes.
    this.stageEl.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || (e.target as HTMLElement).closest('button, a')) return;
      this.swipeStartX = e.clientX;
      this.swipeStartY = e.clientY;
      this.swipePointerId = e.pointerId;
      this.stageEl.setPointerCapture(e.pointerId);
    });

    const finishSwipe = (e: PointerEvent) => {
      if (e.pointerId !== this.swipePointerId) return;
      this.swipePointerId = -1;
      if (this.stageEl.hasPointerCapture(e.pointerId)) {
        this.stageEl.releasePointerCapture(e.pointerId);
      }

      const deltaX = e.clientX - this.swipeStartX;
      const deltaY = e.clientY - this.swipeStartY;
      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

      this.engage();
      if (deltaX < 0) this.next();
      else this.prev();
    };

    this.stageEl.addEventListener('pointerup', finishSwipe);
    this.stageEl.addEventListener('pointercancel', finishSwipe);

    // Trackpad horizontal wheel
    this.stageEl.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          if (performance.now() < this.wheelLockUntil) return;
          this.wheelAcc += e.deltaX;
          if (Math.abs(this.wheelAcc) > 45) {
            if (this.wheelAcc > 0) this.next();
            else this.prev();
            this.wheelAcc = 0;
            this.wheelLockUntil = performance.now() + 520;
          }
        }
      },
      { passive: false }
    );

    // Keyboard navigation
    this.stageEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.sheetHost) {
          this.closeMobileSheet();
        } else if (this.zoomed) {
          this.closePopup();
        }
      }
    });

    // Click Delegation Router
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // 1. Pick close
      if (target.closest('[data-rw-pick-close]')) {
        e.preventDefault();
        if (this.isMobile) this.closeMobileSheet();
        else this.closeActiveCardPicker(target.closest('.rw__item'));
        return;
      }

      // 2. Popup close
      if (target.closest('[data-rw-zoom-close]')) {
        e.preventDefault();
        this.closePopup();
        return;
      }

      // 3. Click on popup backdrop/stage beside model
      if (this.zoomed && target.classList.contains('rw__lb-stage')) {
        this.closePopup();
        return;
      }

      // 4. Zoom button
      if (target.closest('[data-rw-zoom]')) {
        e.preventDefault();
        this.openPopup();
        return;
      }

      // 5. Next
      if (target.closest('[data-rw-next]')) {
        e.preventDefault();
        this.engage();
        this.next();
        return;
      }

      // 6. Prev
      if (target.closest('[data-rw-prev]')) {
        e.preventDefault();
        this.engage();
        this.prev();
        return;
      }

      // 7. Tick
      const tickBtn = target.closest<HTMLElement>('[data-rw-tick]');
      if (tickBtn) {
        e.preventDefault();
        this.engage();
        const tickIdx = parseInt(tickBtn.getAttribute('data-rw-tick') || '0', 10);
        this.go(tickIdx);
        return;
      }

      // 8. Autoplay toggle
      if (target.closest('[data-rw-auto]')) {
        e.preventDefault();
        if (!this.playing) {
          this.engaged = false;
        }
        this.play(!this.playing);
        return;
      }

      // 9. Pin
      const pinBtn = target.closest<HTMLElement>('.rw__pin');
      if (pinBtn) {
        e.preventDefault();
        this.engage();
        const pinNum = parseInt(pinBtn.getAttribute('data-rw-pin') || '1', 10);
        this.hot(pinNum, true);
        return;
      }

      // 10. Queue body hit
      const hitBtn = target.closest<HTMLElement>('.rw__hit');
      if (hitBtn) {
        e.preventDefault();
        const bodyEl = hitBtn.closest<HTMLElement>('.rw__model');
        const a = parseInt(bodyEl?.getAttribute('data-index') || '0', 10);
        const targetRound = Math.round(this.target);
        let k = a - targetRound;
        k = ((k % 12) + 12) % 12;
        if (k > 6) k -= 12;

        if (k !== 0 && Math.abs(k) < 6) {
          this.moveTo(targetRound + k);
        } else if (k === 0) {
          this.openPopup();
        }
        return;
      }

      // 11. Size confirm
      const confirmBtn = target.closest<HTMLElement>('[data-rw-confirm]');
      if (confirmBtn) {
        e.preventDefault();
        this.handleConfirm(confirmBtn);
        return;
      }

      // 12. Plus button
      const addBtn = target.closest<HTMLElement>('[data-rw-add]');
      if (addBtn) {
        e.preventDefault();
        this.handlePlusToggle(addBtn);
        return;
      }

      // 13. Add full look
      const ctaBtn = target.closest<HTMLElement>('[data-rw-all]');
      if (ctaBtn) {
        e.preventDefault();
        this.handleAddFullLook();
        return;
      }
    });

    // Panel row hover hot-linking
    this.panelInnerEl.addEventListener('pointerover', (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.rw__item');
      if (row) {
        const cardNum = parseInt(row.getAttribute('data-rw-card') || '1', 10);
        this.hot(cardNum, false);
      }
    });

    this.panelInnerEl.addEventListener('pointerout', (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.rw__item');
      if (row) {
        const related = e.relatedTarget as HTMLElement | null;
        if (!row.contains(related)) {
          this.clearHot();
        }
      }
    });

    // Option radio change
    this.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.type === 'radio' && input.name.startsWith('Opt-')) {
        const picker = input.closest<HTMLElement>('.rw__picker');
        if (picker) {
          this.updatePickerOptionState(picker);
          const card = picker.closest<HTMLElement>('.rw__item') || this.activePickingCard;
          if (card) {
            card.dataset.touched = '1';
          }
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
   * Size Picker & Item Add Logic
   * ------------------------------------------------------------------------ */
  private handlePlusToggle(addBtn: HTMLElement) {
    const card = addBtn.closest<HTMLElement>('.rw__item');
    if (!card || card.classList.contains('is-added')) return;

    if (this.isMobile) {
      this.openMobileSheet(card);
    } else {
      const isPicking = card.classList.contains('is-picking');
      if (isPicking) {
        this.closeActiveCardPicker(card);
      } else {
        this.openActiveCardPicker(card);
      }
    }
  }

  private openActiveCardPicker(card: HTMLElement) {
    card.classList.add('is-picking');
    const addBtn = card.querySelector<HTMLElement>('[data-rw-add]');
    addBtn?.setAttribute('aria-expanded', 'true');
    const picker = card.querySelector<HTMLElement>('.rw__picker');
    if (picker) {
      picker.removeAttribute('hidden');
      this.updatePickerOptionState(picker);
      const checkedRadio = picker.querySelector<HTMLInputElement>('input[type="radio"]:checked');
      checkedRadio?.focus({ preventScroll: true });
    }
  }

  private closeActiveCardPicker(card: HTMLElement | null) {
    if (!card) return;
    card.classList.remove('is-picking');
    const addBtn = card.querySelector<HTMLElement>('[data-rw-add]');
    addBtn?.setAttribute('aria-expanded', 'false');
    const picker = card.querySelector<HTMLElement>('.rw__picker');
    picker?.setAttribute('hidden', '');
  }

  private openMobileSheet(card: HTMLElement) {
    this.closeMobileSheet();
    this.activePickingCard = card;
    card.classList.add('is-picking');

    const picker = card.querySelector<HTMLElement>('.rw__picker');
    if (!picker) return;

    this.sheetHost = document.createElement('div');
    this.sheetHost.className = 'rw-sheet-host';

    const scrim = document.createElement('button');
    scrim.className = 'rw__pick-scrim';
    scrim.setAttribute('data-rw-pick-close', '');
    scrim.tabIndex = -1;
    scrim.setAttribute('aria-hidden', 'true');
    this.sheetHost.appendChild(scrim);

    this.sheetHost.appendChild(picker);
    picker.removeAttribute('hidden');
    this.updatePickerOptionState(picker);

    document.body.appendChild(this.sheetHost);
    void this.sheetHost.offsetHeight;
    this.sheetHost.classList.add('is-open');
    this.classList.add('rw--picking');

    // Scrim close click
    scrim.addEventListener('click', () => this.closeMobileSheet());

    this.sheetHost.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const confirmBtn = target.closest<HTMLElement>('[data-rw-confirm]');
      if (confirmBtn) {
        event.preventDefault();
        this.handleConfirm(confirmBtn);
      }
    });
    this.sheetHost.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      if (input.type !== 'radio' || !input.name.startsWith('Opt-')) return;
      this.updatePickerOptionState(picker);
      this.activePickingCard?.setAttribute('data-touched', '1');
    });
  }

  private closeMobileSheet() {
    if (!this.sheetHost || !this.activePickingCard) return;
    const picker = this.sheetHost.querySelector<HTMLElement>('.rw__picker');
    if (picker) {
      picker.setAttribute('hidden', '');
      this.activePickingCard.appendChild(picker);
    }
    this.activePickingCard.classList.remove('is-picking');
    const addBtn = this.activePickingCard.querySelector<HTMLElement>('[data-rw-add]');
    addBtn?.setAttribute('aria-expanded', 'false');

    this.sheetHost.remove();
    this.sheetHost = null;
    this.activePickingCard = null;
    this.classList.remove('rw--picking');
  }

  private updatePickerOptionState(picker: HTMLElement) {
    const card = picker.closest<HTMLElement>('.rw__item') || this.activePickingCard;
    const variantsScript = picker.querySelector<HTMLScriptElement>('[data-rw-variants]');
    if (!variantsScript) return;

    let variants: Array<{ id: number; a: boolean; o: string[] }> = [];
    try {
      variants = JSON.parse(variantsScript.textContent || '[]');
    } catch {
      return;
    }

    const checkedInput = picker.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    const selectedVal = checkedInput?.value;

    const matchedVariant = variants.find((v) => v.o[0] === selectedVal && v.a);
    const confirmBtn = picker.querySelector<HTMLButtonElement>('[data-rw-confirm]');

    if (matchedVariant) {
      if (card) card.dataset.selected = String(matchedVariant.id);
      if (confirmBtn) {
        confirmBtn.disabled = false;
        const lbl = confirmBtn.querySelector('[data-rw-confirm-label]');
        if (lbl) lbl.textContent = 'Add to bag';
      }
    } else {
      if (card) delete card.dataset.selected;
      if (confirmBtn) {
        confirmBtn.disabled = true;
        const lbl = confirmBtn.querySelector('[data-rw-confirm-label]');
        if (lbl) lbl.textContent = 'Sold out';
      }
    }
  }

  private handleConfirm(confirmBtn: HTMLElement) {
    const picker = confirmBtn.closest<HTMLElement>('.rw__picker');
    const card = picker?.closest<HTMLElement>('.rw__item') || this.activePickingCard;
    if (!card) return;

    card.dataset.touched = '1';
    const variantIdStr = card.dataset.selected;
    if (!variantIdStr) return;

    const variantId = parseInt(variantIdStr, 10);
    this.executeAddPiece(card, variantId);
  }

  private executeAddPiece(card: HTMLElement, variantId: number) {
    card.classList.add('is-loading');

    setTimeout(() => {
      try {
        const stored = this.loadBag();
        const updated = addToBag(stored, [{ id: variantId, quantity: 1 }]);
        this.saveBag(updated);

        card.classList.remove('is-loading');
        card.classList.add('is-added');

        const addBtn = card.querySelector<HTMLElement>('[data-rw-add]');
        if (addBtn) {
          const addedLabel = addBtn.getAttribute('data-added-label') || 'Added to bag';
          addBtn.setAttribute('aria-label', addedLabel);
          addBtn.removeAttribute('aria-expanded');
        }

        if (this.isMobile) {
          this.closeMobileSheet();
        } else {
          this.closeActiveCardPicker(card);
        }

        this.showToast('Piece saved to your styling bag');
        this.updateCartCount();
        this.checkPanelCompletion();

        if (navigator.vibrate) {
          navigator.vibrate(12);
        }
      } catch {
        card.classList.remove('is-loading');
        this.showToast(this.dataset.msgError || 'Couldn’t add to bag. Please try again.');
      }
    }, 400);
  }

  private handleAddFullLook() {
    const activePanel = this.panels[this.index];
    if (!activePanel || activePanel.classList.contains('is-complete')) return;

    const ctaBtn = activePanel.querySelector<HTMLElement>('[data-rw-all]');
    if (ctaBtn?.classList.contains('is-loading')) return;

    const msgEl = activePanel.querySelector<HTMLElement>('[data-rw-msg]');
    if (msgEl) msgEl.textContent = '';

    const cards = Array.from(activePanel.querySelectorAll<HTMLElement>('.rw__item'));
    const unaddedCards = cards.filter((c) => !c.classList.contains('is-added'));

    const readyCards: HTMLElement[] = [];
    const pendingCards: HTMLElement[] = [];

    unaddedCards.forEach((card) => {
      const isTouched = card.dataset.touched === '1';
      const variantId = card.dataset.selected;
      if (isTouched && variantId) {
        readyCards.push(card);
      } else {
        pendingCards.push(card);
      }
    });

    if (pendingCards.length > 0) {
      if (this.isMobile) {
        this.openMobileSheet(pendingCards[0]);
      } else {
        pendingCards.forEach((c) => this.openActiveCardPicker(c));
        pendingCards[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (msgEl) {
        const titles = pendingCards.map((c) => c.getAttribute('data-title') || '').join(', ');
        const tmpl = this.dataset.msgChoose || 'Pick a size for: [items]';
        msgEl.textContent = tmpl.replace('[items]', titles);
      }
    }

    if (readyCards.length > 0) {
      ctaBtn?.classList.add('is-loading');
      readyCards.forEach((c) => c.classList.add('is-loading'));

      setTimeout(() => {
        try {
          const stored = this.loadBag();
          const itemsToAdd = readyCards.map((c) => ({
            id: parseInt(c.dataset.selected || '0', 10),
            quantity: 1,
          }));
          const updated = addToBag(stored, itemsToAdd);
          this.saveBag(updated);

          ctaBtn?.classList.remove('is-loading');
          readyCards.forEach((c) => {
            c.classList.remove('is-loading');
            c.classList.add('is-added');
            const addBtn = c.querySelector<HTMLElement>('[data-rw-add]');
            if (addBtn) {
              const addedLabel = addBtn.getAttribute('data-added-label') || 'Added to bag';
              addBtn.setAttribute('aria-label', addedLabel);
              addBtn.removeAttribute('aria-expanded');
            }
          });

          this.showToast('Look saved to your styling bag');
          this.updateCartCount();
          this.checkPanelCompletion();
        } catch {
          ctaBtn?.classList.remove('is-loading');
          readyCards.forEach((c) => c.classList.remove('is-loading'));
        }
      }, 500);
    }
  }

  private checkPanelCompletion() {
    const activePanel = this.panels[this.index];
    if (!activePanel) return;
    const cards = Array.from(activePanel.querySelectorAll<HTMLElement>('.rw__item'));
    const allAdded = cards.length >= 2 && cards.every((c) => c.classList.contains('is-added'));
    if (allAdded) {
      activePanel.classList.add('is-complete');
      const msgEl = activePanel.querySelector<HTMLElement>('[data-rw-msg]');
      if (msgEl) msgEl.textContent = '';
    }
  }

  /* ------------------------------------------------------------------------
   * View Look Popup (Lightbox)
   * ------------------------------------------------------------------------ */
  private openPopup() {
    this.engage();
    this.clearHot();
    this.zoomed = true;

    const currentHero = this.heroes[this.index];
    const figure = currentHero.querySelector<HTMLElement>('.rw__figure');
    const shadow = currentHero.querySelector<HTMLElement>('.rw__shadow');
    if (!figure || !shadow) return;

    this.lbStageEl.innerHTML = '';

    const modelWrap = document.createElement('div');
    modelWrap.className = 'rw__lb-model';

    const clonedShadow = shadow.cloneNode(true) as HTMLElement;
    const clonedFigure = figure.cloneNode(true) as HTMLElement;

    // Remove zoom button from clone
    clonedFigure.querySelector('[data-rw-zoom]')?.remove();

    // Enable tabIndex on popup pins
    clonedFigure.querySelectorAll<HTMLElement>('.rw__pin').forEach((pin) => {
      pin.tabIndex = 0;
    });

    // Copy foot token
    const footVal = currentHero.style.getPropertyValue('--rw-foot') || '0';
    modelWrap.style.setProperty('--rw-foot', footVal);

    modelWrap.appendChild(clonedShadow);
    modelWrap.appendChild(clonedFigure);
    this.lbStageEl.appendChild(modelWrap);

    // Set height token
    const stageRect = this.lbStageEl.getBoundingClientRect();
    const h = Math.max(160, Math.min(stageRect.height, stageRect.width / 0.5625));
    modelWrap.style.setProperty('--rw-model-h', `${h}px`);

    const img = clonedFigure.querySelector('img');
    if (img) {
      img.sizes = `${Math.round(h * 0.5625)}px`;
      img.loading = 'eager';
      img.classList.add('is-decoded');
    }

    // Set text
    this.lbKickerEl.textContent = `LOOK ${LOOKS[this.index].lookNum}`;
    this.lbNameEl.textContent = LOOKS[this.index].name;

    // FLIP grow animation
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      const a = figure.getBoundingClientRect();
      const b = clonedFigure.getBoundingClientRect();
      modelWrap.style.transformOrigin = '0 100%';
      modelWrap.style.transition = 'none';
      modelWrap.style.transform = `translate3d(${(a.left - b.left).toFixed(1)}px, ${(a.bottom - b.bottom).toFixed(1)}px, 0) scale(${(a.height / b.height).toFixed(3)})`;
      void modelWrap.offsetHeight;
      modelWrap.style.transition = 'transform .95s var(--rw-ease)';
      modelWrap.style.transform = '';
    }

    this.classList.add('rw--zoom');
    this.lbEl.removeAttribute('aria-hidden');
    this.lbCloseBtn.focus();
  }

  private closePopup() {
    if (!this.zoomed) return;
    this.zoomed = false;

    const currentHero = this.heroes[this.index];
    const figure = currentHero.querySelector<HTMLElement>('.rw__figure');
    const modelWrap = this.lbStageEl.querySelector<HTMLElement>('.rw__lb-model');
    const clonedFigure = modelWrap?.querySelector<HTMLElement>('.rw__figure');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced && figure && clonedFigure && modelWrap) {
      const a = figure.getBoundingClientRect();
      const b = clonedFigure.getBoundingClientRect();
      modelWrap.style.transformOrigin = '0 100%';
      modelWrap.style.transition = 'transform .95s var(--rw-ease)';
      modelWrap.style.transform = `translate3d(${(a.left - b.left).toFixed(1)}px, ${(a.bottom - b.bottom).toFixed(1)}px, 0) scale(${(a.height / b.height).toFixed(3)})`;
    }

    this.classList.remove('rw--zoom');
    this.lbEl.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      this.lbStageEl.innerHTML = '';
    }, 950);

    this.stageEl.focus();
  }

  /* ------------------------------------------------------------------------
   * Styling Bag & Toast
   * ------------------------------------------------------------------------ */
  private loadBag(): StylingBagItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return validateBagItems(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  private saveBag(items: StylingBagItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage error handled
    }
  }

  private initBag() {
    this.updateCartCount();

    const openBagBtn = document.getElementById('open-bag');
    const bagDialog = document.getElementById('bag-dialog') as HTMLDialogElement | null;
    const closeBagBtn = document.getElementById('close-bag');
    const exportBtn = document.getElementById('export-bag') as HTMLButtonElement | null;

    openBagBtn?.addEventListener('click', () => {
      window.location.hash = '#cart';
    });

    closeBagBtn?.addEventListener('click', () => {
      bagDialog?.close();
    });

    bagDialog?.addEventListener('click', (e) => {
      if (e.target === bagDialog) {
        bagDialog.close();
      }
    });

    exportBtn?.addEventListener('click', () => {
      this.downloadShortlist();
    });
  }

  private updateCartCount() {
    const items = this.loadBag();
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
    });
  }

  private showToast(msg: string) {
    const toast = document.getElementById('bag-status');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    setTimeout(() => {
      toast.classList.remove('is-on');
    }, 2500);
  }

  private renderBagDialog() {
    const container = document.getElementById('bag-items');
    const totalEl = document.getElementById('bag-total');
    const exportBtn = document.getElementById('export-bag') as HTMLButtonElement | null;
    if (!container) return;

    const items = this.loadBag();
    container.innerHTML = '';

    if (items.length === 0) {
      container.innerHTML = `<p class="bag-note">Your styling bag is empty. Choose a size beside a piece to save it.</p>`;
      if (totalEl) totalEl.textContent = '';
      if (exportBtn) exportBtn.disabled = true;
      return;
    }

    if (exportBtn) exportBtn.disabled = false;

    let subtotal = 0;

    items.forEach((entry) => {
      // Find matching product
      let matchedProd: ProductItem | null = null;
      let matchedSize = '';

      for (const prod of Object.values(PRODUCTS)) {
        const v = prod.variants.find((v) => v.id === entry.id);
        if (v) {
          matchedProd = prod;
          matchedSize = v.o[0];
          break;
        }
      }

      if (!matchedProd) return;

      subtotal += toGhs(matchedProd.price) * entry.quantity;

      const row = document.createElement('div');
      row.className = 'bag-row';

      const img = document.createElement('img');
      img.src = matchedProd.image;
      img.alt = matchedProd.name;

      const details = document.createElement('div');
      details.className = 'bag-row-details';
      details.innerHTML = `
        <h3>${matchedProd.name}</h3>
        <p>Size ${matchedSize} · Quantity ${entry.quantity} · ${formatGhs(toGhs(matchedProd.price))}</p>
        <a href="${matchedProd.url}">View piece details</a>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'bag-remove';
      removeBtn.setAttribute('aria-label', `Remove ${matchedProd.name}`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        const updated = this.loadBag().filter((i) => i.id !== entry.id);
        this.saveBag(updated);
        this.updateCartCount();
        this.renderBagDialog();
      });

      row.appendChild(img);
      row.appendChild(details);
      row.appendChild(removeBtn);
      container.appendChild(row);
    });

    if (totalEl) {
      totalEl.textContent = `Subtotal: ${formatGhs(subtotal)}`;
    }
  }

  private downloadShortlist() {
    const items = this.loadBag();
    if (items.length === 0) return;

    const listData: Array<{
      name: string;
      size: string;
      quantity: number;
      url: string;
    }> = [];

    items.forEach((entry) => {
      for (const prod of Object.values(PRODUCTS)) {
        const v = prod.variants.find((v) => v.id === entry.id);
        if (v) {
          listData.push({
            name: prod.name,
            size: v.o[0],
            quantity: entry.quantity,
            url: prod.url,
          });
          break;
        }
      }
    });

    const text = generateShortlistText(listData);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runway-outfit-shortlist.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

if (!customElements.get('runway-section')) {
  customElements.define('runway-section', RunwaySection);
}
