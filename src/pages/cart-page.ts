import { PRODUCTS, ProductItem } from '../data';
import { validateBagItems, addToBag, StylingBagItem } from '../runway-logic';
import { createOrder, CustomerInfo, OrderItem } from '../orders-store';
import { formatGhs, toGhs } from '../currency';
import { bindDropdowns } from '../dropdown.tsx';
import { detectCustomerLocation } from '../location';
import { fetchRoadRoute } from '../lib/roadRoute';
import { analyzeCartBundles } from '../bundle-store';
import { getActiveBrand } from '../brand-presets';

const STORAGE_KEY = 'runway-styling-bag-v3';

export function getBagItems(): StylingBagItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return validateBagItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveBagItems(items: StylingBagItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateGlobalCartCount();
  } catch {
    // ignore
  }
}

export function updateGlobalCartCount() {
  const items = getBagItems();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
  });
}

export function renderCartPage(): string {
  const items = getBagItems();

  if (items.length === 0) {
    return `
      <div class="brand-page cart-page">
        <div class="cart-empty-state">
          <div class="cart-empty-icon">
            <svg viewBox="0 0 24 26" width="48" height="52" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M4 8h16l1 16H3L4 8zM8 8V6a4 4 0 0 1 8 0v2"></path>
            </svg>
          </div>
          <h2>Your Styling Cart is Empty</h2>
          <p>Explore our 3D Runway collection, pick your sizes, and build your streetwear outfit shortlist.</p>
          <a href="#home" class="brand-btn brand-btn--dark">Explore Looks</a>
        </div>
      </div>
    `;
  }

  const activeBrand = getActiveBrand();
  const bundleAnalysis = analyzeCartBundles(items);
  const totalBundleDiscount = bundleAnalysis.totalBundleDiscountGhs;

  let subtotal = 0;
  const lineItemsHtml = items
    .map((entry) => {
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

      if (!matchedProd) return '';

      const lineTotal = toGhs(matchedProd.price) * entry.quantity;
      subtotal += lineTotal;

      const isBundled = bundleAnalysis.bundledVariantIds.has(entry.id);
      const matchedBundle = bundleAnalysis.bundles.find((b) =>
        b.items.some((bi) => bi.variantId === entry.id)
      );

      return `
        <div class="cart-item-row" data-variant-id="${entry.id}">
          <div class="cart-item-media">
            <img src="${matchedProd.image}" alt="${matchedProd.name}" />
          </div>
          <div class="cart-item-info">
            <span class="cart-item-vendor">${matchedProd.vendor}</span>
            <h3 class="cart-item-title">${matchedProd.name}</h3>
            <span class="cart-item-size">Size: <strong>${matchedSize}</strong></span>
            <span class="cart-item-price">${formatGhs(toGhs(matchedProd.price))} each</span>
            ${
              isBundled && matchedBundle
                ? `<span class="cart-item-bundle-badge">★ Part of ${matchedBundle.lookName} Package (${matchedBundle.discountPercent}% OFF)</span>`
                : ''
            }
          </div>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-cart-action="dec" data-id="${entry.id}" aria-label="Decrease quantity">−</button>
            <span class="cart-qty-num">${entry.quantity}</span>
            <button class="cart-qty-btn" data-cart-action="inc" data-id="${entry.id}" aria-label="Increase quantity">+</button>
          </div>
          <div class="cart-item-total">
            <span>${formatGhs(lineTotal)}</span>
            <button class="cart-remove-btn" data-cart-action="remove" data-id="${entry.id}" aria-label="Remove item">Remove</button>
          </div>
        </div>
      `;
    })
    .join('');

  const total = Math.max(0, subtotal - totalBundleDiscount);

  const bundleBannerHtml =
    bundleAnalysis.bundles.length > 0
      ? `
        <div class="cart-bundle-banner">
          <div class="cart-bundle-banner-icon">✨</div>
          <div class="cart-bundle-banner-text">
            <strong>Complete Runway Outfit Package Unlocked!</strong>
            <p>
              You bundled all 3 pieces from <strong>${bundleAnalysis.bundles.map((b) => b.lookName).join(' & ')}</strong>.
              A <strong>${bundleAnalysis.bundles[0].discountPercent}% Runway Bundle Discount (${formatGhs(totalBundleDiscount)})</strong> has been automatically deducted from your cart!
            </p>
          </div>
        </div>
      `
      : '';

  return `
    <div class="brand-page cart-page">
      <div class="cart-header">
        <h1>Your Shopping Cart</h1>
        <p>Review items in your outfit selection and proceed to express checkout.</p>
      </div>

      <div class="cart-layout">
        <div class="cart-items-container">
          ${bundleBannerHtml}
          <div class="cart-items-head">
            <span>Item & Details</span>
            <span>Quantity</span>
            <span>Total</span>
          </div>
          ${lineItemsHtml}
          <div class="cart-continue-strip">
            <a href="#home" class="cart-back-link">← Return to Home</a>
          </div>
        </div>

        <div class="cart-summary-card">
          <h2>Order Summary</h2>
          <div class="cart-summary-line">
            <span>Subtotal</span>
            <span>${formatGhs(subtotal)}</span>
          </div>
          ${
            totalBundleDiscount > 0
              ? `
              <div class="cart-summary-line cart-summary-line--discount">
                <span>
                  Look Bundle Discount (${bundleAnalysis.bundles[0].discountPercent}%)
                  <span class="cart-bundle-pill">COMPLETE LOOK</span>
                </span>
                <span class="cart-discount-val">−${formatGhs(totalBundleDiscount)}</span>
              </div>
            `
              : ''
          }
          <div class="cart-summary-line">
            <span>Shipping</span>
            <span class="cart-free-tag">Free Express</span>
          </div>
          <div class="cart-summary-divider"></div>
          <div class="cart-summary-line cart-summary-line--total">
            <span>Total</span>
            <strong>${formatGhs(total)}</strong>
          </div>

          <div class="cart-promo-box">
            <input type="text" placeholder="Promo code (e.g. RUNWAY10)" id="cart-promo-input" class="brand-input" />
            <button class="brand-btn brand-btn--sm" id="cart-promo-btn">Apply</button>
          </div>
          <p id="cart-promo-msg" class="cart-promo-msg"></p>

          <button id="open-checkout-modal" class="brand-btn brand-btn--dark cart-checkout-btn">
            Proceed to Checkout (${formatGhs(total)})
          </button>

          <div class="cart-perks">
            <div>✓ Official ${activeBrand.name} Authenticity Guaranteed</div>
            <div>✓ 30-Day Complimentary Returns</div>
            <div>✓ Encrypted SSL Checkout</div>
          </div>
        </div>
      </div>

      <!-- Checkout Modal -->
      <dialog id="checkout-modal" class="checkout-modal">
        <div class="checkout-modal-inner">
          <div class="checkout-modal-head">
            <h2>Express Checkout</h2>
            <button id="close-checkout-modal" class="checkout-close-btn" aria-label="Close checkout">×</button>
          </div>

          <form id="checkout-form" class="checkout-form">
            <div class="checkout-section-title">1. Ghana Delivery & Fulfillment</div>
            <div class="checkout-form-grid">
              <div class="form-field form-field--full">
                <label for="c-name">Full Name *</label>
                <input type="text" id="c-name" required placeholder="Ama Mensah / Kwesi Mensah" class="brand-input" />
              </div>
              <div class="form-field form-field--full">
                <label for="c-phone">Phone Number (Ghana MoMo / WhatsApp) *</label>
                <div class="checkout-phone-wrap">
                  <input type="tel" id="c-phone" required placeholder="024 000 0000" class="brand-input" />
                  <span id="phone-network-badge" class="phone-network-badge" hidden>MTN</span>
                </div>
              </div>
              <div class="form-field form-field--full">
                <label>Order Fulfillment Type *</label>
                <div class="checkout-choice-grid">
                  <label class="checkout-choice-card">
                    <input type="radio" name="fulfillment" value="delivery" checked />
                    <span class="checkout-choice-icon">DOORSTEP DISPATCH</span>
                    <strong>Free Delivery</strong>
                    <small>Rider brings package directly to my GPS address</small>
                  </label>
                  <label class="checkout-choice-card">
                    <input type="radio" name="fulfillment" value="pickup" />
                    <span class="checkout-choice-icon">STORE PICKUP</span>
                    <strong>In-Store Boutique Collection</strong>
                    <small>Pick up at Osu / Accra Mall Flagship</small>
                  </label>
                </div>
              </div>

              <!-- 1-Click GPS & Transparent Kola Route Map -->
              <div class="form-field form-field--full" id="delivery-location-group">
                <label>Delivery GPS Location</label>
                <div class="checkout-location-actions">
                  <button type="button" class="brand-btn brand-btn--dark brand-btn--sm" id="use-location-btn">
                    📍 1-Click GPS Pin (Locate Me)
                  </button>
                  <span id="location-status" class="checkout-loc-status">Required for courier dispatch. Optional for store pickup.</span>
                </div>
                <input type="hidden" id="c-location" />

                <!-- Kola Map Route Card -->
                <div id="kola-route-card" class="kola-route-card" hidden>
                  <div class="kola-route-header">
                    <span class="kola-route-badge">Transparent Route Fee Engine</span>
                    <span id="kola-route-dist" class="kola-route-dist">Measuring distance…</span>
                  </div>
                  <div class="kola-route-visual">
                    <div class="kola-route-point">
                      <span class="kola-point-dot kola-point-dot--origin"></span>
                      <div>
                        <strong>Boutique Flagship Hub</strong>
                        <small>Osu Oxford Street, Accra</small>
                      </div>
                    </div>
                    <div class="kola-route-connector">
                      <span class="kola-route-line"></span>
                      <span id="kola-route-time" class="kola-route-time">OSRM Road Active</span>
                    </div>
                    <div class="kola-route-point">
                      <span class="kola-point-dot kola-point-dot--dest"></span>
                      <div>
                        <strong id="kola-dest-label">Customer GPS Destination</strong>
                        <small id="kola-dest-coords">Detecting coordinates…</small>
                      </div>
                    </div>
                  </div>
                  <div class="kola-route-footer">
                    <span>Courier Dispatch Fee:</span>
                    <strong class="kola-free-tag">FREE (Promotional Drop)</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Kola Mobile Money Network Selection -->
            <div class="checkout-section-title">2. Ghana Mobile Money (MoMo) Wallet</div>
            <div class="checkout-momo-grid">
              <label class="checkout-momo-card checkout-momo-card--mtn">
                <input type="radio" name="paymentMethod" value="MTN Mobile Money" checked />
                <div class="momo-card-header">
                  <span class="momo-badge momo-badge--mtn">MTN MoMo</span>
                  <span class="momo-ussd-code">*170#</span>
                </div>
                <strong>MTN Mobile Money</strong>
                <small>Instant prompt sent to your phone</small>
              </label>

              <label class="checkout-momo-card checkout-momo-card--telecel">
                <input type="radio" name="paymentMethod" value="Telecel Cash" />
                <div class="momo-card-header">
                  <span class="momo-badge momo-badge--telecel">Telecel</span>
                  <span class="momo-ussd-code">*110#</span>
                </div>
                <strong>Telecel Cash</strong>
                <small>Fast wallet prompt authorization</small>
              </label>

              <label class="checkout-momo-card checkout-momo-card--at">
                <input type="radio" name="paymentMethod" value="AT Money" />
                <div class="momo-card-header">
                  <span class="momo-badge momo-badge--at">AT Money</span>
                  <span class="momo-ussd-code">*110#</span>
                </div>
                <strong>AT Money</strong>
                <small>AirtelTigo wallet approval</small>
              </label>
            </div>

            <div class="checkout-momo-notice">
              🔒 <strong>Instant Payment Authorization:</strong> When you complete your order, your phone will receive an immediate USSD approval pop-up to enter your MoMo PIN.
            </div>

            <div class="checkout-modal-summary">
              <div>Subtotal: ${formatGhs(subtotal)}</div>
              <div>Courier Express Shipping: <span class="track-free">FREE</span></div>
              <strong class="checkout-total-line">Total Due: ${formatGhs(total)}</strong>
            </div>

            <button type="submit" id="submit-order-btn" class="brand-btn brand-btn--dark checkout-submit-btn">
              Authorize Payment — ${formatGhs(total)}
            </button>
          </form>
        </div>
      </dialog>

      <!-- Order Confirmation Screen (Kola USSD Prompt Simulation) -->
      <dialog id="order-success-modal" class="checkout-modal">
        <div class="checkout-modal-inner order-success-card">
          <div class="momo-prompt-graphic">
            <span class="momo-prompt-pulse"></span>
            <div class="momo-prompt-phone">📱</div>
          </div>
          <span class="order-success-kicker">Authorization Request Sent</span>
          <h2 id="success-order-id">#RNW-0000</h2>
          <p id="success-prompt-note" class="success-prompt-note">
            Please check your phone for the <strong>Mobile Money USSD prompt</strong> and enter your PIN to complete authorization.
          </p>
          <div class="order-success-actions">
            <a href="#track" class="brand-btn brand-btn--dark" id="view-order-track-btn">Track Delivery in Real-Time →</a>
            <a href="#admin" class="brand-btn" id="view-order-admin-btn">Open in Operations Dashboard</a>
          </div>
        </div>
      </dialog>
    </div>
  `;
}

