import {
  getOrders,
  getOrderStats,
  updateOrderStatus,
  resetOrdersToSeed,
  OrderStatus,
} from '../orders-store';
import { PRODUCTS, LOOKS } from '../data';
import { formatGhs, toGhs } from '../currency';
import { bindDropdowns, renderDropdown } from '../dropdown.tsx';
import { getCreatorsKitReceiptUrl } from '../creators-kit';
import { getBundleDiscountPercent, setBundleDiscountPercent } from '../bundle-store';

/* ─── SVG icons (stroke-only, no fill, no emojis) ─────────────────────── */
const ic = {
  overview: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  products: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  orders: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  storefront: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  plus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  close: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  receipt: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  arrow: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  external: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  drag: `<svg width="36" height="5" viewBox="0 0 36 5"><rect width="36" height="5" rx="2.5" fill="#D4D4D8"/></svg>`,
  trend: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const navItem = (section: string, label: string, icon: string, active = false) => `
  <button class="ap-nav-item${active ? ' is-active' : ''}" data-section="${section}" type="button">
    <span class="ap-nav-icon">${icon}</span>
    <span class="ap-nav-label">${label}</span>
  </button>`;

/* ─── SECTION: Overview ─────────────────────────────────────────────────── */
function renderOverview(): string {
  const stats = getOrderStats();
  const orders = getOrders();
  const bundleOrders = orders.filter((o) => o.bundleDiscount && o.bundleDiscount > 0);
  const products = Object.values(PRODUCTS);

  return `<section class="ap-section" id="ap-overview">
    <div class="ap-page-head">
      <div>
        <div class="ap-page-eyebrow">Operations Hub</div>
        <h1 class="ap-page-title">Overview</h1>
      </div>
      <span class="ap-live-badge">
        <span class="ap-live-dot"></span>Live
      </span>
    </div>

    <div class="ap-kpi-row">
      <div class="ap-kpi-card">
        <div class="ap-kpi-label">Total Revenue</div>
        <div class="ap-kpi-val">${formatGhs(toGhs(stats.totalRevenue))}</div>
        <div class="ap-kpi-meta">${stats.totalOrders} completed orders ${ic.trend}</div>
      </div>
      <div class="ap-kpi-card">
        <div class="ap-kpi-label">Avg Order Value</div>
        <div class="ap-kpi-val">${formatGhs(toGhs(stats.aov))}</div>
        <div class="ap-kpi-meta">per checkout</div>
      </div>
      <div class="ap-kpi-card">
        <div class="ap-kpi-label">Bundle Orders</div>
        <div class="ap-kpi-val">${bundleOrders.length}</div>
        <div class="ap-kpi-meta">3-piece look packages sold</div>
      </div>
      <div class="ap-kpi-card">
        <div class="ap-kpi-label">Catalogue Size</div>
        <div class="ap-kpi-val">${products.length}</div>
        <div class="ap-kpi-meta">${LOOKS.length} looks on runway</div>
      </div>
    </div>

    <div class="ap-overview-cols">
      <div class="ap-block">
        <div class="ap-block-head">Order Pipeline</div>
        <div class="ap-pipeline-row">
          <div class="ap-pipeline-item">
            <div class="ap-pipeline-num">${stats.processingCount}</div>
            <div class="ap-pipeline-label">Processing</div>
            <div class="ap-pipeline-bar" style="--fill: ${Math.round((stats.processingCount / Math.max(stats.totalOrders, 1)) * 100)}%"></div>
          </div>
          <div class="ap-pipeline-item">
            <div class="ap-pipeline-num">${stats.shippedCount}</div>
            <div class="ap-pipeline-label">In Transit</div>
            <div class="ap-pipeline-bar" style="--fill: ${Math.round((stats.shippedCount / Math.max(stats.totalOrders, 1)) * 100)}%"></div>
          </div>
          <div class="ap-pipeline-item">
            <div class="ap-pipeline-num">${stats.deliveredCount}</div>
            <div class="ap-pipeline-label">Delivered</div>
            <div class="ap-pipeline-bar" style="--fill: ${Math.round((stats.deliveredCount / Math.max(stats.totalOrders, 1)) * 100)}%"></div>
          </div>
        </div>
      </div>

      <div class="ap-block">
        <div class="ap-block-head">Bundle Discount Rate</div>
        <div class="ap-promo-rate-display" id="ap-promo-rate-display">${getBundleDiscountPercent()}%</div>
        <div class="ap-promo-desc">Applied when a customer adds all 3 garments of a runway look at checkout</div>
        <div class="ap-promo-controls">
          <input type="number" id="ap-rate-input" class="ap-rate-input" min="0" max="100" value="${getBundleDiscountPercent()}" />
          <button id="ap-save-rate" class="ap-btn ap-btn--dark ap-btn--sm">Save</button>
        </div>
        <div class="ap-promo-presets">
          <span class="ap-presets-label">Quick set:</span>
          <button class="ap-preset-pill" data-rate="0">0%</button>
          <button class="ap-preset-pill" data-rate="10">10%</button>
          <button class="ap-preset-pill" data-rate="15">15%</button>
          <button class="ap-preset-pill" data-rate="20">20%</button>
        </div>
        <div id="ap-rate-feedback" class="ap-rate-feedback" hidden></div>
      </div>
    </div>

    <div class="ap-block">
      <div class="ap-block-head">Recent Orders</div>
      ${renderMiniOrderList()}
    </div>
  </section>`;
}

function renderMiniOrderList(): string {
  const orders = getOrders().slice(0, 5);
  if (!orders.length) return `<div class="ap-empty">No orders yet.</div>`;
  return orders.map((o) => {
    const date = new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `<div class="ap-mini-order">
      <div class="ap-mini-order-id">#${o.id}</div>
      <div class="ap-mini-order-name">${o.customer.fullName}</div>
      <div class="ap-mini-order-date">${date}</div>
      <div class="ap-mini-order-total">${formatGhs(toGhs(o.total))}</div>
      <span class="ap-status-pill ap-status--${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
    </div>`;
  }).join('');
}

/* ─── SECTION: Products / Runway ────────────────────────────────────────── */
function renderProducts(): string {
  const products = Object.values(PRODUCTS);
  const looks = LOOKS;

  const productCards = products.map((p) => `
    <div class="ap-product-card">
      <div class="ap-product-img-wrap">
        <img src="${p.image}" alt="${p.name}" class="ap-product-img" loading="lazy" />
      </div>
      <div class="ap-product-info">
        <div class="ap-product-vendor">${p.vendor}</div>
        <div class="ap-product-name">${p.name}</div>
        <div class="ap-product-type">${p.type}</div>
        <div class="ap-product-price">${formatGhs(toGhs(p.price))}</div>
        <div class="ap-product-sizes">${p.sizes.map((s) => `<span class="ap-size-tag">${s}</span>`).join('')}</div>
      </div>
      <button class="ap-product-edit-btn" data-product-edit="${p.id}" aria-label="Edit ${p.name}">
        ${ic.edit}
      </button>
    </div>`).join('');

  const lookSlots = Array.from({ length: 12 }, (_, i) => {
    const look = looks[i];
    if (look) {
      return `<div class="ap-look-slot ap-look-slot--filled">
        <div class="ap-look-slot-num">Look ${String(i + 1).padStart(2, '0')}</div>
        <div class="ap-look-slot-img-wrap">
          <img src="${look.model640 || look.probe}" alt="${look.name || `Look ${i + 1}`}" />
        </div>
        <div class="ap-look-slot-name">${look.name || `Look ${i + 1}`}</div>
        <div class="ap-look-slot-count">${look.pins?.length ?? 0} garments</div>
        <button class="ap-look-slot-btn" data-look-slot="${i}">${ic.edit} Edit</button>
      </div>`;
    }
    return `<div class="ap-look-slot ap-look-slot--empty">
      <div class="ap-look-slot-num">Look ${String(i + 1).padStart(2, '0')}</div>
      <div class="ap-look-slot-empty-icon">${ic.plus}</div>
      <div class="ap-look-slot-label">Not configured</div>
      <button class="ap-look-slot-btn ap-look-slot-btn--add" data-look-slot="${i}">Configure</button>
    </div>`;
  }).join('');

  return `<section class="ap-section" id="ap-products">
    <div class="ap-page-head">
      <div>
        <div class="ap-page-eyebrow">Store Catalogue</div>
        <h1 class="ap-page-title">Products</h1>
      </div>
      <button class="ap-btn ap-btn--dark ap-btn--sm" id="ap-add-product-btn">
        ${ic.plus} Add Product
      </button>
    </div>

    <div class="ap-tabs-row" id="ap-products-tabs">
      <button class="ap-tab is-active" data-tab="catalogue">All Items <span class="ap-tab-count">${products.length}</span></button>
      <button class="ap-tab" data-tab="runway">3D Runway Looks <span class="ap-tab-count">${looks.length}/12</span></button>
    </div>

    <div id="ap-tab-catalogue">
      <div class="ap-products-grid">${productCards}</div>
    </div>

    <div id="ap-tab-runway" hidden>
      <p class="ap-section-desc">Configure up to 12 runway looks. Each look has a photo, up to 3 garments, available sizes, and pricing.</p>
      <div class="ap-looks-grid">${lookSlots}</div>
    </div>

    <!-- Look config slide-up sheet -->
    <div id="ap-look-modal" class="ap-slide-wrap" aria-hidden="true">
      <div class="ap-slide-backdrop" id="ap-look-backdrop"></div>
      <div class="ap-slide-sheet" role="dialog" aria-modal="true">
        <div class="ap-sheet-handle">${ic.drag}</div>
        <div class="ap-sheet-head">
          <h3 class="ap-sheet-title" id="ap-look-title">Configure Look</h3>
          <button class="ap-sheet-close" id="ap-look-close">${ic.close}</button>
        </div>
        <div class="ap-sheet-body" id="ap-look-body"></div>
      </div>
    </div>
  </section>`;
}

/* ─── SECTION: Orders ───────────────────────────────────────────────────── */
function renderOrders(): string {
  const orders = getOrders();

  const rows = orders.map((order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const chips = order.items.map((item) => `
      <button class="ap-item-chip" data-style-inspect="${item.productId || item.name}" data-item-size="${item.size}">
        <img src="${item.image}" alt="${item.name}" />
        <span>${item.name} · <strong>${item.size}</strong></span>
      </button>`).join('');

    return `<tr class="ap-row" data-order-id="${order.id}">
      <td class="ap-td">
        <div class="ap-order-id">#${order.id}</div>
        <div class="ap-order-date">${date}</div>
      </td>
      <td class="ap-td">
        <div class="ap-customer-name">${order.customer.fullName}</div>
        <div class="ap-customer-meta">${order.customer.phone || order.customer.email || '—'}</div>
        <div class="ap-customer-meta">${order.customer.fulfillment === 'pickup' ? 'Store pickup' : 'Delivery'}</div>
      </td>
      <td class="ap-td"><div class="ap-chips-wrap">${chips}</div></td>
      <td class="ap-td">
        <div class="ap-pay-total">${formatGhs(toGhs(order.total))}</div>
        ${order.bundleDiscount ? `<div class="ap-discount-tag">Bundle −${formatGhs(toGhs(order.bundleDiscount))}</div>` : ''}
        <div class="ap-pay-method">${order.paymentMethod}</div>
      </td>
      <td class="ap-td ap-td--status">
        ${renderDropdown(
          order.customer.fulfillment === 'pickup'
            ? [
                { value: 'Processing', label: 'Processing', icon: 'processing' },
                { value: 'Ready for Pickup', label: 'Ready for Pickup', icon: 'shipment' },
                { value: 'Collected', label: 'Collected', icon: 'delivered' },
                { value: 'Cancelled', label: 'Cancelled', icon: 'cancelled' },
              ]
            : [
                { value: 'Processing', label: 'Processing', icon: 'processing' },
                { value: 'In Transit', label: 'In Transit', icon: 'shipment' },
                { value: 'Out for Delivery', label: 'Out for Delivery', icon: 'shipment' },
                { value: 'Delivered', label: 'Delivered', icon: 'delivered' },
                { value: 'Cancelled', label: 'Cancelled', icon: 'cancelled' },
              ],
          order.status,
          `data-status-for="${order.id}"`,
          `dropdown-react-host ap-status-select ap-status--${order.status.toLowerCase().replace(/\s+/g, '-')}`
        )}
      </td>
      <td class="ap-td ap-td--actions">
        <button class="ap-action-btn" data-admin-inspect="${order.id}">${ic.receipt} Receipt</button>
        <a href="#track?id=${order.id}" class="ap-action-btn ap-action-btn--dark">${ic.arrow} Track</a>
      </td>
    </tr>`;
  }).join('');

  return `<section class="ap-section" id="ap-orders">
    <div class="ap-page-head">
      <div>
        <div class="ap-page-eyebrow">Fulfilment</div>
        <h1 class="ap-page-title">Orders <span class="ap-page-count">${orders.length}</span></h1>
      </div>
      <span class="ap-live-badge"><span class="ap-live-dot"></span>Live</span>
    </div>

    <div class="ap-table-scroll">
      <table class="ap-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

/* ─── SECTION: Settings ─────────────────────────────────────────────────── */
function renderSettings(): string {
  return `<section class="ap-section" id="ap-settings">
    <div class="ap-page-head">
      <div>
        <div class="ap-page-eyebrow">Configuration</div>
        <h1 class="ap-page-title">Settings</h1>
      </div>
    </div>

    <div class="ap-settings-cols">
      <div class="ap-block">
        <div class="ap-block-head">Store Information</div>
        <div class="ap-field-group">
          <label class="ap-label">Store Name</label>
          <input type="text" class="ap-input" placeholder="e.g. Around Clothing" />
        </div>
        <div class="ap-field-group">
          <label class="ap-label">Instagram Handle</label>
          <input type="text" class="ap-input" placeholder="@yourhandle" />
        </div>
        <div class="ap-field-group">
          <label class="ap-label">Pickup Hub Address</label>
          <input type="text" class="ap-input" placeholder="e.g. Osu, Accra" />
        </div>
        <div class="ap-field-group">
          <label class="ap-label">MoMo Merchant Number</label>
          <input type="text" class="ap-input" placeholder="024 XXX XXXX" />
        </div>
        <button class="ap-btn ap-btn--dark" style="margin-top:16px">Save Store Info</button>
      </div>

      <div>
        <div class="ap-block">
          <div class="ap-block-head">Bundle Discount</div>
          <p class="ap-block-desc">This rate applies site-wide when customers bundle a full 3-piece runway look.</p>
          <div class="ap-field-group">
            <label class="ap-label">Discount Rate (%)</label>
            <div class="ap-inline-row">
              <input type="number" id="ap-settings-rate-input" class="ap-input ap-input--sm" min="0" max="100" value="${getBundleDiscountPercent()}" />
              <button id="ap-settings-save-rate" class="ap-btn ap-btn--dark ap-btn--sm">Apply</button>
            </div>
          </div>
          <div id="ap-settings-rate-feedback" class="ap-rate-feedback" hidden></div>
        </div>

        <div class="ap-block" style="margin-top:16px">
          <div class="ap-block-head">Admin Actions</div>
          <div class="ap-settings-actions">
            <div class="ap-settings-action-row">
              <div>
                <div class="ap-settings-action-label">Reset demo orders</div>
                <div class="ap-settings-action-desc">Restores seed data for demo purposes</div>
              </div>
              <button id="ap-seed-btn" class="ap-btn ap-btn--sm">Reset</button>
            </div>
            <div class="ap-settings-action-row">
              <div>
                <div class="ap-settings-action-label">Return to storefront</div>
                <div class="ap-settings-action-desc">Go back to the public-facing 3D runway</div>
              </div>
              <a href="#home" class="ap-btn ap-btn--dark ap-btn--sm">${ic.storefront} Storefront</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ─── Look config form (injected into slide sheet) ──────────────────────── */
function renderLookForm(slotIndex: number): string {
  const look = LOOKS[slotIndex];
  const lookNum = String(slotIndex + 1).padStart(2, '0');
  const chips = (sizes: string[], group: string) =>
    sizes.map((s) => `<button type="button" class="ap-size-chip" data-group="${group}" data-val="${s}">${s}</button>`).join('');

  return `<form class="ap-look-form" id="ap-look-form" data-slot="${slotIndex}">
    <div class="ap-form-row">
      <span class="ap-form-slot-label">Look ${lookNum}</span>
    </div>

    <div class="ap-field-group">
      <label class="ap-label">Look Title</label>
      <input type="text" name="title" class="ap-input" placeholder="e.g. Urban Utility Set" value="${look?.name || ''}" />
    </div>

    <div class="ap-field-group">
      <label class="ap-label">Model Photo URL</label>
      <input type="url" name="photoUrl" id="ap-photo-url" class="ap-input" placeholder="https://..." value="${look?.model640 || look?.probe || ''}" />
      <div class="ap-photo-preview" id="ap-photo-preview">
        ${(look?.model640 || look?.probe) ? `<img src="${look?.model640 || look?.probe}" alt="Preview" />` : '<span class="ap-photo-empty">No photo</span>'}
      </div>
    </div>

    <div class="ap-form-divider">Item 1 — Top</div>
    <div class="ap-garment-block">
      <div class="ap-form-cols">
        <div class="ap-field-group"><label class="ap-label">Name</label><input type="text" name="top_name" class="ap-input" placeholder="e.g. Cargo Jacket" /></div>
        <div class="ap-field-group"><label class="ap-label">Category</label><input type="text" name="top_cat" class="ap-input" placeholder="e.g. Outerwear" /></div>
      </div>
      <div class="ap-form-cols">
        <div class="ap-field-group"><label class="ap-label">Cost Price (GH₵)</label><input type="number" name="top_cost" class="ap-input" placeholder="0.00" min="0" step="0.01" /></div>
        <div class="ap-field-group"><label class="ap-label">Selling Price (GH₵)</label><input type="number" name="top_sell" class="ap-input" placeholder="0.00" min="0" step="0.01" /></div>
      </div>
      <div class="ap-field-group">
        <label class="ap-label">Sizes</label>
        <div class="ap-size-chips-row">${chips(['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'top')}</div>
      </div>
    </div>

    <div class="ap-form-divider">Item 2 — Bottom</div>
    <div class="ap-garment-block">
      <div class="ap-form-cols">
        <div class="ap-field-group"><label class="ap-label">Name</label><input type="text" name="btm_name" class="ap-input" placeholder="e.g. Cargo Pants" /></div>
        <div class="ap-field-group"><label class="ap-label">Category</label><input type="text" name="btm_cat" class="ap-input" placeholder="e.g. Bottoms" /></div>
      </div>
      <div class="ap-form-cols">
        <div class="ap-field-group"><label class="ap-label">Cost Price (GH₵)</label><input type="number" name="btm_cost" class="ap-input" placeholder="0.00" min="0" step="0.01" /></div>
        <div class="ap-field-group"><label class="ap-label">Selling Price (GH₵)</label><input type="number" name="btm_sell" class="ap-input" placeholder="0.00" min="0" step="0.01" /></div>
      </div>
      <div class="ap-field-group">
        <label class="ap-label">Waist Sizes</label>
        <div class="ap-size-chips-row">${chips(['28', '30', '32', '34', '36', 'S', 'M', 'L', 'XL'], 'btm')}</div>
      </div>
    </div>

    <div class="ap-form-divider">Item 3 — Footwear</div>
    <div class="ap-garment-block">
      <div class="ap-form-cols">
        <div class="ap-field-group"><label class="ap-label">Name</label><input type="text" name="shoe_name" class="ap-input" placeholder="e.g. Air Force 1" /></div>
        <div class="ap-field-group"><label class="ap-label">Category</label><input type="text" name="shoe_cat" class="ap-input" placeholder="e.g. Sneakers" /></div>
      </div>
      <div class="ap-form-cols">
        <div class="ap-field-group"><label class="ap-label">Cost Price (GH₵)</label><input type="number" name="shoe_cost" class="ap-input" placeholder="0.00" min="0" step="0.01" /></div>
        <div class="ap-field-group"><label class="ap-label">Selling Price (GH₵)</label><input type="number" name="shoe_sell" class="ap-input" placeholder="0.00" min="0" step="0.01" /></div>
      </div>
      <div class="ap-field-group">
        <label class="ap-label">EU Shoe Sizes</label>
        <div class="ap-size-chips-row">${chips(['39', '40', '41', '42', '43', '44', '45', '46'], 'shoe')}</div>
      </div>
    </div>

    <div class="ap-field-group">
      <label class="ap-label">Bundle Discount Override (%)</label>
      <input type="number" name="bundle_discount" class="ap-input ap-input--sm" min="0" max="100" placeholder="Leave blank to use global (${getBundleDiscountPercent()}%)" />
    </div>

    <div class="ap-sheet-footer">
      <button type="submit" class="ap-btn ap-btn--dark ap-btn--full">Save &amp; Push to Runway</button>
      <button type="button" class="ap-btn ap-btn--full" id="ap-look-cancel">Cancel</button>
    </div>
  </form>`;
}

/* ─── Root render ───────────────────────────────────────────────────────── */
export function renderAdminPage(): string {
  return `<div class="ap-shell">

    <!-- ─── Desktop Sidebar (Kola ManagerSidebar pattern) ─── -->
    <aside class="ap-sidebar">
      <div class="ap-sidebar-top">
        <div class="ap-brand-block">
          <div class="ap-brand-logo">NK</div>
          <div class="ap-brand-info">
            <div class="ap-brand-name">Operations</div>
            <div class="ap-brand-sub">Admin Studio</div>
          </div>
        </div>
      </div>

      <nav class="ap-sidebar-nav">
        <div class="ap-nav-section-label">Management</div>
        ${navItem('ap-overview', 'Overview', ic.overview, true)}
        ${navItem('ap-products', 'Products', ic.products)}
        ${navItem('ap-orders', 'Orders', ic.orders)}
        ${navItem('ap-settings', 'Settings', ic.settings)}
      </nav>

      <div class="ap-sidebar-foot">
        <a href="#home" class="ap-storefront-link">
          <span>${ic.storefront}</span>
          <span>Live Storefront</span>
          <span class="ap-storefront-arrow">${ic.external}</span>
        </a>
      </div>
    </aside>

    <!-- ─── Main content ─── -->
    <main class="ap-main">
      ${renderOverview()}
      ${renderProducts()}
      ${renderOrders()}
      ${renderSettings()}
    </main>

    <!-- ─── Mobile floating bottom nav (Kola DashboardBottomNav pattern) ─── -->
    <div class="ap-bottom-nav-wrap">
      <nav class="ap-bottom-nav" aria-label="Admin navigation">
        <button class="ap-bnav-item is-active" data-section="ap-overview" type="button">
          <span class="ap-bnav-icon">${ic.overview}</span>
          <span class="ap-bnav-label">Overview</span>
        </button>
        <button class="ap-bnav-item" data-section="ap-products" type="button">
          <span class="ap-bnav-icon">${ic.products}</span>
          <span class="ap-bnav-label">Products</span>
        </button>
        <button class="ap-bnav-item" data-section="ap-orders" type="button">
          <span class="ap-bnav-icon">${ic.orders}</span>
          <span class="ap-bnav-label">Orders</span>
        </button>
        <button class="ap-bnav-item" data-section="ap-settings" type="button">
          <span class="ap-bnav-icon">${ic.settings}</span>
          <span class="ap-bnav-label">Settings</span>
        </button>
      </nav>
    </div>

    <!-- ─── Modals ─── -->
    <dialog id="admin-detail-modal" class="checkout-modal">
      <div class="checkout-modal-inner" id="admin-detail-body"></div>
    </dialog>
    <dialog id="admin-style-modal" class="checkout-modal">
      <div class="checkout-modal-inner" id="admin-style-body"></div>
    </dialog>
  </div>`;
}

/* ─── Section activation ────────────────────────────────────────────────── */
function activateSection(sectionId: string, container: HTMLElement) {
  container.querySelectorAll<HTMLElement>('.ap-section').forEach((s) => { s.hidden = s.id !== sectionId; });
  container.querySelectorAll('.ap-nav-item[data-section], .ap-bnav-item[data-section]').forEach((el) => {
    el.classList.toggle('is-active', el.getAttribute('data-section') === sectionId);
  });
}

/* ─── Look slide modal ──────────────────────────────────────────────────── */
function openLookModal(slot: number, container: HTMLElement) {
  const wrap = container.querySelector('#ap-look-modal') as HTMLElement | null;
  const body = container.querySelector('#ap-look-body') as HTMLElement | null;
  const title = container.querySelector('#ap-look-title') as HTMLElement | null;
  if (!wrap || !body) return;

  if (title) title.textContent = `Configure Look ${String(slot + 1).padStart(2, '0')}`;
  body.innerHTML = renderLookForm(slot);
  wrap.classList.add('is-open');
  wrap.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Photo preview
  const photoInput = body.querySelector('#ap-photo-url') as HTMLInputElement | null;
  const preview = body.querySelector('#ap-photo-preview') as HTMLElement | null;
  photoInput?.addEventListener('input', () => {
    if (!preview) return;
    const url = photoInput.value.trim();
    preview.innerHTML = url ? `<img src="${url}" alt="Preview" />` : '<span class="ap-photo-empty">No photo</span>';
  });

  // Size chip toggles
  body.querySelectorAll<HTMLButtonElement>('.ap-size-chip').forEach((chip) => {
    chip.addEventListener('click', () => chip.classList.toggle('is-active'));
  });

  body.querySelector('#ap-look-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    closeLookModal(container);
  });
  body.querySelector('#ap-look-cancel')?.addEventListener('click', () => closeLookModal(container));
}

function closeLookModal(container: HTMLElement) {
  const wrap = container.querySelector('#ap-look-modal') as HTMLElement | null;
  wrap?.classList.remove('is-open');
  wrap?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ─── Product tab switching ─────────────────────────────────────────────── */
function bindProductTabs(container: HTMLElement) {
  const tabs = container.querySelectorAll<HTMLButtonElement>('.ap-tab[data-tab]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const target = tab.dataset.tab || '';
      container.querySelectorAll<HTMLElement>('[id^="ap-tab-"]').forEach((pane) => {
        pane.hidden = pane.id !== `ap-tab-${target}`;
      });
    });
  });
}

