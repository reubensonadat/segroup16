import * as fs from 'node:fs';
import { LOOKS, PRODUCTS, LookData } from '../src/data';
import { formatGhs, toGhs } from '../src/currency';

function renderModelArt(look: LookData, i: number, isHero = false) {
  const lookNumber = i + 1;
  const label = `Look ${lookNumber}: ${look.name}`;
  const isInitialLook = i === 0;

  return `
    <div class="rw__art">
      <img
        src="${look.model640}"
        srcset="${look.model640} 640w, ${look.model1080} 1080w"
        sizes="(min-width: 1800px) 540px, (min-width: 750px) 420px, 320px"
        loading="${isInitialLook ? 'eager' : 'lazy'}"
        ${isInitialLook ? 'fetchpriority="high"' : ''}
        decoding="async"
        width="1100"
        height="1956"
        draggable="false"
        data-model-image
        alt="${look.name}"
      >
      ${
        isHero
          ? `<button class="rw__zoom" data-rw-zoom aria-label="View look: ${look.name}" tabindex="${i === 0 ? '0' : '-1'}"></button>
      <div class="rw__pins">
        ${look.pins
          .map(
            (pin) =>
              `<button class="rw__pin" data-rw-pin="${pin.index}" data-tip="${pin.product}" style="left:${pin.left}; top:${pin.top}; --pi:${pin.index}" aria-label="${pin.index}: ${pin.product}" tabindex="-1"><span class="rw__pin-dot">${pin.index}</span></button>`
          )
          .join('\n        ')}
      </div>`
          : `<button class="rw__hit" data-rw-go="${i}" aria-label="${label}" tabindex="-1"></button>`
      }
    </div>
  `;
}