export function bindCartEvents(container: HTMLElement) {
  bindDropdowns(container);

  // Quantity and remove buttons
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const action = target.getAttribute('data-cart-action');
    if (!action) return;

    const variantId = parseInt(target.getAttribute('data-id') || '0', 10);
    const items = getBagItems();

    if (action === 'remove') {
      const updated = items.filter((i) => i.id !== variantId);
      saveBagItems(updated);
      refreshCartView();
    } else if (action === 'inc') {
      const entry = items.find((i) => i.id === variantId);
      if (entry) {
        entry.quantity = Math.min(20, entry.quantity + 1);
        saveBagItems(items);
        refreshCartView();
      }
    } else if (action === 'dec') {
      const entry = items.find((i) => i.id === variantId);
      if (entry) {
        if (entry.quantity > 1) {
          entry.quantity -= 1;
        } else {
          const updated = items.filter((i) => i.id !== variantId);
          saveBagItems(updated);
          refreshCartView();
          return;
        }
        saveBagItems(items);
        refreshCartView();
      }
    }
  });

  // Promo code
  const promoBtn = container.querySelector('#cart-promo-btn');
  const promoInput = container.querySelector('#cart-promo-input') as HTMLInputElement | null;
  const promoMsg = container.querySelector('#cart-promo-msg') as HTMLElement | null;

  promoBtn?.addEventListener('click', () => {
    const code = promoInput?.value.trim().toUpperCase();
    if (code === 'RUNWAY10' || code === 'NIKE10') {
      if (promoMsg) {
        promoMsg.textContent = '✓ 10% Runway VIP discount code applied!';
        promoMsg.style.color = '#151413';
      }
    } else if (code) {
      if (promoMsg) {
        promoMsg.textContent = 'Invalid promo code. Try RUNWAY10.';
        promoMsg.style.color = '#e53e3e';
      }
    }
  });

  // Open Checkout Modal
  const openCheckoutBtn = container.querySelector('#open-checkout-modal');
  const checkoutModal = container.querySelector('#checkout-modal') as HTMLDialogElement | null;
  const closeCheckoutBtn = container.querySelector('#close-checkout-modal');

  openCheckoutBtn?.addEventListener('click', () => {
    checkoutModal?.showModal();
  });

  closeCheckoutBtn?.addEventListener('click', () => {
    checkoutModal?.close();
  });

  checkoutModal?.addEventListener('click', (e) => {
    if (e.target === checkoutModal) checkoutModal.close();
  });

  // Checkout Form Submission
  const checkoutForm = container.querySelector('#checkout-form') as HTMLFormElement | null;
  const successModal = container.querySelector('#order-success-modal') as HTMLDialogElement | null;
  const successOrderIdEl = container.querySelector('#success-order-id') as HTMLElement | null;
  const locationButton = container.querySelector<HTMLButtonElement>('#use-location-btn');
  const locationStatus = container.querySelector<HTMLElement>('#location-status');
  const locationField = container.querySelector<HTMLElement>('#use-location-btn')?.closest<HTMLElement>('.form-field');
  const fulfillmentInputs = container.querySelectorAll<HTMLInputElement>('input[name="fulfillment"]');
  const updateLocationRequirement = (value: string) => {
    const isDelivery = value === 'delivery';
    if (locationField) locationField.hidden = !isDelivery;
    if (!isDelivery && locationStatus) locationStatus.textContent = 'No location needed for store pickup.';
    if (isDelivery && locationStatus && !container.querySelector<HTMLInputElement>('#c-location')?.value) {
      locationStatus.textContent = 'Required for free delivery. Optional for pickup.';
    }
  };
  fulfillmentInputs.forEach((input) => {
    input.addEventListener('change', () => updateLocationRequirement(input.value));
  });
  const selectedFulfillment = container.querySelector<HTMLInputElement>('input[name="fulfillment"]:checked');
  updateLocationRequirement(selectedFulfillment?.value || 'delivery');
  // Ghana Phone & MoMo Auto-detection
  const phoneInput = container.querySelector('#c-phone') as HTMLInputElement | null;
  const networkBadge = container.querySelector('#phone-network-badge') as HTMLElement | null;
  phoneInput?.addEventListener('input', () => {
    const raw = phoneInput.value.replace(/\D/g, '');
    const prefix = raw.slice(0, 3);
    if (!networkBadge) return;
    if (['024', '054', '055', '059', '053'].includes(prefix)) {
      networkBadge.textContent = 'MTN MoMo';
      networkBadge.className = 'phone-network-badge phone-network-badge--mtn';
      networkBadge.hidden = false;
      const mtnRadio = container.querySelector<HTMLInputElement>('input[value="MTN Mobile Money"]');
      if (mtnRadio) mtnRadio.checked = true;
    } else if (['020', '050'].includes(prefix)) {
      networkBadge.textContent = 'Telecel Cash';
      networkBadge.className = 'phone-network-badge phone-network-badge--telecel';
      networkBadge.hidden = false;
      const telecelRadio = container.querySelector<HTMLInputElement>('input[value="Telecel Cash"]');
      if (telecelRadio) telecelRadio.checked = true;
    } else if (['027', '057', '026'].includes(prefix)) {
      networkBadge.textContent = 'AT Money';
      networkBadge.className = 'phone-network-badge phone-network-badge--at';
      networkBadge.hidden = false;
      const atRadio = container.querySelector<HTMLInputElement>('input[value="AT Money"]');
      if (atRadio) atRadio.checked = true;
    } else {
      networkBadge.hidden = true;
    }
  });

  locationButton?.addEventListener('click', async () => {
    locationButton.disabled = true;
    if (locationStatus) locationStatus.textContent = 'Contacting GPS satellites in Accra…';
    try {
      const location = await detectCustomerLocation();
      const locationInput = container.querySelector<HTMLInputElement>('#c-location');
      if (locationInput) locationInput.value = JSON.stringify(location);
      if (locationStatus) {
        locationStatus.textContent = `📍 GPS Pin Locked: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
      }

      // Show Kola Transparent Route Card
      const routeCard = container.querySelector<HTMLElement>('#kola-route-card');
      const routeDist = container.querySelector<HTMLElement>('#kola-route-dist');
      const routeTime = container.querySelector<HTMLElement>('#kola-route-time');
      const destCoords = container.querySelector<HTMLElement>('#kola-dest-coords');

      if (routeCard) routeCard.hidden = false;
      if (destCoords) destCoords.textContent = `GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

      // Calculate real road distance with OSRM
      const storeOrigin = { lat: 5.6198, lng: -0.1742 }; // Osu Flagship
      const roadData = await fetchRoadRoute([storeOrigin, { lat: location.latitude, lng: location.longitude }]);
      if (roadData && routeDist && routeTime) {
        routeDist.textContent = `${roadData.distanceKm} km via road`;
        routeTime.textContent = `~${roadData.durationMin} mins courier dispatch`;
      } else if (routeDist && routeTime) {
        routeDist.textContent = `4.8 km via Accra roads`;
        routeTime.textContent = `~15 mins courier dispatch`;
      }
    } catch (error) {
      if (locationStatus) locationStatus.textContent = error instanceof Error ? error.message : 'Could not save your location.';
    } finally {
      locationButton.disabled = false;
    }
  });

  checkoutForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = container.querySelector('#c-name') as HTMLInputElement;
    const phoneInput = container.querySelector('#c-phone') as HTMLInputElement;
    const locationInput = container.querySelector('#c-location') as HTMLInputElement;
    const paymentRadio = container.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement;
    const fulfillmentRadio = container.querySelector('input[name="fulfillment"]:checked') as HTMLInputElement;
    const location = locationInput.value ? JSON.parse(locationInput.value) as CustomerInfo['location'] : undefined;
    const fulfillment = (fulfillmentRadio?.value as 'pickup' | 'delivery') || 'delivery';
    if (fulfillment === 'delivery' && !location) {
      if (locationStatus) locationStatus.textContent = 'Please lock your GPS pin for courier dispatch.';
      return;
    }

    const customer: CustomerInfo = {
      fullName: nameInput.value.trim() || 'Valued Client',
      phone: phoneInput.value.trim(),
      country: 'Ghana',
      fulfillment,
      ...(location ? {location} : {}),
    };

    const currentItems = getBagItems();
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    currentItems.forEach((entry) => {
      for (const prod of Object.values(PRODUCTS)) {
        const v = prod.variants.find((v) => v.id === entry.id);
        if (v) {
          orderItems.push({
            id: entry.id,
            productId: prod.id,
            name: prod.name,
            size: v.o[0],
            price: prod.price,
            quantity: entry.quantity,
            image: prod.image,
          });
          subtotal += prod.price * entry.quantity;
          break;
        }
      }
    });

    const paymentMethod = paymentRadio?.value || 'MTN Mobile Money';

    // Calculate bundle discount if customer bundled a complete 3-piece look
    const bundleAnalysis = analyzeCartBundles(currentItems);
    const bundleDiscountUsd = bundleAnalysis.totalBundleDiscountGhs / 10;
    const bundleName = bundleAnalysis.bundles.map((b) => b.lookName).join(', ');

    // Create and save real order
    const created = createOrder(
      customer,
      orderItems,
      subtotal,
      0,
      0,
      paymentMethod,
      bundleDiscountUsd,
      bundleName || undefined
    );

    // Empty bag
    saveBagItems([]);

    // Show Kola USSD Prompt Simulation modal
    checkoutModal?.close();
    if (successModal) {
      if (successOrderIdEl) successOrderIdEl.textContent = `#${created.id}`;
      const trackBtn = container.querySelector<HTMLAnchorElement>('#view-order-track-btn');
      if (trackBtn) trackBtn.href = `#track?id=${created.id}`;
      const promptNote = container.querySelector<HTMLElement>('#success-prompt-note');
      if (promptNote) {
        promptNote.innerHTML = `Authorization request sent to <strong>${phoneInput.value}</strong>. Please enter your <strong>${paymentMethod} PIN</strong> on the USSD prompt to confirm <strong>${formatGhs(toGhs(created.total))}</strong>.`;
      }
      successModal.showModal();
    } else {
      window.location.hash = `#track?id=${created.id}`;
    }
  });
}

function refreshCartView() {
  const pageContainer = document.getElementById('page-content');
  if (pageContainer) {
    pageContainer.innerHTML = renderCartPage();
    bindCartEvents(pageContainer);
  }
}
