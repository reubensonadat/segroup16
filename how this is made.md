# How This Is Made — 3D Runway Clothing Brand Website

This document provides a comprehensive technical and creative breakdown of how this interactive 3D runway e-commerce website was engineered, how the visual effects operate, and how you can customize it with your own model photos, product catalog, branding, and order workflows.

---

## 1. Core Architecture & Philosophy

Traditional e-commerce platforms display apparel on static flat product grids. This website brings the **Paris / Milan digital runway** experience into the browser using a **React application shell** and a native runway custom element built with web standards (Custom Elements, CSS 3D transforms, mathematical spring mechanics, and responsive alpha-blended rendering) without heavy 3D rendering engines like WebGL or Three.js.

### Why Vanilla Web Components & CSS 3D?
- **Zero Asset Overhead**: No heavy 3D model meshes (`.gltf`, `.glb`) or GPU shaders.
- **Instant Paint & Low Battery Drain**: Uses hardware-accelerated CSS `transform: translate3d(...) scale(...)` and CSS `filter: blur(...)`.
- **Flawless Mobile Performance**: Scales down seamlessly from a 3D cylindrical stage on desktop to an editorial diagonal walking queue on mobile smartphones.
- **Accessible & SEO Ready**: Real semantic HTML elements (`<header>`, `<main>`, `<button>`, `<dialog>`, `<form>`, and accessible live regions for screen readers).

---

## 2. How the 3D Runway Ring is Generated

The runway carousel does not use a 3D canvas; instead, it uses a **2.5D cylindrical projection algorithm** implemented in pure TypeScript (`src/runway-logic.ts`).

### 2.1 The Cylindrical Depth Formula
Twelve model bodies ($N = 12$, comprising 6 original looks + 6 circular buffer clones) are arranged around a virtual circle of radius $R$:

$$\text{step} = \frac{2\pi}{12} = 30^\circ$$

For each model index $a$ relative to the current carousel position $\text{cur}$:

1. **Angular Offset ($\phi$)**:
   $$\phi = ((a - \text{cur}) \cdot \text{step}) \pmod{2\pi}$$
   Normalized to the interval $(-\pi, \pi]$.

2. **Depth ($z$)**:
   $$z = R \cdot (1 - \cos\phi)$$
   When the model is directly in front ($\phi = 0$), $z = 0$. As $\phi$ increases towards $\pm\pi$, $z$ reaches $2R$ (deep into the background).

3. **Perspective Projection ($\text{persp}$)**:
   Given virtual camera focal distance $P$:
   $$\text{persp} = \frac{P}{P + z}$$

4. **Horizontal Position ($x$)**:
   $$x = c_x + R \cdot \sin\phi \cdot \text{persp}$$
   Where $c_x = 0.5 \times \text{Stage Width}$.

5. **Vertical Horizon Convergence (Feet Baseline)**:
   Models further back in space converge toward the horizon line (at 36% of stage height):
   $$\text{feet} = \text{horizon} + (\text{floor} - \text{horizon}) \cdot \text{persp}$$
   $$\text{bottom} = \text{Stage Height} - \text{feet}$$

6. **Depth-of-Field Blur**:
   Models further along the ring get an optical blur:
   $$\text{blur} = \begin{cases} 
      1.8 \cdot \text{slots}, & \text{slots} \le 1 \\
      \min(1.8 + (\text{slots} - 1) \cdot 2, \, 6.5)\text{ px}, & \text{slots} > 1 
   \end{cases}$$

7. **Z-Index Layering**:
   $$z\text{-index} = \text{round}(\text{scale} \times 1000)$$
   Ensures foreground figures always render on top of background figures without glitching.

---

## 3. How to Add Your Own Pictures & Models

Follow these exact steps to replace the current models with your own clothing brand lookbook:

### Step 3.1: Photo Shoot & Transparent Cutouts
1. **Pose & Framing**: Shoot your models full-body from head to shoes on a plain studio backdrop.
2. **Aspect Ratio**: Standardize on a **9:16 aspect ratio** (e.g., width 1080px, height 1920px).
3. **Background Removal**: Extract the background so you have a **transparent alpha channel** (no white background, only the model and their garments). Save as `.webp` or `.png`.
4. **Resolution Export**:
   - High-Res: `1080 × 1920` (for 4K and Retina screens)
   - Mid-Res: `640 × 1138` (for fast mobile loading and canvas alpha scanning)

### Step 3.2: Automatic Canvas Feet Detection
Because different cutouts might have varying empty space between the shoes and the bottom edge of the image canvas, the script uses an **automated alpha-scanner**:
- It loads the 640px image into an in-memory 48px HTML5 canvas.
- It scans pixels from the bottom row upwards for the first non-transparent pixel ($\text{alpha} > 40$).
- It dynamically calculates `--rw-foot`:
  $$\text{footOffset} = \text{clamp}\left(\frac{\text{height} - 1 - \text{lastRow}}{\text{height}}, 0, 0.4\right)$$
- The image is shifted down by `translateY(calc(var(--rw-foot) * 100%))`, ensuring every model stands perfectly on the runway floor line.

### Step 3.3: Updating the Code
Open `src/data.ts` and update the `LOOKS` array:

