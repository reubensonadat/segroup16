import { PRODUCTS, ProductItem } from '../data';
import { addToBag } from '../runway-logic';
import { getBagItems, saveBagItems, updateGlobalCartCount } from './cart-page';
import { formatGhs, toGhs } from '../currency';

function showToast(message: string) {
  const toast = document.getElementById('bag-status');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('is-on');
    setTimeout(() => toast.classList.remove('is-on'), 2500);
  }
}

export function renderOrbitPage(): string {
  const shoes = [
    {
      item: PRODUCTS['tatum-5-orbit'],
      tag: 'Flagship Edition',
      desc: 'Elephant print accents with crisp premium leather overlays and dual-density heel support.',
    },
    {
      item: PRODUCTS['tatum-5-orbit-copy'],
      tag: 'Air Jordan 12 Retro',
      desc: 'Cream and charcoal tones with muted pink accents engineered for tailored streetwear presence.',
    },
    {
      item: PRODUCTS['air-jordan-12-retro-copy'],
      tag: 'Luka 5 Stealth',
      desc: 'Triple-black matte execution with high-traction radial outsole grooves and sculpted foam cushion.',
    },
  ];

  const shoesHtml = shoes
    .map(({ item, tag, desc }) => {
      const defaultSize = '42';
      const defaultVariant = item.variants.find((v) => v.o[0] === defaultSize) || item.variants[2] || item.variants[0];

      const sizePillsHtml = item.sizes
        .map((s, idx) => {
          const v = item.variants[idx] || item.variants[0];
          const isActive = s === defaultSize;
          return `
            <button
              type="button"
              class="shoe-size-pill ${isActive ? 'is-active' : ''}"
              data-size="${s}"
              data-variant-id="${v.id}"
            >
              ${s}
            </button>
          `;
        })
        .join('');

      return `
        <div class="orbit-card" data-shoe-card data-prod-name="${item.name}">
          <div class="orbit-media">
            <img src="${item.image}" alt="${item.name}" loading="eager" />
            <span class="orbit-tag">${tag}</span>
          </div>
          <div class="orbit-meta">
            <span class="orbit-vendor">${item.vendor}</span>
            <h2 class="orbit-title">${item.name}</h2>
            <p class="orbit-desc">${desc}</p>
            
            <div class="orbit-size-section">
              <span class="orbit-size-label">Select EU Size:</span>
              <div class="orbit-size-pills">
                ${sizePillsHtml}
              </div>
            </div>

            <div class="orbit-action">
              <span class="orbit-price">${formatGhs(toGhs(item.price))}</span>
              <button
                class="brand-btn orbit-btn-add"
                data-add-shoe
                data-variant-id="${defaultVariant.id}"
                data-selected-size="${defaultSize}"
                data-prod-name="${item.name}"
              >
                Add Size ${defaultSize} to Bag
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="brand-page orbit-page">
      <div class="brand-hero">
        <div class="brand-hero-badge">Footwear Innovations 2026</div>
        <h1 class="brand-hero-title">Nike Orbit Series</h1>
        <p class="brand-hero-sub">
          A kinetic low-profile silhouette engineered for streetwear agility and runway presence.
          Featuring dual-density foam midsoles and architectural stitch patterns.
        </p>
      </div>

      <div class="orbit-grid">
        ${shoesHtml}
      </div>

      <div class="brand-banner">
        <h3>Experience on the 3D Stage</h3>
        <p>See how the Nike Orbit series pairs with oversized tailoring and layered knitwear.</p>
        <a href="#home" class="brand-btn brand-btn--dark">Explore 3D Runway</a>
      </div>
    </div>
  `;
}

export function bindOrbitEvents(container: HTMLElement) {
  // Handle shoe size pill selection
  container.querySelectorAll('[data-shoe-card]').forEach((card) => {
    const pills = card.querySelectorAll<HTMLButtonElement>('.shoe-size-pill');
    const addBtn = card.querySelector<HTMLButtonElement>('[data-add-shoe]');
    const prodName = card.getAttribute('data-prod-name') || 'Shoe';

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');

        const size = pill.getAttribute('data-size') || '42';
        const variantId = pill.getAttribute('data-variant-id') || '0';

        if (addBtn) {
          addBtn.setAttribute('data-variant-id', variantId);
          addBtn.setAttribute('data-selected-size', size);
          addBtn.textContent = `Add Size ${size} to Bag`;
        }
      });
    });

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const variantId = parseInt(addBtn.getAttribute('data-variant-id') || '0', 10);
        const size = addBtn.getAttribute('data-selected-size') || '42';
        if (!variantId) return;

        const current = getBagItems();
        const updated = addToBag(current, [{ id: variantId, quantity: 1 }]);
        saveBagItems(updated);
        updateGlobalCartCount();

        showToast(`${prodName} (Size ${size}) added to your styling bag`);

        const origText = addBtn.textContent;
        addBtn.textContent = '✓ Added to Bag';
        setTimeout(() => {
          addBtn.textContent = origText;
        }, 1500);
      });
    }
  });
}

