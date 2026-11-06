import { PRODUCTS, ProductItem } from '../data';
import { validateBagItems, addToBag, StylingBagItem } from '../runway-logic';
import { createOrder, CustomerInfo, OrderItem } from '../orders-store';
import { formatGhs, toGhs } from '../currency';

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

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

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
          <div class="cart-summary-line">
            <span>Estimated Tax (8%)</span>
            <span>${formatGhs(tax)}</span>
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
            <div class="checkout-section-title">1. Shipping Information</div>
            <div class="checkout-form-grid">
              <div class="form-field form-field--full">
                <label for="c-name">Full Name *</label>
                <input type="text" id="c-name" required placeholder="Alexander McQueen" value="Marcus Vance" class="brand-input" />
              </div>
              <div class="form-field form-field--full">
                <label for="c-email">Email Address *</label>
                <input type="email" id="c-email" required placeholder="alex@studio.com" value="m.vance@studio.design" class="brand-input" />
              </div>
              <div class="form-field form-field--full">
                <label for="c-street">Street Address *</label>
                <input type="text" id="c-street" required placeholder="48 Mercer St, Apt 4B" value="48 Mercer St" class="brand-input" />
              </div>
              <div class="form-field">
                <label for="c-city">City *</label>
                <input type="text" id="c-city" required placeholder="New York" value="New York" class="brand-input" />
              </div>
              <div class="form-field">
                <label for="c-zip">ZIP / Postal Code *</label>
                <input type="text" id="c-zip" required placeholder="10013" value="10013" class="brand-input" />
              </div>
              <div class="form-field form-field--full">
                <label for="c-country">Country *</label>
                <select id="c-country" class="brand-input">
                  <option value="United States" selected>United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                </select>
              </div>
            </div>

            <div class="checkout-section-title">2. Payment Simulation</div>
            <div class="checkout-payment-options">
              <label class="pay-radio">
                <input type="radio" name="paymentMethod" value="Apple Pay" checked />
                <span>Apple Pay (Instant Biometric)</span>
              </label>
              <label class="pay-radio">
                <input type="radio" name="paymentMethod" value="Credit Card (•••• 8421)" />
                <span>Credit Card (Visa / Mastercard)</span>
              </label>
            </div>

            <div class="checkout-modal-summary">
              <div>Subtotal: ${formatGhs(subtotal)}</div>
              <div>Tax (8%): ${formatGhs(tax)}</div>
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

  checkoutForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = container.querySelector('#c-name') as HTMLInputElement;
    const emailInput = container.querySelector('#c-email') as HTMLInputElement;
    const streetInput = container.querySelector('#c-street') as HTMLInputElement;
    const cityInput = container.querySelector('#c-city') as HTMLInputElement;
    const zipInput = container.querySelector('#c-zip') as HTMLInputElement;
    const countrySelect = container.querySelector('#c-country') as HTMLSelectElement;
    const paymentRadio = container.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement;

    const customer: CustomerInfo = {
      fullName: nameInput.value.trim() || 'Valued Client',
      email: emailInput.value.trim() || 'client@studio.com',
      street: streetInput.value.trim() || '48 Mercer St',
      city: cityInput.value.trim() || 'New York',
      postalCode: zipInput.value.trim() || '10013',
      country: countrySelect?.value || 'United States',
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

    const tax = subtotal * 0.08;
    const paymentMethod = paymentRadio?.value || 'Credit Card';

    // Create and save real order
    const created = createOrder(customer, orderItems, subtotal, 0, tax, paymentMethod);

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