```typescript
export const LOOKS: LookData[] = [
  {
    index: 0,
    lookNum: '01',
    name: 'Your Collection Name',
    key: 'look_key_1',
    description: 'Minimalist wool coat and selvedge denim.',
    model640: '/assets/your-model-1-640.webp',
    model1080: '/assets/your-model-1-1080.webp',
    probe: '/assets/your-model-1-640.webp',
    pins: [
      { index: 1, product: 'your-jacket-id', left: '48%', top: '30%' },
      { index: 2, product: 'your-pants-id', left: '50%', top: '65%' },
      { index: 3, product: 'your-shoes-id', left: '46%', top: '94%' },
    ],
    items: [
      { productId: 'your-jacket-id', tag: 'New' },
      { productId: 'your-pants-id' },
      { productId: 'your-shoes-id' },
    ],
  },
  // Add looks 2 through 6...
];
```

---

## 4. How to Add Your Own Products & Sizes

Open `src/data.ts` and update the `PRODUCTS` dictionary:

```typescript
export const PRODUCTS: Record<string, ProductItem> = {
  'your-jacket-id': {
    id: 'your-jacket-id',
    name: 'Structured Wool Overshirt',
    type: 'Outerwear',
    vendor: 'Studio Label',
    price: 240.0,
    image: '/assets/products/wool-overshirt.webp',
    width: 400,
    height: 560,
    thumbHeightPhone: 220,
    sizes: ['S', 'M', 'L', 'XL'],
    optionLegend: 'Size',
    variants: [
      { id: 10001, a: true, o: ['S'] },
      { id: 10002, a: true, o: ['M'] },
      { id: 10003, a: true, o: ['L'] },
      { id: 10004, a: true, o: ['XL'] },
    ],
    url: '#cart',
  },
};
```

- `sizes`: An ordered array of available sizes (e.g. `['S', 'M', 'L', 'XL']` or shoe sizes `['40', '41', '42', '43', '44', '45']`).
- `variants`: Array of variant objects containing unique integer `id`, availability flag `a: true|false`, and selected option `o: [size]`.

---

## 5. Navigation & Button-Only Carousel Controls

Per user requirements:
- **No Dragging**: Pointer dragging on the runway stage is disabled. Users navigate intentionally using the **bottom arrows** (`Next look`, `Previous look`) or direct **01–06 segmented tick buttons**.
- **View-Only Cursor**: The custom stage cursor is dedicated to "View" magnifier mode when hovering the active figure and shrinks to a focal dot over pins, eliminating dragging affordances.
- **Smooth Critically Damped Harmonic Motion**: Transitions between looks use physics stiffness $K = 95$ and damping $C = 2\sqrt{K} \approx 19.49$ to eliminate artificial easing bounce and deliver a silky luxury feel.

---

## 6. Full Brand Navigation & Pages

The application features full internal routing (`src/router.ts`) connecting:

1. **Runway (`#runway` or `/`)**:
   - The flagship 3D runway outfit carousel.
   - Interactive pins, zoom lightbox, and side look panel.
2. **Nike Orbit (`#orbit`)**:
   - Featured footwear collection page showing the Tatum 5 Orbit and Air Jordan silhouette details, high-contrast imagery, and direct "Add to Cart" actions.
3. **Hand Rail Pro (`#movement`)**:
   - The brand's campaign and lookbook story, showcasing movement, street culture, and oversized tailoring.
4. **Cart & Checkout Page (`#cart`)**:
   - Itemized product table with thumbnails, selected sizes, quantities, and pricing.
   - Cost calculation (Subtotal, Tax, Free Express Shipping, Total).
   - Real-time checkout form (Customer Name, Email, Street Address, Payment Simulation).
   - Order submission automatically clears the bag and stores the order.
5. **Admin Dashboard (`#admin`)**:
   - Real-time order fulfillment center.
   - Key business performance metrics: Total Revenue, Total Orders, Average Order Value (AOV).
   - Order management table showing Order ID, Date/Time, Customer, Total, and Order Status.
   - Status updates: Toggle orders between `Processing`, `Shipped`, and `Delivered`.
   - Customer shipping breakdown and itemized receipts.
6. **How It's Made Guide (`#guide`)**:
   - Interactive in-app technical reference.

---

## 7. Order Lifecycle: From Click to Fulfillment

```
1. Customer views runway -> chooses size -> clicks "Add to bag"
       │
       ▼
2. Local styling bag updates in localStorage (`runway-styling-bag-v3`)
       │
       ▼
3. Customer navigates to Cart page (`#cart`) -> reviews sizes & prices
       │
       ▼
4. Customer fills out shipping & payment -> clicks "Place Order"
       │
       ▼
5. Order object generated (`RNW-XXXX`) -> saved to `localStorage['runway-orders-v1']`
       │
       ▼
6. Bag is emptied -> Confirmation screen appears with tracking code
       │
       ▼
7. Store Admin opens Admin Dashboard (`#admin`) -> reviews new order,
   inspects delivery address, and updates status to "Shipped" / "Delivered"
```

---

## 8. Summary of Files

| File | Purpose |
|---|---|
| `src/runway-section.ts` | The core `<runway-section>` Web Component with 3D ring & lightbox logic. |
| `src/runway-logic.ts` | Pure mathematical projection equations, ring slots, and bag algorithms. |
| `src/data.ts` | Full product catalog, looks, pins, images, and sizes. |
| `src/orders-store.ts` | Order storage, state transitions, analytics, and demo seed data. |
| `src/pages/cart-page.ts` | Cart table, order summary, and interactive checkout modal. |
| `src/pages/admin-page.ts` | Brand admin dashboard with order statuses and revenue analytics. |
| `src/pages/collection-pages.ts`| "Nike Orbit" and "Hand Rail Pro" brand collection pages. |
| `src/router.ts` | Client-side page navigation router. |
| `src/index.css` | Complete stylesheet with 3D ring, tokens, dark/light themes, and responsive rules. |
| `how this is made.md` | This technical guide. |