export function renderHandRailPage(): string {
  const featuredGarments: Array<{ key: string; badge: string; desc: string }> = [
    {
      key: 'sweatshirt',
      badge: '480 GSM Fleece',
      desc: 'Dropped shoulder crewneck spun from custom heavyweight cotton fleece with architectural draping.',
    },
    {
      key: 'tshirt',
      badge: 'Heavyweight Jersey',
      desc: 'The definitive oversized tee cut from combed organic cotton jersey with reinforced collar binding.',
    },
    {
      key: 'sweatshirt-plus',
      badge: 'Urban Cut',
      desc: 'Structured oversized fleece layer designed for relaxed layering over vintage washed denim.',
    },
    {
      key: 'hoodie',
      badge: 'Signature Hood',
      desc: 'Double-layered hood with seamless kangaroo pocket and ribbed ergonomic cuffs.',
    },
    {
      key: 'hoodie-black',
      badge: 'Matte Stealth',
      desc: 'Minimalist monochrome hoodie with blind hem stitching and dropped armholes.',
    },
    {
      key: 'tatum-5-orbit',
      badge: 'Orbit Footwear',
      desc: 'Engineered low-profile court silhouette with radial tread outsole and sculptured foam midsole.',
    },
  ];

  const garmentCardsHtml = featuredGarments
    .map(({ key, badge, desc }) => {
      const prod = PRODUCTS[key];
      if (!prod) return '';

      const defaultSize = prod.sizes[0] || 'M';
      const defaultVariant = prod.variants[0];

      const sizePillsHtml = prod.sizes
        .map((s, idx) => {
          const v = prod.variants[idx] || prod.variants[0];
          const isActive = idx === 0;
          return `
            <button
              type="button"
              class="garment-size-pill ${isActive ? 'is-active' : ''}"
              data-size="${s}"
              data-variant-id="${v.id}"
            >
              ${s}
            </button>
          `;
        })
        .join('');

      return `
        <div class="rail-product-card" data-rail-product data-prod-name="${prod.name}">
          <div class="rail-product-media">
            <img src="${prod.image}" alt="${prod.name}" loading="lazy" />
            <span class="rail-product-badge">${badge}</span>
          </div>
          <div class="rail-product-meta">
            <span class="rail-product-type">${prod.type}</span>
            <h3 class="rail-product-title">${prod.name}</h3>
            <p class="rail-product-desc">${desc}</p>
            
            <div class="rail-size-section">
              <span class="rail-size-label">Select ${prod.optionLegend}:</span>
              <div class="rail-size-pills">
                ${sizePillsHtml}
              </div>
            </div>

            <div class="rail-action-row">
              <span class="rail-product-price">${formatGhs(toGhs(prod.price))}</span>
              <button
                class="brand-btn rail-add-btn"
                data-add-garment
                data-variant-id="${defaultVariant.id}"
                data-selected-size="${defaultSize}"
                data-prod-name="${prod.name}"
              >
                Add Size ${defaultSize} to Bag
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="brand-page rail-page">
      <div class="brand-hero">
        <div class="brand-hero-badge">Campaign Lookbook & Pieces</div>
        <h1 class="brand-hero-title">Hand Rail Pro</h1>
        <p class="brand-hero-sub">
          Street culture meets architectural modernism. Hand Rail Pro documents the natural movement
          of heavyweight fleece, dropped-shoulder hoodies, and unstructured wide-leg denim. Explore the campaign and shop each individual piece below.
        </p>
      </div>

      <div class="rail-editorial-grid">
        <div class="rail-feature-card">
          <div class="rail-img-wrap">
            <img src="https://reel-ref-try-the-look.vercel.app/assets/original-look-1.webp" alt="Charcoal Crew & Easy Denim" />
          </div>
          <div class="rail-content">
            <span class="rail-kicker">Look 01 — Urban Movement</span>
            <h2>The City Edit</h2>
            <p>
              Emphasizing proportion and draped volume. Our custom spun 480 GSM cotton fleece provides
              structure without rigidity, falling effortlessly over vintage stone-washed denim.
            </p>
            <a href="#home" class="brand-btn">View in 3D Runway</a>
          </div>
        </div>

        <div class="rail-feature-card rail-feature-card--reverse">
          <div class="rail-img-wrap">
            <img src="https://reel-ref-try-the-look.vercel.app/assets/original-look-5.webp" alt="Clean White Tee & Relaxed Denim" />
          </div>
          <div class="rail-content">
            <span class="rail-kicker">Look 02 — Essential Silhouette</span>
            <h2>Gallery Opening</h2>
            <p>
              The definitive oversized tee cut from combed organic jersey, anchored by the Tatum 5 Orbit.
              Clean lines and subtle contrast stitching define this casual evening staple.
            </p>
            <a href="#home" class="brand-btn">View in 3D Runway</a>
          </div>
        </div>
      </div>

      <div class="rail-section-header">
        <span class="rail-kicker">Individual Garments</span>
        <h2 class="rail-section-title">The Hand Rail Pieces</h2>
        <p class="rail-section-sub">Select your size for each standalone item cut for runway proportion and durability.</p>
      </div>

      <div class="rail-products-grid">
        ${garmentCardsHtml}
      </div>

      <div class="brand-manifesto">
        <blockquote>
          "We treat the street not as a background, but as the runway itself. Every garment is cut to move, turn, and catch light in motion."
        </blockquote>
        <cite>— Nike Runway Design Direction</cite>
      </div>
    </div>
  `;
}

export function bindHandRailEvents(container: HTMLElement) {
  container.querySelectorAll('[data-rail-product]').forEach((card) => {
    const pills = card.querySelectorAll<HTMLButtonElement>('.garment-size-pill');
    const addBtn = card.querySelector<HTMLButtonElement>('[data-add-garment]');
    const prodName = card.getAttribute('data-prod-name') || 'Piece';

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');

        const size = pill.getAttribute('data-size') || 'M';
        const variantId = pill.getAttribute('data-variant-id') || '0';

        if (addBtn) {
          addBtn.setAttribute('data-variant-id', variantId);
          addBtn.setAttribute('data-selected-size', size);
          addBtn.textContent = `Add Size ${size} to Bag`;
        }
      });
    });

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const variantId = parseInt(addBtn.getAttribute('data-variant-id') || '0', 10);
        const size = addBtn.getAttribute('data-selected-size') || 'M';
        if (!variantId) return;

        const current = getBagItems();
        const updated = addToBag(current, [{ id: variantId, quantity: 1 }]);
        saveBagItems(updated);
        updateGlobalCartCount();

        showToast(`${prodName} (Size ${size}) added to your styling bag`);

        const origText = addBtn.textContent;
        addBtn.textContent = '✓ Added to Bag';
        setTimeout(() => {
          addBtn.textContent = origText;
        }, 1500);
      });
    }
  });
}

