import { PRODUCTS, ProductItem } from '../data';
import { validateBagItems, addToBag, StylingBagItem } from '../runway-logic';
import { createOrder, CustomerInfo, OrderItem } from '../orders-store';
import { formatGhs, toGhs } from '../currency';
import { bindDropdowns } from '../dropdown.tsx';
import { detectCustomerLocation } from '../location';

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

  const total = subtotal;

  return `
    <div class="brand-page cart-page">
      <div class="cart-header">
        <h1>Your Shopping Cart</h1>
        <p>Review items in your outfit selection and proceed to express checkout.</p>
      </div>

      <div class="cart-layout">
        <div class="cart-items-container">
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
            <div>✓ Official Nikey Authenticity Guaranteed</div>
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
            <div class="checkout-section-title">1. Ghana Delivery Details</div>
            <div class="checkout-form-grid">
              <div class="form-field form-field--full">
                <label for="c-name">Full Name *</label>
                <input type="text" id="c-name" required placeholder="Your full name" class="brand-input" />
              </div>
              <div class="form-field form-field--full">
                <label for="c-phone">Phone Number *</label>
                <input type="tel" id="c-phone" required placeholder="024 000 0000" class="brand-input" />
              </div>
              <div class="form-field form-field--full">
                <label>Order fulfilment *</label>
                <div class="checkout-choice-grid">
                  <label class="checkout-choice-card">
                    <input type="radio" name="fulfillment" value="delivery" checked />
                    <span class="checkout-choice-icon">DELIVERY</span>
                    <strong>Free delivery</strong>
                    <small>Bring my order to my location</small>
                  </label>
                  <label class="checkout-choice-card">
                    <input type="radio" name="fulfillment" value="pickup" />
                    <span class="checkout-choice-icon">PICKUP</span>
                    <strong>Pick up from the store</strong>
                    <small>I will collect my order</small>
                  </label>
                </div>
              </div>
              <div class="form-field form-field--full">
                <label>Delivery location</label>
                <button type="button" class="brand-btn" id="use-location-btn">Share my current location</button>
                <input type="hidden" id="c-location" />
                <small id="location-status">Required for free delivery. Optional for pickup.</small>
              </div>
            </div>

            <div class="checkout-section-title">2. Payment Method</div>
            <div class="checkout-payment-options">
              <label class="checkout-choice-card">
                <input type="radio" name="paymentMethod" value="Mobile Money" checked />
                <span class="checkout-choice-icon">MOMO</span>
                <strong>Mobile Money</strong>
                <small>Pay with your Ghana mobile wallet</small>
              </label>
              <label class="checkout-choice-card">
                <input type="radio" name="paymentMethod" value="Cash on Delivery" />
                <span class="checkout-choice-icon">CASH</span>
                <strong>Cash on delivery</strong>
                <small>Pay when your order arrives</small>
              </label>
            </div>

            <div class="checkout-modal-summary">
              <div>Subtotal: ${formatGhs(subtotal)}</div>
              <strong>Total Due: ${formatGhs(total)}</strong>
            </div>

            <button type="submit" id="submit-order-btn" class="brand-btn brand-btn--dark checkout-submit-btn">
              Complete Order — ${formatGhs(total)}
            </button>
          </form>
        </div>
      </dialog>

      <!-- Order Confirmation Screen (Hidden until order completes) -->
      <dialog id="order-success-modal" class="checkout-modal">
        <div class="checkout-modal-inner order-success-card">
          <div class="order-success-icon">✓</div>
          <span class="order-success-kicker">Order Confirmed</span>
          <h2 id="success-order-id">#RNW-0000</h2>
          <p>Thank you for shopping Runway. Your streetwear pieces are being prepped for dispatch.</p>
          <div class="order-success-actions">
            <a href="#admin" class="brand-btn brand-btn--dark" id="view-order-admin-btn">View in Admin Dashboard →</a>
            <a href="#runway" class="brand-btn" id="success-continue-btn">Back to Runway</a>
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
  locationButton?.addEventListener('click', async () => {
    locationButton.disabled = true;
    if (locationStatus) locationStatus.textContent = 'Requesting your location…';
    try {
      const location = await detectCustomerLocation();
      const locationInput = container.querySelector<HTMLInputElement>('#c-location');
      if (locationInput) locationInput.value = JSON.stringify(location);
      if (locationStatus) {
        locationStatus.textContent = `Location saved: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)} (accurate to about ${location.accuracyMeters}m).`;
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
      if (locationStatus) locationStatus.textContent = 'Please share your location for free delivery.';
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

    const paymentMethod = paymentRadio?.value || 'Mobile Money';

    // Create and save real order
    const created = createOrder(customer, orderItems, subtotal, 0, 0, paymentMethod);

    // Empty bag
    saveBagItems([]);
    checkoutModal?.close();

    // Directly open the real Order Tracking & Confirmation Page
    window.location.hash = `#track?id=${created.id}`;
  });
}

function refreshCartView() {
  const pageContainer = document.getElementById('page-content');
  if (pageContainer) {
    pageContainer.innerHTML = renderCartPage();
    bindCartEvents(pageContainer);
  }
}
