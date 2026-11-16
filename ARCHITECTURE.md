# ARCHITECTURE.md — How This App Is Built, In Plain English

This document explains, in simple terms, how the whole **Runway** application works:
what it is, what it is built with, which files do what, and how everything connects.
If you only read one document about this codebase, make it this one.

> For the data side of things (tables, fields, relationships), see **[DATABASE.md](./DATABASE.md)**.

---

## 1. What Is This App?

**Runway** is an online clothing store for a Ghanaian fashion brand (default brand:
*Around Clothing*, Accra). Instead of a boring product grid, shoppers land on an
**interactive 3D runway** — models stand on a circular stage, you spin them around,
click the garments on them, and add pieces to your bag.

Behind the storefront there is also a full **Admin back office** where the store owner
manages products, looks, orders, discounts, and delivery fees — no code required.

### The headline features

| Feature | Where you see it |
|---|---|
| 3D spinning runway with up to 12 looks | Home page (`#home`) |
| Clickable garment pins on each model | Home page |
| Product pages with sizes & specs | `#product?id=...` |
| Shoes orbit & collection rail pages | `#orbit`, `#collection` |
| Cart with automatic **Look Bundle discounts** | `#cart` |
| Checkout with GPS location + Mobile Money (MoMo) | Cart page |
| Order tracking with a live map | `#track?id=...` |
| Admin desk (orders, products, finance, settings) | `#admin` |

---

## 2. What It Is Built With

| Technology | What it does for us |
|---|---|
| **Vite** | Build tool & dev server. Runs the site locally and bundles it for production. |
| **TypeScript** | The entire codebase. Types keep the data shapes honest. |
| **React 19** | The application shell: header, navigation, dialogs, admin dock. |
| **Web Components (custom elements)** | The runway itself is a native `<runway-section>` element — React mounts it, but it runs on pure web standards for maximum speed. |
| **CSS 3D transforms** | The "3D" effect. No WebGL, no Three.js — just fast, hardware-accelerated CSS math. |
| **localStorage** | Our database for now. Every store (products, orders, settings, cart) persists in the browser. The code is structured so this can be swapped for a real database later. |
| **MapLibre GL** | The delivery map on the track page (map components in `src/components/ui/map/`). |
| **Vitest-style node tests (`tsx --test`)** | Unit tests for every store and the runway math. |

---

## 3. The Big Picture — How a Page Loads

```
index.html                     The empty Vite document (just a <div id="root">)
   │
   ▼
src/main.tsx                   React entry point — mounts <App /> into #root
   │
   ▼
src/App.tsx                    THE SHELL. Does 3 things:
   │                           1. Renders the Header, cart icon, styling-bag dialog
   │                           2. Fetches /runway-template.html (the generated runway
   │                              markup) and injects the <runway-section> element
   │                           3. Starts the router once the runway is ready
   │
   ▼
src/router.ts                  HASH ROUTER. Reads the URL (#home, #cart, #admin...)
   │                           and decides what to show:
   │                           • #home    → show the runway, hide the page container
   │                           • anything else → hide runway, render a page into
   │                             #page-content and bind its event handlers
   │
   ▼
src/pages/*                    The pages (each page = a render function + a bind function)
```

**One important trick:** the runway markup is big, so it is *generated at build time*
by `scripts/build-html.ts` into `public/runway-template.html`. React fetches that
file at runtime and mounts it. This keeps `index.html` tiny and the JS bundle small.
`npm run build` always regenerates the template first.

---

## 4. Key Files, Grouped by Job

### 4.1 Entry & Shell
| File | Job |
|---|---|
| `index.html` | Minimal Vite document + React root. Nothing else. |
| `src/main.tsx` | Boots React. |
| `src/App.tsx` | App shell: header, nav, opening curtain animation, styling-bag dialog, page container, runway mounting. |
| `src/index.css` | All global styling, including the CSS 3D runway stage rules. |

### 4.2 The 3D Runway (the fancy part)
| File | Job |
|---|---|
| `src/runway-section.ts` | The `<runway-section>` custom element. Owns the spin/drag/keyboard interaction, garment pins, and mobile layout. |
| `src/runway-logic.ts` | The pure math: positions each model on a virtual circle (angle → depth → scale → blur), plus cart/bag helpers (`addToBag`, `StylingBagItem`). |
| `scripts/build-html.ts` | Build script that generates `public/runway-template.html` from the look data. |
| `public/assets/*.webp` | The model & product photos (transparent WebP cutouts). |

### 4.3 Routing & Pages
| File | Job |
|---|---|
| `src/router.ts` | Hash router + query params (e.g. `#track?id=RNW-1042`). |
| `src/pages/cart-page.ts` | Cart UI, checkout form, MoMo prompt, order creation. |
| `src/pages/track-page.ts` | Order tracking + live delivery map. |
| `src/pages/admin-page.ts` | The entire Admin desk (~2600 lines: overview, orders, products, settings). |
| `src/pages/collection-pages.ts` | Shoes orbit page, collection rail page, product detail page, guide page. |

