import {
  getOrders,
  getOrderStats,
  updateOrderStatus,
  resetOrdersToSeed,
  OrderStatus,
} from '../orders-store';
import { PRODUCTS } from '../data';
import { formatGhs, toGhs } from '../currency';
import { bindDropdowns, renderDropdown } from '../dropdown.tsx';
import { getCreatorsKitReceiptUrl } from '../creators-kit';
import { getBundleDiscountPercent, setBundleDiscountPercent } from '../bundle-store';

export function renderAdminPage(): string {
  const orders = getOrders();
  const stats = getOrderStats();

  const orderRowsHtml = orders
    .map((order) => {
      const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const itemsPreview = order.items
        .map(
          (item) => `
          <button class="admin-item-chip" data-style-inspect="${item.productId || item.name}" data-item-size="${item.size}" title="Click to view style details: ${item.name}">
            <img src="${item.image}" alt="${item.name}" />
            <span>${item.name} · Size <strong>${item.size}</strong> × ${item.quantity}</span>
            <span class="admin-chip-inspect-hint">↗</span>
          </button>
        `
        )
        .join('');

      return `
        <tr class="admin-table-row" data-order-id="${order.id}">
          <td class="admin-td-id">
            <strong>#${order.id}</strong>
            <span class="admin-date">${dateFormatted}</span>
          </td>
          <td class="admin-td-customer">
            <div class="admin-customer-name">${order.customer.fullName}</div>
            <div class="admin-customer-email">${order.customer.phone || order.customer.email || 'No phone provided'}</div>
            <div class="admin-customer-loc">${order.customer.fulfillment === 'pickup' ? 'Store pickup' : 'Free delivery'}</div>
          </td>
          <td class="admin-td-items">
            <div class="admin-items-list">
              ${itemsPreview}
            </div>
          </td>
          <td class="admin-td-payment">
            <div class="admin-pay-total">${formatGhs(toGhs(order.total))}</div>
            ${
              order.bundleDiscount
                ? `<span class="admin-bundle-tag">★ Look Bundle (${order.bundleName || '3-Piece'}) −${formatGhs(toGhs(order.bundleDiscount))}</span>`
                : ''
            }
            <div class="admin-pay-method">${order.paymentMethod}</div>
          </td>
          <td class="admin-td-status">
            ${renderDropdown(
              order.customer.fulfillment === 'pickup'
                ? [
                    { value: 'Processing', label: 'Processing (Store)', icon: 'processing' },
                    { value: 'Ready for Pickup', label: 'Ready for Pickup', icon: 'shipment' },
                    { value: 'Collected', label: 'Collected', icon: 'delivered' },
                    { value: 'Cancelled', label: 'Cancelled', icon: 'cancelled' },
                  ]
                : [
                    { value: 'Processing', label: 'Processing (Atelier)', icon: 'processing' },
                    { value: 'In Transit', label: 'In Transit (Courier)', icon: 'shipment' },
                    { value: 'Out for Delivery', label: 'Out for Delivery', icon: 'shipment' },
                    { value: 'Delivered', label: 'Delivered', icon: 'delivered' },
                    { value: 'Cancelled', label: 'Cancelled', icon: 'cancelled' },
                  ],
              order.status,
              `data-status-for="${order.id}"`,
              `admin-status-select admin-status--${order.status.toLowerCase().replace(/\s+/g, '-')}`
            )}
          </td>
          <td class="admin-td-actions">
            <div class="admin-actions-group">
              <button class="brand-btn brand-btn--sm" data-admin-inspect="${order.id}">Receipt</button>
              <a href="#track?id=${order.id}" class="brand-btn brand-btn--sm brand-btn--dark" title="Open live tracking for order #${order.id}">Track ↗</a>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="brand-page admin-page">
      <div class="admin-header-strip">
        <div>
          <span class="admin-kicker">Operations Dashboard</span>
          <h1 class="admin-title">Runway Order Fulfillment</h1>
          <p class="admin-sub">Monitor real-time incoming orders, track customer destinations, and inspect bought styles.</p>
        </div>
        <div class="admin-header-actions">
          <button id="admin-seed-btn" class="brand-btn brand-btn--sm">Reset Demo Orders</button>
          <a href="#cart" class="brand-btn brand-btn--dark brand-btn--sm">Storefront Cart →</a>
        </div>
      </div>

      <!-- KPI Metrics -->
      <div class="admin-kpi-grid">
        <div class="admin-kpi-card">
          <div class="admin-kpi-label">Total Gross Revenue</div>
          <div class="admin-kpi-val">${formatGhs(toGhs(stats.totalRevenue))}</div>
          <div class="admin-kpi-sub">Across ${stats.totalOrders} total completed checkouts</div>
        </div>
        <div class="admin-kpi-card">
          <div class="admin-kpi-label">Average Order Value (AOV)</div>
          <div class="admin-kpi-val">${formatGhs(toGhs(stats.aov))}</div>
          <div class="admin-kpi-sub">Streetwear full outfits & shoes</div>
        </div>
        <div class="admin-kpi-card">
          <div class="admin-kpi-label">Order Pipeline Breakdown</div>
          <div class="admin-pipeline-pills">
            <span class="status-pill status-pill--proc">${stats.processingCount} Processing</span>
            <span class="status-pill status-pill--ship">${stats.shippedCount} Shipped</span>
            <span class="status-pill status-pill--deliv">${stats.deliveredCount} Delivered</span>
          </div>
        </div>
      </div>

      <!-- Promotions & Look Bundle Settings -->
      <div class="admin-promo-settings-card">
        <div class="admin-promo-settings-head">
          <div class="admin-promo-title-wrap">
            <span class="admin-promo-badge">STORE & RUNWAY PROMOTIONS</span>
            <h3>3D Runway Look Bundle Discount Engine</h3>
            <p>Set the automatic package discount applied when customers bundle all 3 garments (top, pants, footwear) of any runway look.</p>
          </div>
          <div class="admin-promo-current-badge">
            Active Discount: <strong id="admin-active-rate-badge">${getBundleDiscountPercent()}% OFF</strong>
          </div>
        </div>
        <div class="admin-promo-controls">
          <div class="admin-promo-input-group">
            <label for="admin-bundle-rate-input">Look Bundle Discount (%):</label>
            <input type="number" id="admin-bundle-rate-input" min="0" max="100" value="${getBundleDiscountPercent()}" class="brand-input admin-rate-input" />
            <button id="admin-save-discount-btn" class="brand-btn brand-btn--dark brand-btn--sm">Save Rate</button>
          </div>
          <div class="admin-promo-presets">
            <span>Quick Presets:</span>
            <button class="admin-preset-btn" data-rate="0">0% (Off)</button>
            <button class="admin-preset-btn" data-rate="10">10% (Default)</button>
            <button class="admin-preset-btn" data-rate="15">15% (VIP)</button>
            <button class="admin-preset-btn" data-rate="20">20% (Flash)</button>
          </div>
        </div>
        <div id="admin-promo-feedback" class="admin-promo-feedback" hidden></div>
      </div>

      <!-- Orders Table -->
      <div class="admin-table-container">
        <div class="admin-table-header">
          <h2>All Orders (${orders.length})</h2>
          <span class="admin-live-pulse">● Live Order Store</span>
        </div>

        <div class="admin-table-scroll">
          <table class="admin-orders-table">
            <thead>
              <tr>
                <th>Order # & Time</th>
                <th>Client & Destination</th>
                <th>Purchased Outfits (Click to Inspect)</th>
                <th>Total & Payment</th>
                <th>Fulfillment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orderRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Receipt / Detail Modal -->
      <dialog id="admin-detail-modal" class="checkout-modal">
        <div class="checkout-modal-inner" id="admin-detail-body">
          <!-- Injected dynamically -->
        </div>
      </dialog>

      <!-- Style Inspector Modal -->
      <dialog id="admin-style-modal" class="checkout-modal">
        <div class="checkout-modal-inner" id="admin-style-body">
          <!-- Injected dynamically -->
        </div>
      </dialog>
    </div>
  `;
}

export function bindAdminEvents(container: HTMLElement) {
  bindDropdowns(container, (dropdown, value) => {
    const orderId = dropdown.getAttribute('data-status-for');
    if (!orderId) return;
    const newStatus = value as OrderStatus;
    updateOrderStatus(orderId, newStatus);
    dropdown.className = `dropdown-react-host admin-status-select admin-status--${newStatus.toLowerCase().replace(/\s+/g, '-')}`;
  });

  // Bundle Discount Rate Controls
  const rateInput = container.querySelector('#admin-bundle-rate-input') as HTMLInputElement | null;
  const saveRateBtn = container.querySelector('#admin-save-discount-btn');
  const rateFeedback = container.querySelector('#admin-promo-feedback') as HTMLElement | null;
  const activeRateBadge = container.querySelector('#admin-active-rate-badge');

  const updateDiscount = (newPercent: number) => {
    setBundleDiscountPercent(newPercent);
    if (rateInput) rateInput.value = String(newPercent);
    if (activeRateBadge) activeRateBadge.textContent = `${newPercent}% OFF`;
    if (rateFeedback) {
      rateFeedback.hidden = false;
      rateFeedback.textContent = `✓ 3D Runway Look Bundle Discount updated to ${newPercent}%. Customers bundling complete outfits will automatically receive this discount at checkout!`;
      setTimeout(() => {
        rateFeedback.hidden = true;
      }, 5000);
    }
  };

  saveRateBtn?.addEventListener('click', () => {
    const val = parseFloat(rateInput?.value || '10');
    updateDiscount(isNaN(val) ? 10 : val);
  });

  container.querySelectorAll<HTMLButtonElement>('.admin-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rate = parseFloat(btn.dataset.rate || '10');
      updateDiscount(rate);
    });
  });

  // Seed / Reset demo orders
  const seedBtn = container.querySelector('#admin-seed-btn');
  seedBtn?.addEventListener('click', () => {
    resetOrdersToSeed();
    const pageContainer = document.getElementById('page-content');
    if (pageContainer) {
      pageContainer.innerHTML = renderAdminPage();
      bindAdminEvents(pageContainer);
    }
  });

  // Inspect Style Details Modal
  const styleModal = container.querySelector('#admin-style-modal') as HTMLDialogElement | null;
  const styleBody = container.querySelector('#admin-style-body');

  container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-style-inspect]') as HTMLElement | null;
    if (!target) return;

    const styleKey = target.getAttribute('data-style-inspect') || '';
    const orderedSize = target.getAttribute('data-item-size') || '';

    // Find in PRODUCTS dictionary
    let product = PRODUCTS[styleKey];
    if (!product) {
      // Find by matching name
      for (const p of Object.values(PRODUCTS)) {
        if (p.name.toLowerCase() === styleKey.toLowerCase()) {
          product = p;
          break;
        }
      }
    }

    if (!product || !styleBody) return;

    styleBody.innerHTML = `
      <div class="checkout-modal-head">
        <h2>Garment Style Specs</h2>
        <button id="close-style-modal" class="checkout-close-btn">×</button>
      </div>

      <div class="admin-style-detail-content">
        <div class="admin-style-detail-hero">
          <div class="admin-style-detail-img">
            <img src="${product.image}" alt="${product.name}" />
          </div>
          <div class="admin-style-detail-info">
            <span class="orbit-vendor">${product.vendor}</span>
            <h3 class="admin-style-name">${product.name}</h3>
            <div class="admin-style-ordered-badge">Ordered Size: <strong>${orderedSize || 'M'}</strong></div>
            <div class="admin-style-price-tag">${formatGhs(toGhs(product.price))}</div>
            <p class="admin-style-desc">
              Authentic garment from the digital runway. Crafted with heavyweight cotton jersey, structured tailoring, and signature contrast stitching.
            </p>
            <div class="admin-style-specs-grid">
              <div><span>SKU</span><strong>NK-RNW-${product.id.slice(0, 6).toUpperCase()}</strong></div>
              <div><span>Category</span><strong>${product.type || 'Apparel'}</strong></div>
              <div><span>Available Sizes</span><strong>${product.sizes.join(', ')}</strong></div>
              <div><span>Stock Status</span><strong style="color:#059669">In Production Atelier</strong></div>
            </div>
            <div class="admin-style-actions">
              <a href="#home" class="brand-btn brand-btn--dark brand-btn--sm">View on 3D Stage</a>
              <button id="close-style-btn" class="brand-btn brand-btn--sm">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    styleModal?.showModal();

    styleBody.querySelector('#close-style-modal')?.addEventListener('click', () => {
      styleModal?.close();
    });
    styleBody.querySelector('#close-style-btn')?.addEventListener('click', () => {
      styleModal?.close();
    });
  });

  styleModal?.addEventListener('click', (e) => {
    if (e.target === styleModal) styleModal.close();
  });

  // Inspect Order Receipt Modal
  const modal = container.querySelector('#admin-detail-modal') as HTMLDialogElement | null;
  const modalBody = container.querySelector('#admin-detail-body');

  container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-admin-inspect]') as HTMLElement | null;
    if (!target) return;
    const inspectId = target.getAttribute('data-admin-inspect');
    if (!inspectId) return;

    const orders = getOrders();
    const order = orders.find((o) => o.id === inspectId);
    if (!order || !modalBody) return;

    const itemsHtml = order.items
      .map(
        (i) => `
        <div class="admin-modal-item">
          <img src="${i.image}" alt="${i.name}" />
          <div class="admin-modal-item-info">
            <h4>${i.name}</h4>
            <div>Size: <strong>${i.size}</strong> · Qty: ${i.quantity}</div>
          </div>
          <div class="admin-modal-item-price">${formatGhs(toGhs(i.price * i.quantity))}</div>
        </div>
      `
      )
      .join('');

    modalBody.innerHTML = `
      <div class="checkout-modal-head">
        <h2>Order #${order.id}</h2>
        <button id="close-admin-modal" class="checkout-close-btn">×</button>
      </div>

      <div class="admin-modal-content">
        <div class="admin-modal-meta">
          <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          <div><strong>Customer:</strong> ${order.customer.fullName} (${order.customer.phone || order.customer.email || 'No phone provided'})</div>
          <div><strong>Fulfilment:</strong> ${order.customer.fulfillment === 'pickup' ? 'Store pickup' : 'Free delivery'}</div>
          <div><strong>Location:</strong> ${order.customer.location ? `${order.customer.location.latitude}, ${order.customer.location.longitude}` : 'Not provided'}</div>
          <div><strong>Payment Method:</strong> ${order.paymentMethod}</div>
          <div><strong>Fulfillment Status:</strong> <span class="status-pill status-pill--${order.status.toLowerCase()}">${order.status}</span></div>
          <div><strong>Track Package:</strong> <a href="#track?id=${order.id}" style="text-decoration:underline; font-weight:600">Open Shipment Tracker ↗</a></div>
        </div>

        <div class="admin-modal-items-head">Purchased Pieces</div>
        <div class="admin-modal-items-list">
          ${itemsHtml}
        </div>

        <div class="admin-modal-totals">
          <div>Subtotal: ${formatGhs(toGhs(order.subtotal))}</div>
          <div>Shipping: Free Express</div>
          <div class="admin-modal-total-strong">Grand Total: ${formatGhs(toGhs(order.total))}</div>
        </div>

        <div class="admin-modal-actions">
          <button class="brand-btn brand-btn--dark" id="print-order-btn">Save Receipt in Creator’s Kit</button>
        </div>
      </div>
    `;

    modal?.showModal();

    modalBody.querySelector('#close-admin-modal')?.addEventListener('click', () => {
      modal?.close();
    });

    modalBody.querySelector('#print-order-btn')?.addEventListener('click', () => {
      window.open(getCreatorsKitReceiptUrl(order), '_blank', 'noopener,noreferrer');
    });
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}
