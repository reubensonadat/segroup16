import { getOrders, Order } from '../orders-store';
import { formatGhs, toGhs } from '../currency';
import { getCreatorsKitReceiptUrl } from '../creators-kit';

export function renderTrackPage(orderIdParam?: string): string {
  const orders = getOrders();

  // If orderIdParam is provided or from hash, find it; otherwise default to most recent order or seed
  let activeOrder: Order | undefined;
  if (orderIdParam) {
    const cleanId = orderIdParam.replace(/^#/, '').trim().toUpperCase();
    activeOrder = orders.find((o) => o.id.toUpperCase() === cleanId || `RNW-${o.id}`.toUpperCase() === cleanId);
  }

  if (!activeOrder && orders.length > 0) {
    activeOrder = orders[0];
  }

  const recentOrdersListHtml = orders
    .slice(0, 5)
    .map(
      (o) => `
      <button class="track-quick-order-btn ${activeOrder && activeOrder.id === o.id ? 'is-active' : ''}" data-track-id="${o.id}">
        <span>#${o.id}</span>
        <span class="track-quick-status track-status--${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
      </button>
    `
    )
    .join('');

  if (!activeOrder) {
    return `
      <div class="brand-page track-page">
        <div class="brand-hero">
          <div class="brand-hero-badge">Order Logistics</div>
          <h1 class="brand-hero-title">Track Your Shipment</h1>
          <p class="brand-hero-sub">Enter your Runway order confirmation code to check package location and courier dispatch.</p>
        </div>
        <div class="track-search-box">
          <input type="text" id="track-search-input" placeholder="e.g. RNW-2424" class="brand-input" />
          <button id="track-search-btn" class="brand-btn brand-btn--dark">Track Order</button>
        </div>
        <p class="track-empty-note">No recent orders found. Place an order through our 3D Runway or Cart to start tracking.</p>
      </div>
    `;
  }

  const dateFormatted = new Date(activeOrder.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const creatorsKitReceiptUrl = getCreatorsKitReceiptUrl(activeOrder);
  const isPickup = activeOrder.customer.fulfillment === 'pickup';

  // Calculate delivery vs pickup timeline steps
  let stepIndex = 1;
  if (isPickup) {
    if (activeOrder.status === 'Processing') stepIndex = 2;
    if (activeOrder.status === 'Ready for Pickup') stepIndex = 3;
    if (activeOrder.status === 'Collected' || activeOrder.status === 'Delivered') stepIndex = 4;
    if (activeOrder.status === 'Cancelled') stepIndex = 0;
  } else {
    if (activeOrder.status === 'Processing') stepIndex = 2;
    if (activeOrder.status === 'Shipped' || activeOrder.status === 'In Transit') stepIndex = 4;
    if (activeOrder.status === 'Out for Delivery') stepIndex = 4;
    if (activeOrder.status === 'Delivered' || activeOrder.status === 'Collected') stepIndex = 5;
    if (activeOrder.status === 'Cancelled') stepIndex = 0;
  }

  const stepperHtml = isPickup
    ? `
      <div class="track-timeline">
        <div class="track-step ${stepIndex >= 1 ? 'is-complete' : ''} ${stepIndex === 1 ? 'is-current' : ''}">
          <div class="track-step-dot">✓</div>
          <div class="track-step-info">
            <span class="track-step-name">Order Confirmed</span>
            <span class="track-step-time">Payment verified</span>
          </div>
        </div>
        <div class="track-timeline-line ${stepIndex >= 2 ? 'is-active' : ''}"></div>

        <div class="track-step ${stepIndex >= 2 ? 'is-complete' : ''} ${stepIndex === 2 ? 'is-current' : ''}">
          <div class="track-step-dot">${stepIndex >= 2 ? '✓' : '2'}</div>
          <div class="track-step-info">
            <span class="track-step-name">Preparing in Store</span>
            <span class="track-step-time">Stockroom assembly & boxed</span>
          </div>
        </div>
        <div class="track-timeline-line ${stepIndex >= 3 ? 'is-active' : ''}"></div>

        <div class="track-step ${stepIndex >= 3 ? 'is-complete' : ''} ${stepIndex === 3 ? 'is-current' : ''}">
          <div class="track-step-dot">${stepIndex >= 3 ? '✓' : '3'}</div>
          <div class="track-step-info">
            <span class="track-step-name">Ready for Pickup</span>
            <span class="track-step-time">Awaiting collection at boutique</span>
          </div>
        </div>
        <div class="track-timeline-line ${stepIndex >= 4 ? 'is-active' : ''}"></div>

        <div class="track-step ${stepIndex >= 4 ? 'is-complete' : ''} ${stepIndex === 4 ? 'is-current' : ''}">
          <div class="track-step-dot">${stepIndex >= 4 ? '✓' : '4'}</div>
          <div class="track-step-info">
            <span class="track-step-name">Collected</span>
            <span class="track-step-time">Verified with customer code</span>
          </div>
        </div>
      </div>
    `
    : `
      <div class="track-timeline">
        <div class="track-step ${stepIndex >= 1 ? 'is-complete' : ''} ${stepIndex === 1 ? 'is-current' : ''}">
          <div class="track-step-dot">✓</div>
          <div class="track-step-info">
            <span class="track-step-name">Order Confirmed</span>
            <span class="track-step-time">Payment verified</span>
          </div>
        </div>
        <div class="track-timeline-line ${stepIndex >= 2 ? 'is-active' : ''}"></div>

        <div class="track-step ${stepIndex >= 2 ? 'is-complete' : ''} ${stepIndex === 2 ? 'is-current' : ''}">
          <div class="track-step-dot">${stepIndex >= 2 ? '✓' : '2'}</div>
          <div class="track-step-info">
            <span class="track-step-name">Garments Tailored</span>
            <span class="track-step-time">Studio atelier prep</span>
          </div>
        </div>
        <div class="track-timeline-line ${stepIndex >= 3 ? 'is-active' : ''}"></div>

        <div class="track-step ${stepIndex >= 3 ? 'is-complete' : ''} ${stepIndex === 3 ? 'is-current' : ''}">
          <div class="track-step-dot">${stepIndex >= 3 ? '✓' : '3'}</div>
          <div class="track-step-info">
            <span class="track-step-name">Quality Inspected</span>
            <span class="track-step-time">Authenticated & boxed</span>
          </div>
        </div>
        <div class="track-timeline-line ${stepIndex >= 4 ? 'is-active' : ''}"></div>

        <div class="track-step ${stepIndex >= 4 ? 'is-complete' : ''} ${stepIndex === 4 ? 'is-current' : ''}">
          <div class="track-step-dot">${stepIndex >= 4 ? '✓' : '4'}</div>
          <div class="track-step-info">
            <span class="track-step-name">${activeOrder.status === 'Out for Delivery' ? 'Out for Delivery' : 'In Transit'}</span>
            <span class="track-step-time">${activeOrder.status === 'Out for Delivery' ? 'Courier rider en route' : 'Air express dispatch'}</span>
          </div>
        </div>
        <div class="track-timeline-line ${stepIndex >= 5 ? 'is-active' : ''}"></div>

        <div class="track-step ${stepIndex >= 5 ? 'is-complete' : ''} ${stepIndex === 5 ? 'is-current' : ''}">
          <div class="track-step-dot">${stepIndex >= 5 ? '✓' : '5'}</div>
          <div class="track-step-info">
            <span class="track-step-name">Delivered</span>
            <span class="track-step-time">Signed at door</span>
          </div>
        </div>
      </div>
    `;

  const itemsHtml = activeOrder.items
    .map(
      (item) => `
      <div class="track-item-row">
        <div class="track-item-img">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="track-item-details">
          <span class="track-item-vendor">Official Nike Runway Edition</span>
          <h3 class="track-item-title">${item.name}</h3>
          <div class="track-item-meta">
            <span>Size: <strong>${item.size}</strong></span>
            <span>Qty: <strong>${item.quantity}</strong></span>
          </div>
        </div>
        <div class="track-item-price">${formatGhs(toGhs(item.price * item.quantity))}</div>
      </div>
    `
    )
    .join('');

  return `
    <div class="brand-page track-page">
      <div class="track-header-bar">
        <div>
          <span class="track-kicker">${isPickup ? 'Store Pickup & Collection Logistics' : 'Shipment Logistics & Delivery'}</span>
          <h1 class="track-title">Order #${activeOrder.id}</h1>
          <p class="track-subtitle">
            Placed on ${dateFormatted} · ${
              isPickup
                ? 'Boutique Collection Hub: Accra Mall Flagship Storefront'
                : 'Express Dispatch: DHL Global Air Priority / Local Courier'
            }
          </p>
        </div>
        <div class="track-search-inline">
          <input type="text" id="track-search-input" placeholder="Search other Order #" value="${activeOrder.id}" class="brand-input" />
          <button id="track-search-btn" class="brand-btn brand-btn--sm brand-btn--dark">Track</button>
        </div>
      </div>

      <!-- Quick Switch Recent Orders -->
      <div class="track-recent-strip">
        <span class="track-recent-label">Your Recent Orders:</span>
        <div class="track-recent-buttons">
          ${recentOrdersListHtml}
        </div>
      </div>

      <!-- Live Delivery / Pickup Progress Stepper -->
      <div class="track-stepper-card">
        <div class="track-stepper-head">
          <div class="track-status-badge track-status-badge--${activeOrder.status.toLowerCase().replace(/\s+/g, '-')}">
            Current Status: ${activeOrder.status}
          </div>
          <div class="track-est-delivery">
            ${
              isPickup
                ? 'Estimated Pickup: <strong>Ready within 2 business hours</strong>'
                : 'Estimated Delivery: <strong>Nov 9, 2026 by 7:00 PM</strong>'
            }
          </div>
        </div>

        ${stepperHtml}
      </div>

      <!-- Order Details Grid -->
      <div class="track-grid">
        <div class="track-items-box">
          <div class="track-box-head">
            <h2>Garment Styles in this Package (${activeOrder.items.length})</h2>
          </div>
          <div class="track-items-list">
            ${itemsHtml}
          </div>
        </div>

        <div class="track-sidebar">
          <div class="track-info-card">
            <h3>${isPickup ? 'Storefront Pickup Hub' : 'Delivery Destination'}</h3>
            <div class="track-info-line">
              <strong>${activeOrder.customer.fullName}</strong>
            </div>
            <div class="track-info-line">${isPickup ? 'Fulfillment: <strong>In-Store Boutique Pickup</strong>' : 'Fulfillment: <strong>Doorstep Express Delivery</strong>'}</div>
            <div class="track-info-line">${
              isPickup
                ? `${activeOrder.customer.street || 'Accra Mall Storefront, Shop G-14'}, ${activeOrder.customer.city || 'Accra'}`
                : activeOrder.customer.location
                ? `GPS: ${activeOrder.customer.location.latitude.toFixed(5)}, ${activeOrder.customer.location.longitude.toFixed(5)}`
                : (activeOrder.customer.street || 'Address not provided')
            }</div>
            <div class="track-info-divider"></div>
            <div class="track-info-line">
              <span>Customer Contact:</span>
              <strong>${activeOrder.customer.phone || activeOrder.customer.email || 'Not provided'}</strong>
            </div>
            <div class="track-info-line">
              <span>${isPickup ? 'Collection PIN:' : 'Courier Tracking:'}</span>
              <code class="track-code">${isPickup ? `PKP-${activeOrder.id}` : `DHL-9942-${activeOrder.id}`}</code>
            </div>
          </div>

          <div class="track-info-card">
            <h3>Payment & Totals</h3>
            <div class="track-calc-row">
              <span>Subtotal</span>
              <span>${formatGhs(toGhs(activeOrder.subtotal))}</span>
            </div>
            <div class="track-calc-row">
              <span>Express Shipping</span>
              <span class="track-free">Free</span>
            </div>
            <div class="track-info-divider"></div>
            <div class="track-calc-row track-calc-row--total">
              <span>Total Paid</span>
              <strong>${formatGhs(toGhs(activeOrder.total))}</strong>
            </div>
            <div class="track-method-tag">Paid via ${activeOrder.paymentMethod}</div>
            <a class="brand-btn brand-btn--dark" href="${creatorsKitReceiptUrl}" target="_blank" rel="noopener noreferrer">
              View Digital Receipt — Made with Creator’s Kit
            </a>
          </div>

          <div class="track-actions-card">
            <a href="#admin" class="brand-btn brand-btn--dark track-action-btn">Open in Admin Operations →</a>
            <a href="#home" class="brand-btn track-action-btn">Back to Runway Collection</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindTrackEvents(container: HTMLElement) {
  // Search button and input
  const searchInput = container.querySelector('#track-search-input') as HTMLInputElement | null;
  const searchBtn = container.querySelector('#track-search-btn');

  const doSearch = () => {
    const val = searchInput?.value.trim();
    if (!val) return;
    window.location.hash = `#track?id=${encodeURIComponent(val)}`;
  };

  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // Quick order buttons
  container.querySelectorAll<HTMLButtonElement>('[data-track-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-track-id');
      if (orderId) {
        window.location.hash = `#track?id=${orderId}`;
      }
    });
  });
}