function renderPanel(look: LookData, i: number) {
  const isFirst = i === 0;

  const itemsHtml = look.items
    .map((itemRef, itemIdx) => {
      const cardNum = itemIdx + 1;
      const prod = PRODUCTS[itemRef.productId];
      const pickerId = `Picker-template--28035983671601__the_runway_wdM8BG-look_${look.key}-${cardNum}`;
      const radioName = `Opt-template--28035983671601__the_runway_wdM8BG-look_${look.key}-${cardNum}-1`;

      const pillsHtml = prod.sizes
        .map((size, sIdx) => {
          const isChecked = sIdx === 0;
          return `
            <label class="rw__pill">
              <input type="radio" name="${radioName}" value="${size}" data-rw-option="0" ${isChecked ? 'checked' : ''}>
              <span class="rw__pill-label">${size}</span>
            </label>
          `;
        })
        .join('');

      const tagHtml = itemRef.tag
        ? `<span class="rw__tag"><span class="rw__tag-text">${itemRef.tag}</span></span>`
        : '';

      return `
        <li class="rw__item" data-rw-card="${cardNum}" style="--i:${cardNum}" data-title="${prod.name}">
          ${tagHtml}
          <a class="rw__media" href="${prod.url}" tabindex="-1" aria-hidden="true">
            <img loading="lazy" decoding="async" alt="" width="400" height="${prod.height}" src="${prod.image}">
            <span class="rw__num">${cardNum}</span>
          </a>
          <div class="rw__info">
            <span class="rw__type">${prod.vendor}</span>
            <a class="rw__name" href="${prod.url}">${prod.name}</a>
            <span class="rw__price"><span>${formatGhs(toGhs(prod.price))}</span></span>
          </div>
          <button class="rw__add" data-rw-add aria-expanded="false" aria-controls="${pickerId}" aria-label="Add to bag: ${prod.name}" data-added-label="Added to bag: ${prod.name}">
            <svg class="rw__add-plus" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg>
            <svg class="rw__add-check" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L19.5 7"/></svg>
            <svg class="rw__add-spinner" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3a9 9 0 1 1-9 9"/></svg>
          </button>
          <div class="rw__picker" id="${pickerId}" data-rw-picker hidden>
            <div class="rw__picker-head">
              <img class="rw__picker-thumb" width="160" height="${prod.thumbHeightPhone}" src="${prod.image}" alt="">
              <div class="rw__picker-meta">
                <span class="rw__picker-title">${prod.name}</span>
                <span class="rw__picker-price">${formatGhs(toGhs(prod.price))}</span>
              </div>
              <button class="rw__picker-close" data-rw-pick-close aria-label="Close size picker">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
              </button>
            </div>
            <fieldset class="rw__opt">
              <legend class="rw__opt-name">${prod.optionLegend}</legend>
              <div class="rw__pills">
                ${pillsHtml}
              </div>
            </fieldset>
            <button class="rw__confirm" data-rw-confirm>
              <span data-rw-confirm-label data-add="Add to bag">Add to bag</span>
              <span class="rw__sr"> — ${prod.name}</span>
            </button>
            <script type="application/json" data-rw-variants>${JSON.stringify(prod.variants)}</script>
          </div>
        </li>
      `;
    })
    .join('');

  return `
    <div class="rw__look-panel${isFirst ? ' is-in' : ''}" data-rw-panel="${i}" ${isFirst ? '' : 'hidden'}>
      <div class="rw__mhead">
        <span class="rw__mhead-title">${look.name}</span>
        <span class="rw__label">3 pieces</span>
      </div>
      <ul class="rw__items" role="list">
        ${itemsHtml}
      </ul>
      <div class="rw__bundle has-rule">
        <p class="rw__msg" data-rw-msg role="status" aria-live="polite"></p>
        <div class="rw__bundle-row">
          <div class="rw__bundle-copy">
            <span class="rw__bundle-title">Complete the look</span>
            <span class="rw__bundle-note">Bundle all 3 and save 10%</span>
          </div>
          <div class="rw__bundle-price">
            <s>${formatGhs(toGhs(547))}</s>
            <strong>${formatGhs(toGhs(492.3))}</strong>
          </div>
        </div>
        <button class="rw__cta" data-rw-all>
          <span class="rw__cta-add">Add full look to bag</span>
          <span class="rw__cta-m">Add full look — ${formatGhs(toGhs(492.3))}</span>
          <span class="rw__cta-done">Full look in your bag</span>
          <svg viewBox="0 0 26 14" width="22" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h24M19 1l6 6-6 6"/></svg>
          <svg class="rw__cta-spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 1 1-9 9"/></svg>
        </button>
      </div>
      <template data-rw-pieces-text>3 pieces</template>
    </div>
  `;
}