export function renderGuidePage(): string {
  return `
    <div class="brand-page guide-page">
      <div class="brand-hero">
        <div class="brand-hero-badge">Engineering & Customization</div>
        <h1 class="brand-hero-title">How This Website Is Made</h1>
        <p class="brand-hero-sub">
          A masterclass in 3D fashion e-commerce engineering, mathematical projection, and how to customize this website with your own photos and products.
        </p>
      </div>

      <div class="guide-cards">
        <div class="guide-box">
          <div class="guide-box-num">01</div>
          <h3>The 3D Cylindrical Ring</h3>
          <p>
            Instead of heavy WebGL models that drain mobile batteries, the 3D runway positions 12 model cutouts in a virtual circular ring using CSS 3D transforms.
            Each frame, perspective scaling <code>P / (P + z)</code> and horizon convergence formulas calculate exact stage coordinates, depth blur, and contact shadows.
          </p>
        </div>

        <div class="guide-box">
          <div class="guide-box-num">02</div>
          <h3>How to Add Your Own Pictures</h3>
          <p>
            1. Shoot full-body model photos on a studio backdrop at <strong>9:16 aspect ratio</strong> (1080×1920).<br>
            2. Remove the background to create transparent <strong>.webp</strong> cutouts.<br>
            3. The app includes an automated <strong>HTML5 canvas alpha scanner</strong> that detects the model's shoes and snaps them flush to the runway floor line!
          </p>
        </div>

        <div class="guide-box">
          <div class="guide-box-num">03</div>
          <h3>How to Add Products & Variants</h3>
          <p>
            Edit <code>src/data.ts</code> to configure your products, prices, and available sizes (S, M, L, XL, or shoe sizes 40–46).
            Define interactive pins with percentages (e.g. <code>left: 48%, top: 30%</code>) to connect garments directly to side shopping cards.
          </p>
        </div>

        <div class="guide-box">
          <div class="guide-box-num">04</div>
          <h3>Button Navigation & No Drag</h3>
          <p>
            As requested, dragging has been disabled to prevent accidental character scrambling.
            Navigation is driven by the <strong>Previous / Next</strong> arrow buttons and the <strong>01–06 segmented tick bar</strong> at the bottom.
            The cursor is purely an interactive <strong>View</strong> magnifier.
          </p>
        </div>

        <div class="guide-box">
          <div class="guide-box-num">05</div>
          <h3>Full Order & Admin Pipeline</h3>
          <p>
            Items saved from the runway flow directly into the <strong>Cart Page</strong> (<code>#cart</code>).
            When a customer checks out, a unique Order ID (e.g. <code>#RNW-9284</code>) is generated and stored in <code>localStorage</code>.
            Store managers can instantly open the <strong>Admin Dashboard</strong> (<code>#admin</code>) to review orders, update shipment statuses, and track revenue.
          </p>
        </div>
      </div>

      <div class="guide-cta-row">
        <a href="#home" class="brand-btn brand-btn--dark">Back to Runway Experience</a>
        <a href="#admin" class="brand-btn">Open Admin Dashboard</a>
      </div>
    </div>
  `;
}
