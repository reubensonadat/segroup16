# Merchant Onboarding & Drop Upload Guide
*A step-by-step operating manual for adding new collections, pricing pieces, and managing orders on the 3D Digital Runway.*

---

## 1. Product Photography Standards
To maintain runway-level visual quality and fast mobile load speeds:

* **Garment & Model Photos**:
  * Aspect Ratio: **4:5 vertical** (recommended `1080 × 1350 px` or `640 × 800 px`).
  * Background: Clean neutral studio cyclorama, solid grey, or transparent cutout.
  * Lighting: Even daylight or soft studio lighting without harsh specular glare.
* **Footwear & Accessories**:
  * Aspect Ratio: **1:1 square** or **4:3 horizontal**.
  * Bounding Box: Leave at least 15% inner padding so soles and collars are never clipped by card borders.

---

## 2. Adding a New Collection Piece
All pieces are defined inside `src/data.ts`. To add a new shirt, trouser, or footwear piece:

```ts
'fit-1-shirt': {
  name: 'Your Garment Name',
  type: 'Heavyweight Knit / Linen / Denim',
  vendor: 'Your Brand Name',
  price: 34.9, // In USD (automatically converts to GH₵ at current rates)
  sizes: ['S', 'M', 'L', 'XL'],
  image: '/assets/your-garment-image.webp',
}
```

---

## 3. Order Management & Fulfillments
When customers checkout via **MTN MoMo**, **Telecel Cash**, or **In-Store Pickup**:

1. Open your admin dashboard at `yourdomain.com/#admin`.
2. Inspect the **Live Order Table**:
   * View the customer's **1-Click GPS delivery coordinates** or boutique collection pin.
   * Review chosen sizes, quantities, and MoMo transaction references.
3. Update Status:
   * **Doorstep Delivery**: `Processing` $\rightarrow$ `In Transit` $\rightarrow$ `Out for Delivery` $\rightarrow$ `Delivered`.
   * **Storefront Pickup**: `Processing` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Collected`.

---

## 4. Digital Receipts & Packaging Slips
* Click **"Receipt"** on any order row in the Admin Dashboard to generate an exportable **Creator’s Kit digital receipt**.
* Can be printed directly for the courier bag or shared directly to the customer's WhatsApp.

