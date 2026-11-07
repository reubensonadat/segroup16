# The Cold DM Pitch Playbook: Selling 3D Runway Stores to Ghanaian Fashion Brands

> **Core Insight**: Spending 4–8 hours re-skinning an entire website for a brand *before* they even reply to a DM is a guaranteed recipe for burnout. The most profitable strategy is **The Universal Master Reel + Instant Preset Flip**.

---

## 1. Why Pre-Customizing for Everyone is a Trap

| Approach | Time Investment | Response Rate | Risk Level |
| :--- | :--- | :--- | :--- |
| **Full Pre-Customization** (Re-editing all pictures/data before reaching out) | 3–5 hours per brand | 15–25% (same as generic) | **High**: If they don't reply, you wasted days of work. |
| **Universal Master Reel + Brand-Specific Teaser** | **5 minutes per brand** | 35–50% (High curiosity) | **Very Low**: You record one fire video once, and tailor the message in 30 seconds. |

### The "Instant Preset Flip" Secret Weapon
Because we built `src/brand-presets.ts`, you already have their presets pre-programmed! 
* You send the **Universal Master Reel** first.
* As soon as they reply (*"Yo this is mad, how does it work?"* or *"Can this work for my brand?"*), you literally change one line in `src/brand-presets.ts`:
  ```ts
  export const ACTIVE_BRAND_KEY = 'aroundclothing'; // or '1981clothings'
  ```
* Within 2 minutes, you send back a personalized screen recording or live demo with **THEIR** logo, **THEIR** name, and **THEIR** flagship pickup address (e.g. Kass Towers, Osu, etc.). They will be blown away by your speed.

---

## 2. What to Put in the Universal Master Reel (20–30 Seconds)

Do **not** record a boring voiceover walkthrough. Fashion brand owners are visual, aesthetic-driven creatives. They respond to motion, rhythm, and luxury feel.

### The 4-Shot Reel Sequence (Set to a trending Afro-beats / Amapiano instrumental):

1. **Shot 1 (0–6s): The 3D Runway Swipe**  
   * Swipe across the runway models on desktop or mobile.  
   * Click on a garment pin (e.g., *Charcoal Heavy Knit Crew*), showing the interactive hot-spot expand.
2. **Shot 2 (7–12s): The 1-Click Look Bundle**  
   * Tap *"Add full look to bag — Save 10%"*.  
   * Cut to the cart showing the green **"Complete Runway Outfit Package Unlocked"** banner and `-GH₵98.70` deduction.
3. **Shot 3 (13–18s): The Ghana Mobile Money & Kola Route Checkout**  
   * Show typing a phone number $\rightarrow$ auto-detecting **MTN MoMo** / **Telecel Cash**.  
   * Tap **1-Click GPS Pin** $\rightarrow$ show live Accra road route distance & courier ETA.  
   * Show the USSD Prompt authorization popup.
4. **Shot 4 (19–25s): The Executive Admin TPS + MIS Dashboard**  
   * Quick cut to the backend showing Gross Revenue, Net Profit margins (Selling vs Cost), and the live order fulfillment tracker.
5. **Final Text Overlay (26–30s)**:  
   * *"Made for Accra's Top Streetwear & Luxury Labels. Ready in 48 Hours."*

---

## 3. Brand-Specific Cold DM Scripts

Never send raw links (`https://...`) in the very first DM. Instagram automatically routes DMs with outbound links to the **Hidden Requests / Spam** folder. Send the video first, followed by a tight 3-line hook.

---

### Brand A: `@around_clothingg` (11.8K followers)
* **Their Vulnerability**: Their Shopify store link (`aroundclothing.store`) is currently showing: *"This store is currently unavailable"*. They are losing daily sales from Instagram bio traffic.
* **Cold DM Hook**:
> "Yo team @around_clothingg! Noticed your website link in bio is currently down on Shopify. 
> 
> Sent you a quick 20s clip above showing an interactive 3D runway concept I put together with automatic Ghana MoMo checkout + 1-click GPS courier delivery. 
> 
> I can migrate your upcoming drop into this exact setup in 24 hours so you don't lose sales when Shopify cards decline. Want me to flip your latest pieces onto this demo?"

---

### Brand B: `@1981clothings` (130K followers, Verified)
* **Their Vulnerability**: High-end luxury bespoke brand (Kass Towers, Airport Residential). Their Shopify store (`1981clothings.com`) is also down. A luxury brand cannot look broken to VIP clients.
* **Cold DM Hook**:
> "Good day @1981clothings team. Huge fan of the Made-to-Measure pieces at Kass Towers.
> 
> I saw your international storefront link was showing unavailable today. Dropped a 25s concept clip above of a private 3D digital atelier with complete outfit bundling, VIP sizing, and direct MTN MoMo / card settlements.
> 
> Would love to show the management team how this elevates the 1981 digital experience. Should I send over the live link?"

---

### Brand C: `@mod.hq` (21.5K followers) & `@missymill_gh` (9.2K followers)
* **Their Vulnerability**: They are running entirely on WhatsApp DMs (`wa.me/233...`), writing prices on Instagram images manually (e.g. *"Size 12 350 gh 0244985565"*). They spend hours texting back and forth to confirm sizes and MoMo screenshots.
* **Cold DM Hook**:
> "Hey @mod.hq! Love the elevated Afro-fusion pieces.
> 
> Noticed you manage most sales manually through WhatsApp and DM transfers. Sent a short video above showing an automated checkout system built for Ghanaian fashion brands: customers bundle full outfits, lock their GPS pin for Accra delivery, and pay directly via MoMo without you having to manually verify screenshots.
> 
> It can cut your WhatsApp order handling time by 80%. Let me know if you’d like to see your collection on the demo!"

---

## 4. Pricing & Closing Matrix (Ghana Market Reality)

When they ask **"How much does this cost?"**, never just quote a flat number without framing the ROI:

* **Setup & Launch**: **GH₵3,500 – GH₵4,500** (One-time)
  * Includes domain connection, brand color styling, uploading their first 6–10 looks, Ghana MoMo wallet setup, and staff guide.
* **Optional Launch Video (The Sweetener)**: **+GH₵500**
  * You provide a ready-to-post 9:16 Instagram Reel showing their clothes rotating on the 3D stage.
* **Monthly Support / Hosting / Maintenance**: **GH₵300 – GH₵400/month**
  * *Why they love this*: Shopify charges \$39–\$105/month (GH₵600–GH₵1,600/month) in USD on cards that constantly get blocked by Ghanaian banks. You are offering local support with zero USD headaches.