### 4.4 Data & State Stores (the "database layer")
Each store reads/writes one localStorage key, and is written so the storage can be
replaced by a real backend without touching the UI.

| File | Stores | localStorage key |
|---|---|---|
| `src/data.ts` | Seed catalog: `PRODUCTS` + `LOOKS` (the source data everything bootstraps from). | — (in code) |
| `src/products-store.ts` | Editable products (`ManagedProduct`) and runway looks (`ManagedRunwayLook`), financial overview. | `runway-managed-products-v1`, `runway-managed-looks-v1` |
| `src/orders-store.ts` | Orders (`Order`, `OrderItem`, `CustomerInfo`, `OrderStatus`) + demo seed orders. | `runway-orders-v1` |
| `src/store-config.ts` | Store settings (`StoreConfig`): brand info, discounts, delivery fees. **Repository pattern** — swap `LocalStorageStoreConfigRepository` for a real DB later. | `runway-store-config-v1` |
| `src/bundle-store.ts` | The bundle engine: detects when a cart contains a full look (top + bottom + shoes) and applies the discount. | `runway-bundle-discount-rate-v1` |
| `src/pages/cart-page.ts` (top) | The shopping bag itself. | `runway-styling-bag-v3` |

### 4.5 Business Logic & Utilities
| File | Job |
|---|---|
| `src/currency.ts` | USD → GHS conversion + `GH₵` formatting. |
| `src/location.ts` | 1-click GPS detection for delivery addresses. |
| `src/lib/roadRoute.ts` | Road-distance geometry for courier routes. |
| `src/creators-kit.ts` | Generates shareable receipt URLs for orders. |
| `src/brand-presets.ts` | Multi-brand presets (Around Clothing, 1981 Clothings, MOD HQ) — one line switches the whole demo brand. |
| `src/utils/image-compression.ts` | Compresses admin-uploaded photos to fast WebP. |
| `src/utils/cn.ts`, `src/dropdown*.tsx` | Small UI helpers (class joining, React dropdowns). |
| `src/admin-dock.tsx` | The floating React nav dock used inside the Admin page. |

### 4.6 Map Components (used by the Track page)
`src/components/ui/map/` — MapLibre wrapper, markers, popups, routes, zoom controls,
and a WebGL diagnostic fallback card for unsupported browsers.

### 4.7 Tests
`src/*.test.ts` and `src/pages/admin-page.test.ts` — unit tests for the stores,
the runway math, and image compression. Run with `npm test`.

---

## 5. How Data Flows (One Shopping Trip, End to End)

```
 1. Shopper spins the runway (runway-section.ts)
 2. Taps a garment pin  ──►  product popup  ──►  "Add to bag"
        │                                        (runway-logic.ts addToBag)
        ▼
 3. CART PAGE (cart-page.ts)
    • reads bag from localStorage
    • bundle-store.ts scans the cart: full look? → apply bundle discount %
    • store-config.ts calculates delivery fee (free above GH₵ 1,200)
        │
        ▼
 4. CHECKOUT
    • customer fills name / phone / address
    • location.ts grabs a GPS pin (optional)
    • MoMo payment prompt (MTN / Telecel / AT)
        │
        ▼
 5. orders-store.ts createOrder()
    • builds an Order (id like "RNW-1042", items, totals, status "Processing")
    • saves to localStorage → dispatches update event
        │
        ├──► 6. ADMIN (#admin, admin-page.ts)
        │       sees the order instantly, updates status:
        │       Processing → Shipped → In Transit → Delivered (or pickup flow)
        │
        └──► 7. TRACK PAGE (#track?id=RNW-1042, track-page.ts)
                customer watches status + courier position on the map
```

Everything above runs **client-side only** — there is no server yet. That is deliberate:
the stores are designed behind clean function boundaries (`getOrders()`,
`saveManagedProducts()`, `getStoreConfig()`) so plugging in a real backend later
means changing the store internals only, not the pages.

---

## 6. Running the Project

```bash
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:5173)
npm test           # run unit tests
npm run lint       # type-check (tsc --noEmit)
npm run build      # regenerates runway-template.html, then builds to dist/
npm run preview    # serve the production build locally
```

No API keys are needed for the storefront. `.env.example` documents optional
environment variables; secrets belong in `.env.local` (git-ignored).

---

## 7. Related Documents

| Document | What's inside |
|---|---|
| [README.md](./README.md) | Quick-start and project overview |
| [DATABASE.md](./DATABASE.md) | **The database schema — tables, fields, and how they connect** |
| [how this is made.md](./how%20this%20is%20made.md) | Deep-dive: the runway math, photo prep, customizing looks |
| [docs/](./docs) | Detailed guides: upload workflow, store config contract, runway architecture |