export function buildFullHtml(): string {
  const bodiesHtml = LOOKS.map(
    (look, i) => `
      <div class="rw__model" data-rw-model data-index="${i}" aria-hidden="true">
        <span class="rw__shadow"></span>
        <div class="rw__figure" style="--rw-ar: 0.5625">
          ${renderModelArt(look, i, false)}
        </div>
      </div>
    `
  ).join('');

  const heroesHtml = LOOKS.map(
    (look, i) => `
      <div class="rw__hero${i === 0 ? ' is-on' : ''}" data-rw-hero data-index="${i}" data-name="${look.name}" data-label="Look ${i + 1}: ${look.name}" data-probe="${look.probe}">
        <div class="rw__morph">
          <span class="rw__shadow"></span>
          <div class="rw__figure" style="--rw-ar: 0.5625">
            ${renderModelArt(look, i, true)}
          </div>
        </div>
      </div>
    `
  ).join('');

  const ticksHtml = LOOKS.map(
    (look, i) => `
      <button class="rw__tick" data-rw-tick="${i}" aria-current="${i === 0 ? 'true' : 'false'}" aria-label="Look ${i + 1}: ${look.name}">
        <span class="rw__tick-bar"></span>
        <span class="rw__tick-label">${look.lookNum}<span class="rw__tick-name">&nbsp;&nbsp;${look.name}</span></span>
      </button>
    `
  ).join('');

  const panelsHtml = LOOKS.map((look, i) => renderPanel(look, i)).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#ffffff" />
    <title>Try the Look — Runway</title>
    <meta name="description" content="Six looks, styled head to toe. Explore the runway, isolate a look, and tap a pin to see the piece." />
    <meta property="og:title" content="Try the Look — Runway" />
    <meta property="og:description" content="Six looks, styled head to toe. Explore the runway, isolate a look, and tap a pin to see the piece." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preload" as="image" href="https://reel-ref-try-the-look.vercel.app/assets/model-1-640.webp" fetchpriority="high" />
  </head>
  <body>
    <div id="opening-curtain" class="opening-curtain" aria-hidden="true">
      <div class="opening-bar" style="--col:0"></div>
      <div class="opening-bar" style="--col:1"></div>
      <div class="opening-bar" style="--col:2"></div>
      <div class="opening-bar" style="--col:3"></div>
      <div class="opening-bar" style="--col:4"></div>
      <div class="opening-bar" style="--col:5"></div>
      <div class="opening-bar" style="--col:6"></div>
    </div>
    <header class="site-header shopify-section-group-header-group">
      <a href="#home" class="brand" aria-label="Home">
        <img width="68" height="24" alt="Nike" src="https://reel-ref-try-the-look.vercel.app/assets/nike-logo.svg" />
      </a>
      <nav aria-label="Main navigation">
        <a href="#home" aria-current="page">Home</a>
        <a href="#orbit">Nike Orbit</a>
        <a href="#hand-rail">Hand Rail Pro</a>
        <a href="#track">Track Order</a>
        <a href="#guide">How It's Made</a>
        <a href="#admin" class="nav-admin-link">Admin</a>
      </nav>
      <a href="#cart" id="open-bag" aria-label="Open shopping cart">
        <svg viewBox="0 0 24 26" width="22" height="24" fill="none" stroke="currentColor" stroke-width="1.3">
          <path d="M4 8h16l1 16H3L4 8zM8 8V6a4 4 0 0 1 8 0v2"></path>
        </svg>
        <span data-cart-count>0</span>
      </a>
    </header>

    <main>
      <div id="page-content" class="page-container" style="display:none;"></div>
      <runway-section
        id="Runway-template--28035983671601__the_runway_wdM8BG"
        class="rw rw--add-icon rw--popup rw--list has-dividers has-border"
        data-feel="balanced"
        data-blur="true"
        data-mblur="true"
        data-style="ring"
        data-mstyle="classic"
        data-fit="true"
        data-height-mode="original"
        data-height-vh="100"
        data-mheight-mode="custom"
        data-mheight-vh="109"
        data-reflect="false"
        data-autoplay="true"
        data-speed="5000"
        data-after-add="stay"
        data-bundle-code=""
        data-msg-choose="Pick a size for: [items]"
        data-msg-error="Couldn’t add to bag. Please try again."
        data-msg-soldout="Sold out"
        style="--rw-c-stage: #ffffff; --rw-c-panel: #ffffff; --rw-c-text: #151413; --rw-c-muted: #66625c; --rw-c-accent: #0e0e0e; --rw-c-on-accent: #ffffff; --rw-c-line: #c8c8c8; --rw-card: #DFDFDF; --rw-hf: var(--font-heading--family, inherit); --rw-hw: 400; --rw-h-d: 46px; --rw-h-m: 24px; --rw-sub-d: 12px; --rw-sub-m: 12px; --rw-eyebrow-d: 11px; --rw-eyebrow-m: 10px; --rw-label-d: 10px; --rw-label-m: 9px; --rw-chip-d: 17px; --rw-chip-m: 18px; --rw-ph-d: 18px; --rw-ph-m: 16px; --rw-pt-size-d: 13px; --rw-pt-size-m: 12px; --rw-price-d: 12px; --rw-price-m: 12px; --rw-opt-d: 11px; --rw-opt-m: 11px; --rw-total-d: 16px; --rw-total-m: 16px; --rw-thumb-d: 92px; --rw-thumb-m: 62px; --rw-tag-top: 18px; --rw-tag-left: 0px; --rw-thumb-radius: 0px; --rw-morph: 900ms; --rw-bar-r: 20px; --rw-panel-w: 380px; --rw-panel-pad-d: 32px; --rw-radius: 0px; --rw-max: none; --rw-speed: 5s; --rw-ax: 40%; --rw-btn-radius: 0px; --rw-pill-radius: 30px; --rw-add-radius: 20px;"
      >
        <div class="rw__sticky">
          <div class="rw__grid">
            <div class="rw__left">
              <div class="rw__head">
                <div class="rw__intro">
                  <h2 class="rw__title">Try the Look.</h2>
                  <p class="rw__sub">Six looks, styled head to toe. Tap a pin to see the piece.</p>
                </div>
                <span class="rw__sr" aria-live="polite" aria-atomic="true" data-rw-live></span>
              </div>

              <div class="rw__stage" data-rw-stage tabindex="0" role="region" aria-roledescription="carousel" aria-label="Try the Look. — use arrow keys or swipe to change look">
                <div class="rw__actors" data-rw-actors>
                  ${bodiesHtml}
                </div>
                <div class="rw__heroes" data-rw-heroes>
                  ${heroesHtml}
                </div>
                <span class="rw__sweep"></span>
                <span class="rw__cursor" data-rw-cursor>
                  <span class="rw__cursor-in">
                    <span class="rw__cursor-label rw__cursor-view">View</span>
                  </span>
                </span>
                <span class="rw__walk"><span class="rw__walk-line"></span></span>
              </div>

              <div class="rw__controls">
                <button class="rw__icon rw__btn-nav rw__btn-prev" data-rw-prev aria-label="Previous look">
                  <svg viewBox="0 0 26 14" width="22" height="12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M25 7H1M7 1L1 7l6 6"/></svg>
                  <span class="rw__nav-look-text" data-rw-prev-name>06 Vintage Runner</span>
                </button>
                <div class="rw__ticks">
                  ${ticksHtml}
                </div>
                <button class="rw__icon rw__auto" data-rw-auto aria-pressed="false" aria-label="Autoplay">
                  <svg class="rw__icon-play" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>
                  <svg class="rw__icon-pause" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"/></svg>
                </button>
                <button class="rw__icon rw__btn-nav rw__btn-next" data-rw-next aria-label="Next look">
                  <span class="rw__nav-look-text" data-rw-next-name>02 Street Monolith</span>
                  <svg viewBox="0 0 26 14" width="22" height="12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h24M19 1l6 6-6 6"/></svg>
                </button>
              </div>

              <div class="rw__lb" data-rw-lb data-word="Look" role="region" aria-label="View look" aria-hidden="true">
                <div class="rw__lb-stage" data-rw-lb-stage></div>
                <div class="rw__lb-top">
                  <p class="rw__lb-cap">
                    <span class="rw__lb-kicker" data-rw-lb-kicker></span>
                    <span class="rw__lb-name" data-rw-lb-name></span>
                  </p>
                  <button class="rw__lb-close" data-rw-zoom-close aria-label="Close">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
                  </button>
                </div>
                <p class="rw__lb-hint">Tap a dot to shop the piece</p>
              </div>
            </div>

            <div class="rw__panel has-rule">
              <div class="rw__panel-inner">
                <div class="rw__panel-head">
                  <h3 class="rw__panel-title">In this look</h3>
                  <span class="rw__label" data-rw-pieces>3 pieces</span>
                </div>
                ${panelsHtml}
              </div>
            </div>
          </div>
        </div>
      </runway-section>
    </main>

    <dialog id="bag-dialog">
      <div class="bag-heading">
        <h2>Your styling bag</h2>
        <button id="close-bag" aria-label="Close styling bag">×</button>
      </div>
      <p class="bag-note">A local outfit shortlist. No payment or order is collected here. Continue exploring each piece right here in the runway.</p>
      <div id="bag-items"></div>
      <p id="bag-total"></p>
      <button id="export-bag">Download outfit shortlist</button>
    </dialog>

    <div id="bag-status" role="status" aria-live="polite"></div>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const html = buildFullHtml();
  fs.writeFileSync('public/runway-template.html', html, 'utf-8');
  console.log('Successfully generated public/runway-template.html');
}
