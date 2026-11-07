 import {
  getOrders,
  getOrderStats,
  updateOrderStatus,
  resetOrdersToSeed,
  OrderStatus,
} from '../orders-store';
import { mountAdminDock } from '../admin-dock';
import { PRODUCTS, LOOKS, ProductItem } from '../data';
import { formatGhs, toGhs } from '../currency';
import { bindDropdowns, renderDropdown } from '../dropdown.tsx';
import { getCreatorsKitReceiptUrl } from '../creators-kit';
import { getBundleDiscountPercent, setBundleDiscountPercent } from '../bundle-store';
import {
  getManagedProducts,
  getManagedRunwayLooks,
  configureLookWithGarments,
  getFinancialOverview,
  updateManagedProduct,
  ManagedRunwayLook,
  ManagedProduct,
} from '../products-store';

/* ─── Brutalist SVG Vector Icons (No Emojis) ───────────────────────────── */
const ic = {
  overview: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  products: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  orders: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4"/><path d="M9 12h6M9 16h4"/></svg>`,
  settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  storefront: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  receipt: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  arrow: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  external: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  link: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  user: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  logout: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  chevron: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><polyline points="6 9 12 15 18 9"/></svg>`,
};

/* ─── SECTION 1: OVERVIEW (MIS + TPS Management Dashboard) ──────────────── */
function renderOverviewSection(): string {
  const stats = getOrderStats();
  const orders = getOrders();
  const fin = getFinancialOverview(toGhs(stats.totalRevenue));
  const bundleOrders = orders.filter((o) => o.bundleDiscount && o.bundleDiscount > 0);
  const products = getManagedProducts();
  const looks = getManagedRunwayLooks();

  // Runway look performance — units & revenue per exactly-linked 3-piece set
  const lookSalesMap = new Map<number, { units: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const pid = item.productId;
      if (!pid) continue;
      const owner = looks.find(
        (l) => l.topProductId === pid || l.bottomProductId === pid || l.shoesProductId === pid
      );
      if (!owner) continue;
      const entry = lookSalesMap.get(owner.id) || { units: 0, revenue: 0 };
      entry.units += item.quantity;
      entry.revenue += item.price * item.quantity;
      lookSalesMap.set(owner.id, entry);
    }
  }
  const topLooks = Array.from(lookSalesMap.entries())
    .map(([id, s]) => ({ look: looks.find((l) => l.id === id), ...s }))
    .filter((e) => e.look)
    .sort((a, b) => b.units - a.units)
    .slice(0, 3);
  const maxUnits = Math.max(1, ...topLooks.map((t) => t.units));

  return `
    <section class="ap-section" id="ap-overview">
      <div class="ap-page-head">
        <div>
          <div class="ap-kicker">MANAGEMENT INFORMATION SYSTEM</div>
          <h1 class="ap-page-title">Store Overview & Performance</h1>
        </div>
        <div class="ap-header-tag"><span class="ap-live-dot" aria-hidden="true"></span>LIVE ATELIER FEED</div>
      </div>

      <!-- Quick Actions -->
      <div class="ap-quick-strip">
        <button type="button" class="ap-quick-jump" data-section="ap-products">${ic.plus} ADD RUNWAY LOOK</button>
        <button type="button" class="ap-quick-jump" data-section="ap-products">${ic.products} EDIT 3-PIECE SETS</button>
        <button type="button" class="ap-quick-jump" data-section="ap-orders">${ic.receipt} REVIEW ORDERS</button>
        <button type="button" class="ap-quick-jump" data-section="ap-settings">${ic.settings} BUNDLE DISCOUNT</button>
      </div>

      <!-- Financial & TPS KPI Cards -->
      <div class="ap-kpi-grid">
        <div class="ap-card ap-kpi-card">
          <div class="ap-kpi-label">Total Gross Revenue</div>
          <div class="ap-kpi-val">${formatGhs(fin.revenueGhs)}</div>
          <div class="ap-kpi-sub">${stats.totalOrders} total orders processed</div>
        </div>
        <div class="ap-card ap-kpi-card ap-kpi-card--profit">
          <div class="ap-kpi-label">Estimated Net Profit</div>
          <div class="ap-kpi-val">${formatGhs(fin.netProfitGhs)}</div>
          <div class="ap-kpi-sub">Avg Margin: <strong>${fin.marginPercent}%</strong> · COGS: ${formatGhs(fin.cogsGhs)}</div>
        </div>
        <div class="ap-card ap-kpi-card">
          <div class="ap-kpi-label">Average Order Value</div>
          <div class="ap-kpi-val">${formatGhs(toGhs(stats.aov))}</div>
          <div class="ap-kpi-sub">Across full outfits & streetwear</div>
        </div>
        <div class="ap-card ap-kpi-card">
          <div class="ap-kpi-label">Runway Bundles Sold</div>
          <div class="ap-kpi-val">${bundleOrders.length}</div>
          <div class="ap-kpi-sub">${looks.length} outfits linked on 3D runway</div>
        </div>
      </div>

      <!-- Pipeline & Promotions Grid -->
      <div class="ap-two-col-grid">
        <!-- Pipeline Card -->
        <div class="ap-card ap-panel">
          <div class="ap-panel-head">
            <span class="ap-kicker">FULFILLMENT PIPELINE</span>
            <h3>Order Status Breakdown</h3>
          </div>
          <div class="ap-pipeline-bars">
            <div class="ap-pipe-item">
              <div class="ap-pipe-info">
                <span>Atelier Processing</span>
                <strong>${stats.processingCount}</strong>
              </div>
              <div class="ap-pipe-track">
                <div class="ap-pipe-fill" style="width: ${Math.round((stats.processingCount / Math.max(stats.totalOrders, 1)) * 100)}%"></div>
              </div>
            </div>
            <div class="ap-pipe-item">
              <div class="ap-pipe-info">
                <span>In Transit (Courier)</span>
                <strong>${stats.shippedCount}</strong>
              </div>
              <div class="ap-pipe-track">
                <div class="ap-pipe-fill" style="width: ${Math.round((stats.shippedCount / Math.max(stats.totalOrders, 1)) * 100)}%"></div>
              </div>
            </div>
            <div class="ap-pipe-item">
              <div class="ap-pipe-info">
                <span>Delivered / Collected</span>
                <strong>${stats.deliveredCount}</strong>
              </div>
              <div class="ap-pipe-track">
                <div class="ap-pipe-fill" style="width: ${Math.round((stats.deliveredCount / Math.max(stats.totalOrders, 1)) * 100)}%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3-Piece Look Bundle Discount Card -->
        <div class="ap-card ap-panel">
          <div class="ap-panel-head">
            <span class="ap-kicker">GLOBAL PROMOTIONS ENGINE</span>
            <h3>3-Piece Runway Bundle Discount</h3>
          </div>
          <p class="ap-panel-desc">
            Applied automatically at checkout when a customer adds all 3 linked garments (Top + Bottom + Shoes) of any runway look.
          </p>
          <div class="ap-promo-display-row">
            <div class="ap-promo-huge-rate" id="ap-overview-rate-badge">${getBundleDiscountPercent()}% OFF</div>
            <div class="ap-promo-input-group">
              <label for="ap-overview-rate-input">SET RATE (%):</label>
              <div class="ap-input-with-btn">
                <input type="number" id="ap-overview-rate-input" min="0" max="100" value="${getBundleDiscountPercent()}" class="ap-input ap-input--rate" />
                <button id="ap-overview-save-rate-btn" class="brand-btn brand-btn--dark brand-btn--sm">SAVE</button>
              </div>
            </div>
          </div>
          <div class="ap-preset-pills">
            <span class="ap-preset-label">PRESETS:</span>
            <button class="ap-preset-chip" data-rate="0">0% (OFF)</button>
            <button class="ap-preset-chip" data-rate="10">10% (DEFAULT)</button>
            <button class="ap-preset-chip" data-rate="15">15% (VIP)</button>
            <button class="ap-preset-chip" data-rate="20">20% (FLASH)</button>
          </div>
          <div id="ap-overview-rate-feedback" class="ap-feedback-banner" hidden></div>
        </div>
      </div>

      <!-- Runway Performance: Top 3-piece sets by pieces sold -->
      <div class="ap-card ap-panel" style="margin-top: 18px;">
        <div class="ap-panel-head">
          <span class="ap-kicker">RUNWAY PERFORMANCE — LINKED 3-PIECE SETS</span>
          <h3>Top Looks by Pieces Sold</h3>
        </div>
        ${topLooks.length === 0
      ? `<div class="ap-empty-state">No runway pieces sold yet — 3-piece set sales will rank looks here.</div>`
      : `<div class="ap-toplooks">${topLooks
        .map(
          (t, i) => `
                <div class="ap-toplook-row">
                  <span class="ap-toplook-rank">#${i + 1}</span>
                  <img class="ap-toplook-thumb" src="${t.look!.modelImage}" alt="${t.look!.name}" loading="lazy" />
                  <div class="ap-toplook-info">
                    <div class="ap-toplook-name">${t.look!.name} · LOOK ${t.look!.lookNum}</div>
                    <div class="ap-pipe-track"><div class="ap-pipe-fill" style="width: ${Math.round((t.units / maxUnits) * 100)}%"></div></div>
                  </div>
                  <div class="ap-toplook-nums">
                    <div><strong>${t.units}</strong> <span>pieces</span></div>
                    <em>${formatGhs(toGhs(t.revenue))}</em>
                  </div>
                </div>`
        )
        .join('')}</div>`
    }
      </div>

      <!-- Recent Transactions -->
      <div class="ap-card ap-panel" style="margin-top: 18px;">
        <div class="ap-panel-head">
          <span class="ap-kicker">TPS TRANSACTION LEDGER</span>
          <h3>Recent Customer Checkouts</h3>
        </div>
        <div class="ap-mini-table-wrap">
          ${renderMiniOrdersTable(orders.slice(0, 5))}
        </div>
      </div>
    </section>
  `;
}

function renderMiniOrdersTable(orders: ReturnType<typeof getOrders>): string {
  if (orders.length === 0) {
    return `<div class="ap-empty-state">No customer orders recorded yet.</div>`;
  }
  return `
    <table class="ap-table ap-table--mini">
      <thead>
        <tr>
          <th>ORDER ID</th>
          <th>CUSTOMER</th>
          <th>ITEMS</th>
          <th>TOTAL (GH₵)</th>
          <th>STATUS</th>
          <th>ACTION</th>
        </tr>
      </thead>
      <tbody>
        ${orders
      .map((o) => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.customer.fullName}</td>
            <td>${o.items.length} pieces (${o.bundleDiscount ? 'Bundle' : 'Individual'})</td>
            <td><strong>${formatGhs(toGhs(o.total))}</strong></td>
            <td><span class="ap-status-tag ap-status--${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span></td>
            <td><button class="brand-btn brand-btn--sm" data-admin-inspect="${o.id}">INSPECT</button></td>
          </tr>
        `)
      .join('')}
      </tbody>
    </table>
  `;
}

/* ─── SECTION 2: PRODUCTS & 3-PIECE RUNWAY LINKER ───────────────────────── */

/**
 * Renders one of the exactly-3 runway garment slots (TOP / BOTTOM / SHOES).
 * The product shown here is the exact item linked to the runway look —
 * same image, same name, same price customers see on the 3D runway panel.
 */
function renderLinkedItemRow(
  slotNum: number,
  slotLabel: string,
  prod: ManagedProduct | undefined
): string {
  if (!prod) {
    return `
      <div class="ap-linked-item-row ap-linked-item-row--missing">
        <span class="ap-item-num">${slotNum}</span>
        <div class="ap-item-thumb ap-item-thumb--empty">${ic.plus}</div>
        <div class="ap-item-details">
          <span class="ap-item-slot-tag">${slotLabel}</span>
          <div class="ap-item-name">Not Linked</div>
          <div class="ap-item-type">Open configurator to attach a garment</div>
        </div>
        <div class="ap-item-price">—</div>
      </div>
    `;
  }

  const linkable = Boolean(PRODUCTS[prod.id]);
  const inner = `
    <span class="ap-item-num">${slotNum}</span>
    <div class="ap-item-thumb"><img src="${prod.image}" alt="${prod.name}" loading="lazy" /></div>
    <div class="ap-item-details">
      <span class="ap-item-slot-tag">${slotLabel}</span>
      <div class="ap-item-name">${prod.name}</div>
      <div class="ap-item-type">${prod.vendor || prod.category}${linkable ? ' · VIEW PIECE ↗' : ''}</div>
    </div>
    <div class="ap-item-price">${formatGhs(prod.sellingPriceGhs)}</div>
  `;

  return linkable
    ? `<a class="ap-linked-item-row" href="#product?id=${prod.id}" title="Inspect ${prod.name}">${inner}</a>`
    : `<div class="ap-linked-item-row">${inner}</div>`;
}

function renderProductsSection(): string {
  const products = getManagedProducts();
  const looks = getManagedRunwayLooks();
  const bundleDiscount = getBundleDiscountPercent();

  // Map each look with its 3 linked items
  const lookCardsHtml = Array.from({ length: 12 }, (_, i) => {
    const lookId = i + 1;
    const lookNum = String(lookId).padStart(2, '0');
    const look = looks.find((l) => l.id === lookId);

    if (look) {
      // Find the 3 linked garments from products
      const topProd = products.find((p) => p.id === look.topProductId);
      const btmProd = products.find((p) => p.id === look.bottomProductId);
      const shoeProd = products.find((p) => p.id === look.shoesProductId);

      const topPrice = topProd ? topProd.sellingPriceGhs : 0;
      const btmPrice = btmProd ? btmProd.sellingPriceGhs : 0;
      const shoePrice = shoeProd ? shoeProd.sellingPriceGhs : 0;
      const regularSum = topPrice + btmPrice + shoePrice;
      const savings = Math.round(regularSum * (bundleDiscount / 100));
      const bundlePrice = Math.max(0, regularSum - savings);

      return `
        <div class="ap-card ap-outfit-card" data-look-card-id="${lookId}">
          <div class="ap-outfit-head">
            <span class="ap-kicker">LOOK ${lookNum}</span>
            <span class="ap-badge ap-badge--active">ON RUNWAY</span>
          </div>

          <div class="ap-outfit-media">
            <img src="${look.modelImage || '/assets/fit-1-model.webp'}" alt="${look.name}" class="ap-outfit-model-img" />
            <div class="ap-outfit-badge-overlay">${look.name}</div>
          </div>

          <div class="ap-outfit-body">
            <div class="ap-outfit-title">${look.name}</div>
            <div class="ap-outfit-desc">${look.description || 'Curated 3-piece designer outfit on the 3D stage.'}</div>

            <!-- The 3 Linked Outfit Items (exact runway pieces) -->
            <div class="ap-linked-items-box">
              <div class="ap-linked-box-head">
                <span>${ic.link} EXACTLY 3 PIECES LINKED TO RUNWAY</span>
                <span class="ap-linked-count">${[topProd, btmProd, shoeProd].filter(Boolean).length}/3</span>
              </div>
              ${renderLinkedItemRow(1, 'TOP', topProd)}
              ${renderLinkedItemRow(2, 'BOTTOM', btmProd)}
              ${renderLinkedItemRow(3, 'SHOES', shoeProd)}
            </div>

            <!-- Compact bundle price footer: sum → −% → bundle -->
            <div class="ap-outfit-price-foot">
              <div class="ap-foot-sum">
                <span class="ap-math-label">3 PIECES</span>
                <div class="ap-foot-sum-nums">
                  <s>${formatGhs(regularSum)}</s>
                  <span class="ap-bundle-discount-pill">−${bundleDiscount}% · SAVE ${formatGhs(savings)}</span>
                </div>
              </div>
              <div class="ap-foot-final">
                <span class="ap-math-label">BUNDLE</span>
                <strong class="ap-math-final-val">${formatGhs(bundlePrice)}</strong>
              </div>
            </div>

            <button class="brand-btn brand-btn--dark brand-btn--sm ap-edit-outfit-btn" data-configure-slot="${lookId}">
              ${ic.edit} CONFIGURE OUTFIT & 3 ITEMS
            </button>
          </div>
        </div>
      `;
    }

    // Empty slot
    return `
      <div class="ap-card ap-outfit-card ap-outfit-card--empty">
        <div class="ap-outfit-head">
          <span class="ap-kicker">LOOK ${lookNum}</span>
          <span class="ap-badge ap-badge--empty">EMPTY SLOT</span>
        </div>
        <div class="ap-empty-slot-content">
          <div class="ap-empty-slot-icon">${ic.plus}</div>
          <div class="ap-empty-slot-title">Unconfigured Outfit</div>
          <p class="ap-empty-slot-desc">Upload a runway model photo and link 3 matching garments (Top + Bottom + Footwear).</p>
          <button class="brand-btn brand-btn--sm ap-edit-outfit-btn" data-configure-slot="${lookId}">
            ${ic.plus} CONFIGURE LOOK ${lookNum}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // All individual garments table
  const allGarmentsRowsHtml = products
    .map((p) => {
      const margin = p.sellingPriceGhs > 0 ? Math.round(((p.sellingPriceGhs - p.costPriceGhs) / p.sellingPriceGhs) * 100) : 0;
      return `
      <tr>
        <td>
          <div class="ap-table-prod-cell">
            <img src="${p.image}" alt="${p.name}" class="ap-table-prod-img" />
            <div>
              <strong>${p.name}</strong>
              <div class="ap-table-vendor">${p.vendor || 'Runway Atelier'} · SKU: NK-${p.id.toUpperCase()}</div>
            </div>
          </div>
        </td>
        <td><span class="ap-category-tag">${p.category}</span></td>
        <td>${formatGhs(p.costPriceGhs)}</td>
        <td><strong>${formatGhs(p.sellingPriceGhs)}</strong></td>
        <td><span class="ap-margin-tag">${margin}% Margin</span></td>
        <td>${p.sizes.join(', ')}</td>
        <td>
          <button class="brand-btn brand-btn--sm" data-edit-prod="${p.id}">${ic.edit} EDIT PRODUCT</button>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <section class="ap-section" id="ap-products">
      <div class="ap-page-head">
        <div>
          <div class="ap-kicker">PRODUCT MANAGEMENT & RUNWAY SETS</div>
          <h1 class="ap-page-title">Runway Outfits & Garment Inventory</h1>
        </div>
        <button class="brand-btn brand-btn--dark brand-btn--sm" id="ap-quick-add-look-btn">
          ${ic.plus} ADD NEW RUNWAY LOOK
        </button>
      </div>

      <!-- Subtabs: 3D Runway Looks vs All Garments -->
      <div class="ap-subtabs">
        <button class="ap-subtab is-active" data-subtab="runway-looks">
          3D RUNWAY OUTFITS (12 LOOKS)
        </button>
        <button class="ap-subtab" data-subtab="all-garments">
          ALL GARMENTS INVENTORY (${products.length})
        </button>
      </div>

      <!-- Tab 1: Runway 3-Piece Outfits -->
      <div id="ap-pane-runway-looks" class="ap-subtab-pane">
        <div class="ap-info-callout">
          <strong>3-PIECE RUNWAY OUTFIT ARCHITECTURE:</strong> Each runway look displays a model photo on the 3D stage and links exactly 3 garments (Top, Bottom, and Footwear). When customers add all 3 pieces, the active <strong>${bundleDiscount}% bundle discount</strong> is automatically calculated at checkout.
        </div>
        <div class="ap-outfits-grid">
          ${lookCardsHtml}
        </div>
      </div>

      <!-- Tab 2: All Garments Table -->
      <div id="ap-pane-all-garments" class="ap-subtab-pane" hidden>
        <div class="ap-card ap-panel">
          <div class="ap-panel-head">
            <span class="ap-kicker">INVENTORY MASTER LEDGER</span>
            <h3>Cost Prices, Selling Prices & Atelier Margins</h3>
          </div>
          <div class="ap-table-wrap">
            <table class="ap-table">
              <thead>
                <tr>
                  <th>GARMENT / STYLE</th>
                  <th>CATEGORY</th>
                  <th>COST PRICE (COGS)</th>
                  <th>SELLING PRICE</th>
                  <th>UNIT MARGIN</th>
                  <th>AVAILABLE SIZES</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                ${allGarmentsRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Brutalist Slide-Up Modal: Configure Look & 3 Items -->
      <div id="ap-look-config-modal" class="ap-slide-modal-wrap" aria-hidden="true">
        <div class="ap-slide-backdrop" id="ap-look-backdrop"></div>
        <div class="ap-slide-card" role="dialog" aria-modal="true">
          <div class="ap-slide-head">
            <div>
              <span class="ap-kicker" id="ap-modal-slot-kicker">RUNWAY CONFIGURATOR</span>
              <h2 id="ap-modal-title">Configure Outfit & 3 Items</h2>
            </div>
            <button class="ap-close-btn" id="ap-modal-close-btn" aria-label="Close">${ic.close}</button>
          </div>

          <div class="ap-slide-scroll" id="ap-modal-body">
            <!-- Dynamic form injected by openLookModal() -->
          </div>
        </div>
      </div>
    </section>
  `;
}

/* ─── SECTION 3: ORDERS & FULFILLMENT ───────────────────────────────────── */
function renderOrdersSection(): string {
  const orders = getOrders();

  const rowsHtml = orders
    .map((order) => {
      const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const chipsHtml = order.items
        .map(
          (item) => `
          <button class="ap-garment-chip" data-style-inspect="${item.productId || item.name}" data-item-size="${item.size}">
            <img src="${item.image}" alt="${item.name}" />
            <span>${item.name} · Size <strong>${item.size}</strong></span>
          </button>
        `
        )
        .join('');

      return `
        <tr class="ap-table-row" data-order-id="${order.id}">
          <td>
            <strong>#${order.id}</strong>
            <div class="ap-cell-sub">${dateFormatted}</div>
          </td>
          <td>
            <div><strong>${order.customer.fullName}</strong></div>
            <div class="ap-cell-sub">${order.customer.phone || order.customer.email || 'No phone'}</div>
            <div class="ap-cell-tag">${order.customer.fulfillment === 'pickup' ? 'PICKUP @ OSU HUB' : 'EXPRESS DELIVERY'}</div>
          </td>
          <td>
            <div class="ap-chips-group">${chipsHtml}</div>
          </td>
          <td>
            <div class="ap-price-bold">${formatGhs(toGhs(order.total))}</div>
            ${order.bundleDiscount ? `<span class="ap-bundle-tag">3-PIECE BUNDLE (−${formatGhs(toGhs(order.bundleDiscount))})</span>` : ''}
            <div class="ap-cell-sub">${order.paymentMethod}</div>
          </td>
          <td>
            ${renderDropdown(
        order.customer.fulfillment === 'pickup'
          ? [
            { value: 'Processing', label: 'Processing (Atelier)', icon: 'processing' },
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
        `dropdown-react-host ap-status-select ap-status--${order.status.toLowerCase().replace(/\s+/g, '-')}`
      )}
          </td>
          <td>
            <div class="ap-action-btns">
              <button class="brand-btn brand-btn--sm" data-admin-inspect="${order.id}">${ic.receipt} RECEIPT</button>
              <a href="#track?id=${order.id}" class="brand-btn brand-btn--dark brand-btn--sm">${ic.arrow} TRACK</a>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <section class="ap-section" id="ap-orders">
      <div class="ap-page-head">
        <div>
          <div class="ap-kicker">FULFILLMENT DISPATCH</div>
          <h1 class="ap-page-title">Customer Order Management</h1>
        </div>
        <div class="ap-header-tag">● ${orders.length} TOTAL ORDERS</div>
      </div>

      <div class="ap-card ap-panel">
        <div class="ap-table-wrap">
          <table class="ap-table">
            <thead>
              <tr>
                <th>ORDER & DATE</th>
                <th>CLIENT & DESTINATION</th>
                <th>BOUGHT GARMENTS (INSPECT)</th>
                <th>PAYMENT & BUNDLE</th>
                <th>FULFILLMENT STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

/* ─── SECTION 4: STORE SETTINGS ─────────────────────────────────────────── */
function renderSettingsSection(): string {
  return `
    <section class="ap-section" id="ap-settings">
      <div class="ap-page-head">
        <div>
          <div class="ap-kicker">ATELIER CONFIGURATION</div>
          <h1 class="ap-page-title">Storefront Settings</h1>
        </div>
      </div>

      <div class="ap-two-col-grid">
        <div class="ap-card ap-panel">
          <div class="ap-panel-head">
            <span class="ap-kicker">BRAND IDENTITY & HUB</span>
            <h3>Fashion Brand Profile</h3>
          </div>
          <div class="ap-field-row">
            <label class="ap-label">STORE / BRAND NAME</label>
            <input type="text" class="ap-input" placeholder="e.g. Around Clothing" value="Around Clothing" />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">OFFICIAL INSTAGRAM HANDLE</label>
            <input type="text" class="ap-input" placeholder="@around_clothingg" value="@around_clothingg" />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">ACCRA PICKUP HUB LOCATION</label>
            <input type="text" class="ap-input" placeholder="e.g. Oxford Street, Osu, Accra" value="Oxford Street, Osu Atelier Hub" />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">MTN MOMO MERCHANT / VENDOR NUMBER</label>
            <input type="text" class="ap-input" placeholder="e.g. 024 456 7890" value="024 555 0192" />
          </div>
          <button class="brand-btn brand-btn--dark" style="margin-top: 12px;">SAVE BRAND PROFILE</button>
        </div>

        <div>
          <div class="ap-card ap-panel">
            <div class="ap-panel-head">
              <span class="ap-kicker">GLOBAL DISCOUNT CONTROLS</span>
              <h3>Runway Bundle Discount Rate</h3>
            </div>
            <p class="ap-panel-desc">
              When modified here, this percentage updates across all 12 runway outfit calculations, the 3D runway presentation, and the checkout cart.
            </p>
            <div class="ap-field-row">
              <label class="ap-label">GLOBAL BUNDLE DISCOUNT (%)</label>
              <div class="ap-input-with-btn">
                <input type="number" id="ap-settings-bundle-rate" min="0" max="100" value="${getBundleDiscountPercent()}" class="ap-input ap-input--rate" />
                <button id="ap-settings-save-rate-btn" class="brand-btn brand-btn--dark brand-btn--sm">APPLY RATE</button>
              </div>
            </div>
            <div id="ap-settings-rate-feedback" class="ap-feedback-banner" hidden></div>
          </div>

          <div class="ap-card ap-panel" style="margin-top: 16px;">
            <div class="ap-panel-head">
              <span class="ap-kicker">STUDIO ACTIONS</span>
              <h3>Demo & Storefront Navigation</h3>
            </div>
            <div class="ap-settings-actions-list">
              <div class="ap-action-row">
                <div>
                  <strong>Reset Demo Customer Orders</strong>
                  <div class="ap-cell-sub">Resets order stream to clean seed data for client demonstration.</div>
                </div>
                <button id="ap-reset-seed-btn" class="brand-btn brand-btn--sm">RESET ORDERS</button>
              </div>
              <div class="ap-action-row">
                <div>
                  <strong>Return to 3D Runway Storefront</strong>
                  <div class="ap-cell-sub">Exits admin view and opens public digital showroom.</div>
                </div>
                <a href="#home" class="brand-btn brand-btn--dark brand-btn--sm">${ic.storefront} STOREFRONT</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/* ─── FORM BUILDER: CONFIGURE LOOK & LINK 3 GARMENTS ────────────────────── */
function renderLookConfigForm(slotId: number): string {
  const looks = getManagedRunwayLooks();
  const products = getManagedProducts();
  const look = looks.find((l) => l.id === slotId);
  const lookNum = String(slotId).padStart(2, '0');
  const bundleDiscount = getBundleDiscountPercent();

  // Find linked products
  const topProd = products.find((p) => p.id === look?.topProductId);
  const btmProd = products.find((p) => p.id === look?.bottomProductId);
  const shoeProd = products.find((p) => p.id === look?.shoesProductId);

  // Group products for quick selection
  const topOptions = products
    .filter((p) => p.category.toLowerCase().includes('top') || p.category.toLowerCase().includes('shirt') || p.category.toLowerCase().includes('outer') || p.id.includes('shirt'))
    .map((p) => `<option value="${p.id}" ${topProd?.id === p.id ? 'selected' : ''}>${p.name} (GH₵ ${p.sellingPriceGhs})</option>`)
    .join('');

  const btmOptions = products
    .filter((p) => p.category.toLowerCase().includes('bottom') || p.category.toLowerCase().includes('pants') || p.category.toLowerCase().includes('denim') || p.category.toLowerCase().includes('chino') || p.id.includes('pants'))
    .map((p) => `<option value="${p.id}" ${btmProd?.id === p.id ? 'selected' : ''}>${p.name} (GH₵ ${p.sellingPriceGhs})</option>`)
    .join('');

  const shoeOptions = products
    .filter((p) => p.category.toLowerCase().includes('shoe') || p.category.toLowerCase().includes('footwear') || p.id.includes('shoes'))
    .map((p) => `<option value="${p.id}" ${shoeProd?.id === p.id ? 'selected' : ''}>${p.name} (GH₵ ${p.sellingPriceGhs})</option>`)
    .join('');

  const topSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const btmSizes = ['28', '30', '32', '34', '36', 'S', 'M', 'L'];
  const shoeSizes = ['39', '40', '41', '42', '43', '44', '45', '46'];

  const sizeChips = (sizes: string[], group: string, activeList: string[] = ['M', 'L']) =>
    sizes
      .map(
        (s) => `
      <button type="button" class="ap-chip-btn ${activeList.includes(s) ? 'is-active' : ''}" data-chip-group="${group}" data-val="${s}">
        ${s}
      </button>`
      )
      .join('');

  return `
    <form id="ap-outfit-form" data-slot-id="${slotId}" class="ap-form">
      <!-- Look Overview Header -->
      <div class="ap-form-section">
        <div class="ap-form-section-title">1. RUNWAY STAGE LOOK IDENTITY</div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">LOOK TITLE / NARRATIVE NAME</label>
            <input type="text" name="name" class="ap-input" value="${look?.name || `Runway Outfit ${lookNum}`}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">LOOK NUMBER</label>
            <input type="text" value="Look ${lookNum}" class="ap-input" readonly />
          </div>
        </div>

        <div class="ap-field-row">
          <label class="ap-label">EDITORIAL DESCRIPTION</label>
          <input type="text" name="description" class="ap-input" value="${look?.description || 'Crafted heavyweight streetwear outfit from Accra digital runway.'}" />
        </div>

        <div class="ap-field-row">
          <label class="ap-label">MODEL RUNWAY PHOTO URL (WEBP / JPG / PNG)</label>
          <input type="url" name="modelImage" id="ap-form-model-url" class="ap-input" value="${look?.modelImage || `/assets/fit-${Math.min(6, slotId)}-model.webp`}" required />
          <div class="ap-model-preview-box">
            <img id="ap-live-model-preview" src="${look?.modelImage || `/assets/fit-${Math.min(6, slotId)}-model.webp`}" alt="Runway Model Preview" />
            <div class="ap-model-preview-hint">3D Stage Model Photo Preview</div>
          </div>
        </div>
      </div>

      <!-- Garment 1: TOP -->
      <div class="ap-form-section ap-garment-config-box">
        <div class="ap-form-section-title">2. LINK ITEM 1 — TOP GARMENT</div>
        <div class="ap-field-row">
          <label class="ap-label">SELECT EXISTING TOP OR CUSTOMIZE</label>
          <select id="ap-select-top" class="ap-select">
            <option value="custom">-- Custom Top Garment --</option>
            ${topOptions}
          </select>
        </div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">TOP NAME</label>
            <input type="text" name="top_name" id="ap-top-name" class="ap-input" value="${topProd?.name || 'Charcoal Heavyweight Crew'}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">CATEGORY</label>
            <input type="text" name="top_cat" id="ap-top-cat" class="ap-input" value="${topProd?.category || 'Tops'}" required />
          </div>
        </div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">COST PRICE / COGS (GH₵)</label>
            <input type="number" name="top_cost" id="ap-top-cost" class="ap-input ap-calc-input" min="0" step="1" value="${topProd?.costPriceGhs || 210}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">SELLING PRICE (GH₵)</label>
            <input type="number" name="top_sell" id="ap-top-sell" class="ap-input ap-calc-input" min="0" step="1" value="${topProd?.sellingPriceGhs || 490}" required />
          </div>
        </div>
        <div class="ap-field-row">
          <label class="ap-label">AVAILABLE SIZES</label>
          <div class="ap-chips-row">${sizeChips(topSizes, 'top', topProd?.sizes || ['S', 'M', 'L', 'XL'])}</div>
        </div>
      </div>

      <!-- Garment 2: BOTTOM -->
      <div class="ap-form-section ap-garment-config-box">
        <div class="ap-form-section-title">3. LINK ITEM 2 — BOTTOM GARMENT</div>
        <div class="ap-field-row">
          <label class="ap-label">SELECT EXISTING BOTTOM OR CUSTOMIZE</label>
          <select id="ap-select-bottom" class="ap-select">
            <option value="custom">-- Custom Bottom Garment --</option>
            ${btmOptions}
          </select>
        </div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">BOTTOM NAME</label>
            <input type="text" name="btm_name" id="ap-btm-name" class="ap-input" value="${btmProd?.name || 'Vintage Washed Relaxed Denim'}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">CATEGORY</label>
            <input type="text" name="btm_cat" id="ap-btm-cat" class="ap-input" value="${btmProd?.category || 'Pants'}" required />
          </div>
        </div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">COST PRICE / COGS (GH₵)</label>
            <input type="number" name="btm_cost" id="ap-btm-cost" class="ap-input ap-calc-input" min="0" step="1" value="${btmProd?.costPriceGhs || 250}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">SELLING PRICE (GH₵)</label>
            <input type="number" name="btm_sell" id="ap-btm-sell" class="ap-input ap-calc-input" min="0" step="1" value="${btmProd?.sellingPriceGhs || 580}" required />
          </div>
        </div>
        <div class="ap-field-row">
          <label class="ap-label">WAIST SIZES</label>
          <div class="ap-chips-row">${sizeChips(btmSizes, 'bottom', btmProd?.sizes || ['30', '32', '34'])}</div>
        </div>
      </div>

      <!-- Garment 3: FOOTWEAR -->
      <div class="ap-form-section ap-garment-config-box">
        <div class="ap-form-section-title">4. LINK ITEM 3 — FOOTWEAR</div>
        <div class="ap-field-row">
          <label class="ap-label">SELECT EXISTING FOOTWEAR OR CUSTOMIZE</label>
          <select id="ap-select-shoes" class="ap-select">
            <option value="custom">-- Custom Footwear --</option>
            ${shoeOptions}
          </select>
        </div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">FOOTWEAR NAME</label>
            <input type="text" name="shoe_name" id="ap-shoe-name" class="ap-input" value="${shoeProd?.name || 'Nike Orbit Agility Low'}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">CATEGORY</label>
            <input type="text" name="shoe_cat" id="ap-shoe-cat" class="ap-input" value="${shoeProd?.category || 'Footwear'}" required />
          </div>
        </div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">COST PRICE / COGS (GH₵)</label>
            <input type="number" name="shoe_cost" id="ap-shoe-cost" class="ap-input ap-calc-input" min="0" step="1" value="${shoeProd?.costPriceGhs || 380}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">SELLING PRICE (GH₵)</label>
            <input type="number" name="shoe_sell" id="ap-shoe-sell" class="ap-input ap-calc-input" min="0" step="1" value="${shoeProd?.sellingPriceGhs || 850}" required />
          </div>
        </div>
        <div class="ap-field-row">
          <label class="ap-label">EU SIZES</label>
          <div class="ap-chips-row">${sizeChips(shoeSizes, 'shoe', shoeProd?.sizes || ['41', '42', '43', '44'])}</div>
        </div>
      </div>

      <!-- Live Bundle Math Calculation Box -->
      <div class="ap-form-section ap-live-math-box">
        <div class="ap-form-section-title">5. LIVE BUNDLE DISCOUNT & MAPPING SUMMARY</div>
        <div class="ap-math-summary-grid">
          <div class="ap-math-box-item">
            <span>INDIVIDUAL SUM:</span>
            <strong id="ap-calc-regular-sum">GH₵ 1,920</strong>
          </div>
          <div class="ap-math-box-item">
            <span>PACKAGE DISCOUNT:</span>
            <div class="ap-inline-flex">
              <input type="number" id="ap-form-discount-input" min="0" max="100" value="${bundleDiscount}" class="ap-input ap-input--inline-rate" />
              <strong>%</strong>
            </div>
          </div>
          <div class="ap-math-box-item">
            <span>SAVINGS:</span>
            <strong id="ap-calc-savings" style="color: #15803d;">−GH₵ 192</strong>
          </div>
          <div class="ap-math-box-item ap-math-box-item--highlight">
            <span>CUSTOMER BUNDLE TOTAL:</span>
            <strong id="ap-calc-final-bundle">GH₵ 1,728</strong>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="ap-form-footer">
        <button type="submit" class="brand-btn brand-btn--dark brand-btn--full">
          SAVE & PUSH 3-PIECE OUTFIT TO 3D RUNWAY
        </button>
        <button type="button" class="brand-btn brand-btn--full" id="ap-form-cancel-btn">
          CANCEL
        </button>
      </div>
    </form>
  `;
}

/* ─── FULL PRODUCT EDITOR FORM (slide-up modal) ─────────────────────────── */

/**
 * Full-fidelity product editor — every managed field in one slide-up sheet:
 * image (live preview), name, vendor, category, cost/sell pricing with live
 * margin math, stock quantity, and toggleable customer-facing size chips.
 */
function renderProductEditForm(p: ManagedProduct): string {
  const sizePool = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL',
    '28', '30', '32', '34', '36', '38',
    '39', '40', '41', '42', '43', '44', '45', '46',
  ];
  const chips = Array.from(new Set([...p.sizes, ...sizePool]));
  const margin = p.sellingPriceGhs > 0 ? Math.round(((p.sellingPriceGhs - p.costPriceGhs) / p.sellingPriceGhs) * 100) : 0;

  return `
    <form id="ap-product-edit-form" data-product-id="${p.id}" class="ap-form">
      <div class="ap-form-section">
        <div class="ap-form-section-title">1. PRODUCT IDENTITY & IMAGERY</div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">PRODUCT NAME</label>
            <input type="text" name="name" class="ap-input" value="${p.name}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">VENDOR / ATELIER</label>
            <input type="text" name="vendor" class="ap-input" value="${p.vendor || 'Runway Atelier'}" required />
          </div>
        </div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">CATEGORY</label>
            <input type="text" name="category" class="ap-input" value="${p.category}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">SKU (SYSTEM ID)</label>
            <input type="text" value="NK-${p.id.toUpperCase()}" class="ap-input" readonly />
          </div>
        </div>
        <div class="ap-field-row">
          <label class="ap-label">PRODUCT IMAGE URL (WEBP / JPG / PNG)</label>
          <input type="url" name="image" id="ap-prod-img-url" class="ap-input" value="${p.image}" required />
          <div class="ap-model-preview-box">
            <img id="ap-prod-img-preview" src="${p.image}" alt="${p.name} preview" />
            <div class="ap-model-preview-hint">Live Storefront Image Preview</div>
          </div>
        </div>
      </div>

      <div class="ap-form-section ap-garment-config-box">
        <div class="ap-form-section-title">2. PRICING, MARGIN & STOCK</div>
        <div class="ap-field-grid-2">
          <div class="ap-field-row">
            <label class="ap-label">COST PRICE / COGS (GH₵)</label>
            <input type="number" name="cost" id="ap-prod-cost" class="ap-input ap-calc-input" min="0" step="1" value="${p.costPriceGhs}" required />
          </div>
          <div class="ap-field-row">
            <label class="ap-label">SELLING PRICE (GH₵)</label>
            <input type="number" name="sell" id="ap-prod-sell" class="ap-input ap-calc-input" min="0" step="1" value="${p.sellingPriceGhs}" required />
          </div>
        </div>
        <div class="ap-field-row">
          <label class="ap-label">STOCK QUANTITY (PIECES ON HAND)</label>
          <input type="number" name="stock" class="ap-input" min="0" step="1" value="${p.stockQuantity}" required />
        </div>
        <div class="ap-math-summary-grid">
          <div class="ap-math-box-item"><span class="ap-math-label">COST</span><strong id="ap-prod-cost-live">${formatGhs(p.costPriceGhs)}</strong></div>
          <div class="ap-math-box-item"><span class="ap-math-label">SELL</span><strong id="ap-prod-sell-live">${formatGhs(p.sellingPriceGhs)}</strong></div>
          <div class="ap-math-box-item ap-math-box-item--highlight"><span class="ap-math-label">LIVE MARGIN</span><strong id="ap-prod-margin-val">${margin}%</strong></div>
        </div>
      </div>

      <div class="ap-form-section ap-garment-config-box">
        <div class="ap-form-section-title">3. AVAILABLE SIZES (CUSTOMER-FACING)</div>
        <div class="ap-field-row">
          <label class="ap-label">TAP TO TOGGLE — ACTIVE SIZES SHIP TO CUSTOMERS</label>
          <div class="ap-chips-row" id="ap-prod-size-chips">
            ${chips
      .map(
        (s) => `
              <button type="button" class="ap-chip-btn ${p.sizes.includes(s) ? 'is-active' : ''}" data-chip-group="prod" data-val="${s}">${s}</button>`
      )
      .join('')}
          </div>
          <div class="ap-custom-size-row">
            <input type="text" id="ap-prod-custom-size" class="ap-input" placeholder="Custom size (e.g. 29)" maxlength="6" />
            <button type="button" id="ap-prod-add-size" class="brand-btn brand-btn--dark brand-btn--sm">+ ADD SIZE</button>
          </div>
        </div>
      </div>

      <div class="ap-form-footer">
        <button type="button" id="ap-prod-cancel-btn" class="brand-btn">CANCEL</button>
        <button type="submit" class="brand-btn brand-btn--dark brand-btn--full">SAVE PRODUCT CHANGES</button>
      </div>
    </form>
  `;
}

/* ─── ROOT RENDER: FULL ADMIN DESK ──────────────────────────────────────── */
export function renderAdminPage(): string {
  // Mobile dock island items (spring-physics nav, mirrors DropdownReact motion)
  const dockItems = [
    { section: 'ap-overview', label: 'Overview', icon: ic.overview },
    { section: 'ap-products', label: 'Products', icon: ic.products },
    { section: 'ap-orders', label: 'Orders', icon: ic.orders },
    { section: 'ap-settings', label: 'Settings', icon: ic.settings },
  ];

  return `
    <div class="ap-shell">

      <!-- Desktop Fixed Sidebar (sticky) -->
      <aside class="ap-sidebar">
        <!-- Static brand block — identity only, nav below covers the rest -->
        <div class="ap-brand-block">
          <span class="ap-monogram" aria-hidden="true">AS</span>
          <span class="ap-brand-meta">
            <span class="ap-brand-title">Around Studio</span>
            <span class="ap-brand-sub">Ops Desk · Accra</span>
          </span>
        </div>

        <nav class="ap-sidebar-nav">
          <div class="ap-nav-header">MAIN SYSTEMS</div>
          <button class="ap-nav-item is-active" data-section="ap-overview">
            ${ic.overview}
            <span>Overview</span>
          </button>
          <button class="ap-nav-item" data-section="ap-products">
            ${ic.products}
            <span>Products & Sets</span>
          </button>
          <button class="ap-nav-item" data-section="ap-orders">
            ${ic.orders}
            <span>Order Dispatch</span>
          </button>
          <button class="ap-nav-item" data-section="ap-settings">
            ${ic.settings}
            <span>Store Settings</span>
          </button>
        </nav>

        <div class="ap-sidebar-footer">
          <a href="#home" class="ap-exit-link">
            <span>RETURN TO STOREFRONT</span>
            <span class="ap-exit-arrow">${ic.external}</span>
          </a>
        </div>
      </aside>

      <!-- Main Stage -->
      <main class="ap-main">
        ${renderOverviewSection()}
        ${renderProductsSection()}
        ${renderOrdersSection()}
        ${renderSettingsSection()}
      </main>

      <!-- Mobile Bottom Navigation — React island with spring physics -->
      <div class="ap-mobile-dock-wrap admin-dock-host" data-active="ap-overview">
        <script type="application/json" data-dock-items>${JSON.stringify(dockItems)}</script>
      </div>

      <!-- Order Receipt / Detail Modal -->
      <dialog id="admin-detail-modal" class="checkout-modal">
        <div class="checkout-modal-inner" id="admin-detail-body"></div>
      </dialog>

      <!-- Garment Style Inspector Modal -->
      <dialog id="admin-style-modal" class="checkout-modal">
        <div class="checkout-modal-inner" id="admin-style-body"></div>
      </dialog>
    </div>
  `;
}

/* ─── CONTROLLER & EVENT BINDINGS ───────────────────────────────────────── */
export function bindAdminEvents(container: HTMLElement): void {
  // Start on Overview, hide other 3 sections
  container.querySelectorAll<HTMLElement>('.ap-section').forEach((sec) => {
    sec.hidden = sec.id !== 'ap-overview';
  });

  const activateNav = (sectionId: string) => {
    container.querySelectorAll<HTMLElement>('.ap-section').forEach((sec) => {
      sec.hidden = sec.id !== sectionId;
    });
    container.querySelectorAll('.ap-nav-item[data-section]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-section') === sectionId);
    });
    container
      .querySelector('.admin-dock-host')
      ?.dispatchEvent(new CustomEvent<string>('ap-dock:section', { detail: sectionId }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sidebar nav clicks
  container.querySelectorAll('.ap-nav-item[data-section]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      activateNav(btn.getAttribute('data-section') || '');
    });
  });

  // Quick-jump buttons (Overview quick actions strip)
  container.querySelectorAll('.ap-quick-jump[data-section]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activateNav(btn.getAttribute('data-section') || '');
    });
  });

  // Mobile dock — React island with spring physics (mounted once per render)
  mountAdminDock(container, activateNav);

  // Subtabs inside Products section (Runway Looks vs All Garments)
  container.querySelectorAll<HTMLButtonElement>('.ap-subtab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.ap-subtab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const target = tab.dataset.subtab;
      const paneRunway = container.querySelector('#ap-pane-runway-looks') as HTMLElement | null;
      const paneAll = container.querySelector('#ap-pane-all-garments') as HTMLElement | null;
      if (paneRunway) paneRunway.hidden = target !== 'runway-looks';
      if (paneAll) paneAll.hidden = target !== 'all-garments';
    });
  });

  // Global bundle discount handler
  const syncDiscount = (rate: number) => {
    setBundleDiscountPercent(rate);
    const badge = container.querySelector('#ap-overview-rate-badge');
    if (badge) badge.textContent = `${rate}% OFF`;

    container.querySelectorAll<HTMLInputElement>('#ap-overview-rate-input, #ap-settings-bundle-rate').forEach((inp) => {
      inp.value = String(rate);
    });

    ['#ap-overview-rate-feedback', '#ap-settings-rate-feedback'].forEach((sel) => {
      const fb = container.querySelector(sel) as HTMLElement | null;
      if (fb) {
        fb.hidden = false;
        fb.textContent = `Bundle discount updated to ${rate}%. Applied across all 3-piece runway sets and cart checkout!`;
        setTimeout(() => {
          fb.hidden = true;
        }, 4000);
      }
    });

    // Re-render products section so math reflects new discount
    const currentSubtab = container.querySelector('.ap-subtab.is-active')?.getAttribute('data-subtab') || 'runway-looks';
    const activeSec = Array.from(container.querySelectorAll<HTMLElement>('.ap-section')).find((s) => !s.hidden)?.id || 'ap-overview';
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
      pageContent.innerHTML = renderAdminPage();
      bindAdminEvents(pageContent);
      activateNav(activeSec);
      if (currentSubtab === 'all-garments') {
        const t = pageContent.querySelector('[data-subtab="all-garments"]') as HTMLButtonElement | null;
        t?.click();
      }
    }
  };

  // Overview discount button
  container.querySelector('#ap-overview-save-rate-btn')?.addEventListener('click', () => {
    const inp = container.querySelector('#ap-overview-rate-input') as HTMLInputElement | null;
    const val = parseFloat(inp?.value || '10');
    syncDiscount(isNaN(val) ? 10 : Math.max(0, Math.min(100, val)));
  });

  // Overview preset buttons
  container.querySelectorAll<HTMLButtonElement>('.ap-preset-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const r = parseFloat(btn.dataset.rate || '10');
      syncDiscount(r);
    });
  });

  // Settings discount button
  container.querySelector('#ap-settings-save-rate-btn')?.addEventListener('click', () => {
    const inp = container.querySelector('#ap-settings-bundle-rate') as HTMLInputElement | null;
    const val = parseFloat(inp?.value || '10');
    syncDiscount(isNaN(val) ? 10 : Math.max(0, Math.min(100, val)));
  });

  // Reset seed demo orders
  container.querySelector('#ap-reset-seed-btn')?.addEventListener('click', () => {
    resetOrdersToSeed();
    const pc = document.getElementById('page-content');
    if (pc) {
      pc.innerHTML = renderAdminPage();
      bindAdminEvents(pc);
      activateNav('ap-settings');
    }
  });

  // Order status dropdowns
  bindDropdowns(container, (dropdown, value) => {
    const orderId = dropdown.getAttribute('data-status-for');
    if (!orderId) return;
    updateOrderStatus(orderId, value as OrderStatus);
    dropdown.className = `dropdown-react-host ap-status-select ap-status--${value.toLowerCase().replace(/\s+/g, '-')}`;
  });

  /* ── Slide-up Modal: Outfit & 3 Items Configurator ── */
  const modalWrap = container.querySelector('#ap-look-config-modal') as HTMLElement | null;
  const modalBody = container.querySelector('#ap-modal-body') as HTMLElement | null;
  const modalTitle = container.querySelector('#ap-modal-title') as HTMLElement | null;
  const modalSlotKicker = container.querySelector('#ap-modal-slot-kicker') as HTMLElement | null;

  const closeOutfitModal = () => {
    if (modalWrap) {
      modalWrap.classList.remove('is-open');
      modalWrap.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('ap-no-scroll');
  };

  const openOutfitModal = (slotId: number) => {
    if (!modalWrap || !modalBody) return;
    const lookNum = String(slotId).padStart(2, '0');
    if (modalTitle) modalTitle.textContent = `Configure Outfit & 3 Items — Look ${lookNum}`;
    if (modalSlotKicker) modalSlotKicker.textContent = `RUNWAY SLOT ${lookNum} OF 12`;
    modalBody.innerHTML = renderLookConfigForm(slotId);

    modalWrap.classList.add('is-open');
    modalWrap.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ap-no-scroll');

    // Live preview for model image
    const modelUrlInput = modalBody.querySelector('#ap-form-model-url') as HTMLInputElement | null;
    const modelPreviewImg = modalBody.querySelector('#ap-live-model-preview') as HTMLImageElement | null;
    modelUrlInput?.addEventListener('input', () => {
      if (modelPreviewImg && modelUrlInput.value.trim()) {
        modelPreviewImg.src = modelUrlInput.value.trim();
      }
    });

    // Populate garment fields when choosing existing from dropdown
    const products = getManagedProducts();
    const wireGarmentDropdown = (selectId: string, nameId: string, catId: string, costId: string, sellId: string) => {
      const sel = modalBody.querySelector(selectId) as HTMLSelectElement | null;
      sel?.addEventListener('change', () => {
        const prod = products.find((p) => p.id === sel.value);
        if (prod) {
          const n = modalBody.querySelector(nameId) as HTMLInputElement | null;
          const c = modalBody.querySelector(catId) as HTMLInputElement | null;
          const co = modalBody.querySelector(costId) as HTMLInputElement | null;
          const se = modalBody.querySelector(sellId) as HTMLInputElement | null;
          if (n) n.value = prod.name;
          if (c) c.value = prod.category;
          if (co) co.value = String(prod.costPriceGhs);
          if (se) se.value = String(prod.sellingPriceGhs);
          calcLiveMath();
        }
      });
    };

    wireGarmentDropdown('#ap-select-top', '#ap-top-name', '#ap-top-cat', '#ap-top-cost', '#ap-top-sell');
    wireGarmentDropdown('#ap-select-bottom', '#ap-btm-name', '#ap-btm-cat', '#ap-btm-cost', '#ap-btm-sell');
    wireGarmentDropdown('#ap-select-shoes', '#ap-shoe-name', '#ap-shoe-cat', '#ap-shoe-cost', '#ap-shoe-sell');

    // Sizing chips toggle
    modalBody.querySelectorAll<HTMLButtonElement>('.ap-chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-active');
      });
    });

    // Live Math computation
    const calcLiveMath = () => {
      const topSell = parseFloat((modalBody.querySelector('#ap-top-sell') as HTMLInputElement)?.value || '0') || 0;
      const btmSell = parseFloat((modalBody.querySelector('#ap-btm-sell') as HTMLInputElement)?.value || '0') || 0;
      const shoeSell = parseFloat((modalBody.querySelector('#ap-shoe-sell') as HTMLInputElement)?.value || '0') || 0;
      const discount = parseFloat((modalBody.querySelector('#ap-form-discount-input') as HTMLInputElement)?.value || '10') || 0;

      const sum = topSell + btmSell + shoeSell;
      const savings = Math.round(sum * (discount / 100));
      const bundle = Math.max(0, sum - savings);

      const sumEl = modalBody.querySelector('#ap-calc-regular-sum');
      const savEl = modalBody.querySelector('#ap-calc-savings');
      const finEl = modalBody.querySelector('#ap-calc-final-bundle');

      if (sumEl) sumEl.textContent = formatGhs(sum);
      if (savEl) savEl.textContent = `−${formatGhs(savings)}`;
      if (finEl) finEl.textContent = formatGhs(bundle);
    };

    modalBody.querySelectorAll('.ap-calc-input, #ap-form-discount-input').forEach((inp) => {
      inp.addEventListener('input', calcLiveMath);
    });
    calcLiveMath();

    // Cancel button
    modalBody.querySelector('#ap-form-cancel-btn')?.addEventListener('click', closeOutfitModal);

    // Form submit
    const form = modalBody.querySelector('#ap-outfit-form') as HTMLFormElement | null;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      const getActiveChips = (group: string) => {
        return Array.from(modalBody.querySelectorAll<HTMLButtonElement>(`.ap-chip-btn[data-chip-group="${group}"].is-active`)).map(
          (c) => c.dataset.val || ''
        );
      };

      const topSizes = getActiveChips('top');
      const btmSizes = getActiveChips('bottom');
      const shoeSizes = getActiveChips('shoe');

      const name = String(formData.get('name') || `Runway Outfit ${lookNum}`);
      const description = String(formData.get('description') || '');
      const modelImage = String(formData.get('modelImage') || '');
      const bundleDisc = parseFloat(String(formData.get('bundle_discount') || '')) || parseFloat((modalBody.querySelector('#ap-form-discount-input') as HTMLInputElement)?.value || '10');

      // Save via products-store
      configureLookWithGarments({
        lookId: slotId,
        lookNum,
        name,
        description,
        modelImage,
        top: {
          name: String(formData.get('top_name') || 'Top Garment'),
          category: String(formData.get('top_cat') || 'Tops'),
          costPriceGhs: parseFloat(String(formData.get('top_cost') || '0')) || 150,
          sellingPriceGhs: parseFloat(String(formData.get('top_sell') || '0')) || 350,
          sizes: topSizes.length > 0 ? topSizes : ['S', 'M', 'L'],
        },
        bottom: {
          name: String(formData.get('btm_name') || 'Bottom Garment'),
          category: String(formData.get('btm_cat') || 'Pants'),
          costPriceGhs: parseFloat(String(formData.get('btm_cost') || '0')) || 180,
          sellingPriceGhs: parseFloat(String(formData.get('btm_sell') || '0')) || 450,
          sizes: btmSizes.length > 0 ? btmSizes : ['30', '32', '34'],
        },
        shoes: {
          name: String(formData.get('shoe_name') || 'Footwear'),
          category: String(formData.get('shoe_cat') || 'Footwear'),
          costPriceGhs: parseFloat(String(formData.get('shoe_cost') || '0')) || 250,
          sellingPriceGhs: parseFloat(String(formData.get('shoe_sell') || '0')) || 650,
          sizes: shoeSizes.length > 0 ? shoeSizes : ['41', '42', '43'],
        },
      });

      if (!isNaN(bundleDisc) && bundleDisc >= 0) {
        setBundleDiscountPercent(bundleDisc);
      }

      closeOutfitModal();

      // Refresh admin view
      const pc = document.getElementById('page-content');
      if (pc) {
        pc.innerHTML = renderAdminPage();
        bindAdminEvents(pc);
        activateNav('ap-products');
      }
    });
  };

  // Open modal triggers
  container.querySelectorAll<HTMLButtonElement>('[data-configure-slot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = parseInt(btn.dataset.configureSlot || '1', 10);
      openOutfitModal(slot);
    });
  });

  container.querySelector('#ap-quick-add-look-btn')?.addEventListener('click', () => {
    const looks = getManagedRunwayLooks();
    const nextSlot = Math.min(looks.length + 1, 12);
    openOutfitModal(nextSlot);
  });

  /* ── Full Product Editor (reuses the same slide-up sheet) ── */
  const openProductEditModal = (productId: string) => {
    if (!modalWrap || !modalBody) return;
    const prod = getManagedProducts().find((p) => p.id === productId);
    if (!prod) return;

    if (modalTitle) modalTitle.textContent = `Edit Product — ${prod.name}`;
    if (modalSlotKicker) modalSlotKicker.textContent = 'GARMENT INVENTORY EDITOR';
    modalBody.innerHTML = renderProductEditForm(prod);
    modalBody.scrollTop = 0;

    modalWrap.classList.add('is-open');
    modalWrap.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ap-no-scroll');

    // Live image preview
    const imgUrlInput = modalBody.querySelector('#ap-prod-img-url') as HTMLInputElement | null;
    const imgPreview = modalBody.querySelector('#ap-prod-img-preview') as HTMLImageElement | null;
    imgUrlInput?.addEventListener('input', () => {
      if (imgPreview && imgUrlInput.value.trim()) imgPreview.src = imgUrlInput.value.trim();
    });

    // Size chips toggle
    modalBody.querySelectorAll<HTMLButtonElement>('.ap-chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => chip.classList.toggle('is-active'));
    });

    // Custom size add
    const customInput = modalBody.querySelector('#ap-prod-custom-size') as HTMLInputElement | null;
    const chipsRow = modalBody.querySelector('#ap-prod-size-chips');
    modalBody.querySelector('#ap-prod-add-size')?.addEventListener('click', () => {
      const val = (customInput?.value || '').trim();
      if (!val || !chipsRow) return;
      const existing = Array.from(chipsRow.querySelectorAll<HTMLButtonElement>('.ap-chip-btn')).find(
        (c) => (c.dataset.val || '').toLowerCase() === val.toLowerCase()
      );
      if (existing) {
        existing.classList.add('is-active');
      } else {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ap-chip-btn is-active';
        chip.dataset.chipGroup = 'prod';
        chip.dataset.val = val;
        chip.textContent = val;
        chip.addEventListener('click', () => chip.classList.toggle('is-active'));
        chipsRow.appendChild(chip);
      }
      if (customInput) customInput.value = '';
    });

    // Live margin math
    const calcMargin = () => {
      const cost = parseFloat((modalBody.querySelector('#ap-prod-cost') as HTMLInputElement)?.value || '0') || 0;
      const sell = parseFloat((modalBody.querySelector('#ap-prod-sell') as HTMLInputElement)?.value || '0') || 0;
      const m = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0;
      const costLive = modalBody.querySelector('#ap-prod-cost-live');
      const sellLive = modalBody.querySelector('#ap-prod-sell-live');
      const marginEl = modalBody.querySelector('#ap-prod-margin-val');
      if (costLive) costLive.textContent = formatGhs(cost);
      if (sellLive) sellLive.textContent = formatGhs(sell);
      if (marginEl) marginEl.textContent = `${m}%`;
    };
    modalBody.querySelectorAll('.ap-calc-input').forEach((inp) => inp.addEventListener('input', calcMargin));

    // Cancel
    modalBody.querySelector('#ap-prod-cancel-btn')?.addEventListener('click', closeOutfitModal);

    // Submit — persist every editable field
    const form = modalBody.querySelector('#ap-product-edit-form') as HTMLFormElement | null;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const sizes = Array.from(modalBody.querySelectorAll<HTMLButtonElement>('.ap-chip-btn.is-active')).map(
        (c) => c.dataset.val || ''
      );

      const ok = updateManagedProduct(prod.id, {
        name: String(fd.get('name') || prod.name),
        vendor: String(fd.get('vendor') || prod.vendor),
        category: String(fd.get('category') || prod.category),
        image: String(fd.get('image') || prod.image),
        costPriceGhs: parseFloat(String(fd.get('cost') || '0')) || 0,
        sellingPriceGhs: parseFloat(String(fd.get('sell') || '0')) || 0,
        stockQuantity: parseInt(String(fd.get('stock') || '0'), 10) || 0,
        sizes: sizes.length > 0 ? sizes : prod.sizes,
      });

      closeOutfitModal();

      if (ok) {
        const pc = document.getElementById('page-content');
        if (pc) {
          pc.innerHTML = renderAdminPage();
          bindAdminEvents(pc);
          activateNav('ap-products');
          // Re-open the All Garments ledger so the saved row is visible
          pc.querySelector<HTMLButtonElement>('.ap-subtab[data-subtab="all-garments"]')?.click();
        }
      }
    });
  };

  container.querySelectorAll<HTMLButtonElement>('[data-edit-prod]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openProductEditModal(btn.getAttribute('data-edit-prod') || '');
    });
  });

  // Close modal events
  container.querySelector('#ap-modal-close-btn')?.addEventListener('click', closeOutfitModal);
  container.querySelector('#ap-look-backdrop')?.addEventListener('click', closeOutfitModal);

  /* ── Order Receipt Modal ── */
  const modal = container.querySelector('#admin-detail-modal') as HTMLDialogElement | null;
  const modalBodyEl = container.querySelector('#admin-detail-body');

  container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-admin-inspect]') as HTMLElement | null;
    if (!target || !modalBodyEl) return;
    const inspectId = target.getAttribute('data-admin-inspect');
    if (!inspectId) return;

    const order = getOrders().find((o) => o.id === inspectId);
    if (!order) return;

    const itemsHtml = order.items
      .map(
        (i) => `
        <div class="ap-receipt-item-row">
          <img src="${i.image}" alt="${i.name}" />
          <div>
            <strong>${i.name}</strong>
            <div class="ap-cell-sub">Size: ${i.size} · Qty: ${i.quantity}</div>
          </div>
          <div class="ap-price-bold">${formatGhs(toGhs(i.price * i.quantity))}</div>
        </div>
      `
      )
      .join('');

    modalBodyEl.innerHTML = `
      <div class="checkout-modal-head">
        <h2>Order #${order.id}</h2>
        <button id="close-admin-modal" class="checkout-close-btn">×</button>
      </div>
      <div class="ap-receipt-content">
        <div class="ap-receipt-meta">
          <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          <div><strong>Customer:</strong> ${order.customer.fullName} (${order.customer.phone || order.customer.email || '—'})</div>
          <div><strong>Fulfillment:</strong> ${order.customer.fulfillment === 'pickup' ? 'Store Pickup (Osu)' : 'Express Delivery'}</div>
          <div><strong>Payment:</strong> ${order.paymentMethod}</div>
          <div><strong>Status:</strong> <span class="ap-status-tag ap-status--${order.status.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span></div>
          <div><strong>Tracking:</strong> <a href="#track?id=${order.id}" style="text-decoration:underline; font-weight:700">Open Shipment Tracker ↗</a></div>
        </div>
        <div class="ap-kicker" style="margin-top:16px;">PURCHASED PIECES</div>
        <div class="ap-receipt-items-list">${itemsHtml}</div>
        <div class="ap-receipt-totals">
          <div>Subtotal: ${formatGhs(toGhs(order.subtotal))}</div>
          ${order.bundleDiscount ? `<div>Bundle Discount: −${formatGhs(toGhs(order.bundleDiscount))}</div>` : ''}
          <div class="ap-price-huge">Grand Total: ${formatGhs(toGhs(order.total))}</div>
        </div>
        <div class="ap-receipt-actions">
          <button class="brand-btn brand-btn--dark brand-btn--full" id="print-order-btn">SAVE RECEIPT (CREATOR’S KIT)</button>
        </div>
      </div>
    `;

    modal?.showModal();
    modalBodyEl.querySelector('#close-admin-modal')?.addEventListener('click', () => modal?.close());
    modalBodyEl.querySelector('#print-order-btn')?.addEventListener('click', () => {
      window.open(getCreatorsKitReceiptUrl(order), '_blank', 'noopener,noreferrer');
    });
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  /* ── Garment Style Inspector Modal ── */
  const styleModal = container.querySelector('#admin-style-modal') as HTMLDialogElement | null;
  const styleBody = container.querySelector('#admin-style-body');

  container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-style-inspect]') as HTMLElement | null;
    if (!target || !styleBody) return;
    const styleKey = target.getAttribute('data-style-inspect') || '';
    const orderedSize = target.getAttribute('data-item-size') || '';

    let product = PRODUCTS[styleKey];
    if (!product) {
      for (const p of Object.values(PRODUCTS)) {
        if (p.name.toLowerCase() === styleKey.toLowerCase()) {
          product = p;
          break;
        }
      }
    }
    if (!product) return;

    styleBody.innerHTML = `
      <div class="checkout-modal-head">
        <h2>Garment Specifications</h2>
        <button id="close-style-modal" class="checkout-close-btn">×</button>
      </div>
      <div class="ap-style-inspect-card">
        <img src="${product.image}" alt="${product.name}" class="ap-style-inspect-img" />
        <div class="ap-style-inspect-info">
          <span class="ap-kicker">${product.vendor}</span>
          <h3>${product.name}</h3>
          <div class="ap-badge">ORDERED SIZE: ${orderedSize || 'M'}</div>
          <div class="ap-price-bold" style="font-size:20px; margin: 8px 0;">${formatGhs(toGhs(product.price))}</div>
          <div class="ap-specs-grid">
            <div><span>SKU</span><strong>NK-${product.id.toUpperCase()}</strong></div>
            <div><span>CATEGORY</span><strong>${product.type}</strong></div>
            <div><span>SIZES</span><strong>${product.sizes.join(', ')}</strong></div>
            <div><span>STATUS</span><strong>IN ATELIER</strong></div>
          </div>
          <button id="close-style-btn" class="brand-btn brand-btn--dark" style="margin-top:16px;">CLOSE</button>
        </div>
      </div>
    `;

    styleModal?.showModal();
    styleBody.querySelector('#close-style-modal')?.addEventListener('click', () => styleModal?.close());
    styleBody.querySelector('#close-style-btn')?.addEventListener('click', () => styleModal?.close());
  });

  styleModal?.addEventListener('click', (e) => {
    if (e.target === styleModal) styleModal.close();
  });
}