/* ─── Bundle discount (shared across Overview + Settings) ───────────────── */
function applyDiscountRate(val: number, container: HTMLElement) {
  const clamped = Math.max(0, Math.min(100, isNaN(val) ? 10 : val));
  setBundleDiscountPercent(clamped);

  // Sync all rate inputs
  container.querySelectorAll<HTMLInputElement>('#ap-rate-input, #ap-settings-rate-input').forEach((inp) => { inp.value = String(clamped); });
  const display = container.querySelector('#ap-promo-rate-display');
  if (display) display.textContent = `${clamped}%`;

  // Show feedback
  ['#ap-rate-feedback', '#ap-settings-rate-feedback'].forEach((sel) => {
    const fb = container.querySelector(sel) as HTMLElement | null;
    if (!fb) return;
    fb.hidden = false;
    fb.textContent = `Bundle discount updated to ${clamped}%.`;
    setTimeout(() => { fb.hidden = true; }, 4000);
  });
}

/* ─── Bind all events ───────────────────────────────────────────────────── */
export function bindAdminEvents(container: HTMLElement) {
  // Start on overview, hide the rest
  container.querySelectorAll<HTMLElement>('.ap-section').forEach((s, i) => { s.hidden = i !== 0; });

  // Sidebar + mobile bottom nav
  container.querySelectorAll('.ap-nav-item[data-section], .ap-bnav-item[data-section]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      activateSection(btn.getAttribute('data-section') || '', container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Product tab switching
  bindProductTabs(container);

  // Look slot buttons
  container.querySelectorAll<HTMLButtonElement>('[data-look-slot]').forEach((btn) => {
    btn.addEventListener('click', () => openLookModal(parseInt(btn.dataset.lookSlot || '0', 10), container));
  });

  // Look modal close
  container.querySelector('#ap-look-backdrop')?.addEventListener('click', () => closeLookModal(container));
  container.querySelector('#ap-look-close')?.addEventListener('click', () => closeLookModal(container));

  // Discount controls — Overview section
  container.querySelector('#ap-save-rate')?.addEventListener('click', () => {
    const inp = container.querySelector('#ap-rate-input') as HTMLInputElement | null;
    applyDiscountRate(parseFloat(inp?.value || '10'), container);
  });
  container.querySelectorAll<HTMLButtonElement>('.ap-preset-pill').forEach((btn) => {
    btn.addEventListener('click', () => applyDiscountRate(parseFloat(btn.dataset.rate || '10'), container));
  });

  // Discount controls — Settings section
  container.querySelector('#ap-settings-save-rate')?.addEventListener('click', () => {
    const inp = container.querySelector('#ap-settings-rate-input') as HTMLInputElement | null;
    applyDiscountRate(parseFloat(inp?.value || '10'), container);
  });

  // Reset seed orders
  container.querySelector('#ap-seed-btn')?.addEventListener('click', () => {
    resetOrdersToSeed();
    const pc = document.getElementById('page-content');
    if (pc) { pc.innerHTML = renderAdminPage(); bindAdminEvents(pc); }
  });

  // Order status dropdowns
  bindDropdowns(container, (dropdown, value) => {
    const orderId = dropdown.getAttribute('data-status-for');
    if (!orderId) return;
    updateOrderStatus(orderId, value as OrderStatus);
    dropdown.className = `dropdown-react-host ap-status-select ap-status--${value.toLowerCase().replace(/\s+/g, '-')}`;
  });

  // Style inspect modal
  const styleModal = container.querySelector('#admin-style-modal') as HTMLDialogElement | null;
  const styleBody = container.querySelector('#admin-style-body');
  container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-style-inspect]') as HTMLElement | null;
    if (!target || !styleBody) return;
    const key = target.getAttribute('data-style-inspect') || '';
    const size = target.getAttribute('data-item-size') || '';
    let product = PRODUCTS[key];
    if (!product) {
      for (const p of Object.values(PRODUCTS)) {
        if (p.name.toLowerCase() === key.toLowerCase()) { product = p; break; }
      }
    }
    if (!product) return;
    styleBody.innerHTML = `
      <div class="checkout-modal-head">
        <h2>Garment Details</h2>
        <button id="close-style-modal" class="checkout-close-btn">&times;</button>
      </div>
      <div class="admin-style-detail-content">
        <div class="admin-style-detail-hero">
          <div class="admin-style-detail-img"><img src="${product.image}" alt="${product.name}" /></div>
          <div class="admin-style-detail-info">
            <span class="orbit-vendor">${product.vendor}</span>
            <h3 class="admin-style-name">${product.name}</h3>
            <div class="admin-style-ordered-badge">Ordered Size: <strong>${size || 'M'}</strong></div>
            <div class="admin-style-price-tag">${formatGhs(toGhs(product.price))}</div>
            <div class="admin-style-specs-grid">
              <div><span>SKU</span><strong>NK-RNW-${product.id.slice(0, 6).toUpperCase()}</strong></div>
              <div><span>Category</span><strong>${product.type || 'Apparel'}</strong></div>
              <div><span>Sizes</span><strong>${product.sizes.join(', ')}</strong></div>
            </div>
            <div class="admin-style-actions">
              <button id="close-style-btn" class="brand-btn brand-btn--sm">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    styleModal?.showModal();
    styleBody.querySelector('#close-style-modal')?.addEventListener('click', () => styleModal?.close());
    styleBody.querySelector('#close-style-btn')?.addEventListener('click', () => styleModal?.close());
  });
  styleModal?.addEventListener('click', (e) => { if (e.target === styleModal) styleModal.close(); });

  // Order receipt modal
  const modal = container.querySelector('#admin-detail-modal') as HTMLDialogElement | null;
  const modalBody = container.querySelector('#admin-detail-body');
  container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-admin-inspect]') as HTMLElement | null;
    if (!target || !modalBody) return;
    const id = target.getAttribute('data-admin-inspect');
    if (!id) return;
    const order = getOrders().find((o) => o.id === id);
    if (!order) return;
    const itemsHtml = order.items.map((i) => `
      <div class="admin-modal-item">
        <img src="${i.image}" alt="${i.name}" />
        <div class="admin-modal-item-info"><h4>${i.name}</h4><div>Size: <strong>${i.size}</strong> · Qty: ${i.quantity}</div></div>
        <div class="admin-modal-item-price">${formatGhs(toGhs(i.price * i.quantity))}</div>
      </div>`).join('');
    modalBody.innerHTML = `
      <div class="checkout-modal-head">
        <h2>Order #${order.id}</h2>
        <button id="close-admin-modal" class="checkout-close-btn">&times;</button>
      </div>
      <div class="admin-modal-content">
        <div class="admin-modal-meta">
          <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          <div><strong>Customer:</strong> ${order.customer.fullName} (${order.customer.phone || order.customer.email || '—'})</div>
          <div><strong>Fulfilment:</strong> ${order.customer.fulfillment === 'pickup' ? 'Store pickup' : 'Delivery'}</div>
          <div><strong>Payment:</strong> ${order.paymentMethod}</div>
          <div><strong>Status:</strong> ${order.status}</div>
          <div><strong>Tracking:</strong> <a href="#track?id=${order.id}" style="text-decoration:underline;font-weight:600">Open Tracker</a></div>
        </div>
        <div class="admin-modal-items-head">Items</div>
        <div class="admin-modal-items-list">${itemsHtml}</div>
        <div class="admin-modal-totals">
          <div>Subtotal: ${formatGhs(toGhs(order.subtotal))}</div>
          <div>Shipping: Free</div>
          <div class="admin-modal-total-strong">Total: ${formatGhs(toGhs(order.total))}</div>
        </div>
        <div class="admin-modal-actions">
          <button class="brand-btn brand-btn--dark" id="print-order-btn">Save Receipt</button>
        </div>
      </div>`;
    modal?.showModal();
    modalBody.querySelector('#close-admin-modal')?.addEventListener('click', () => modal?.close());
    modalBody.querySelector('#print-order-btn')?.addEventListener('click', () => {
      window.open(getCreatorsKitReceiptUrl(order), '_blank', 'noopener,noreferrer');
    });
  });
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
}
