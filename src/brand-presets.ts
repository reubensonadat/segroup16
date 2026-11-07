export interface BrandPreset {
  key: string;
  name: string;
  tagline: string;
  logoText: string;
  bioUrl?: string;
  contactPhone: string;
  hub: {
    name: string;
    address: string;
    city: string;
  };
  sampleFitName: string;
  sampleGarmentNames: {
    top: string;
    bottom: string;
    footwear: string;
  };
}

export const BRAND_PRESETS: Record<string, BrandPreset> = {
  aroundclothing: {
    key: 'aroundclothing',
    name: 'Around Clothing',
    tagline: 'Where Fashion Knows No Boundaries · Accra',
    logoText: 'AROUND',
    bioUrl: 'www.aroundclothing.store',
    contactPhone: '024 000 0000',
    hub: {
      name: 'Around Clothing Storefront',
      address: 'Around Flagship Studio, Accra',
      city: 'Accra, Ghana',
    },
    sampleFitName: 'The Around Oversized Edit',
    sampleGarmentNames: {
      top: 'Around Longsleeve Graphic Tee',
      bottom: 'Heavy Embellished Baggy Denim',
      footwear: 'Chunky Lug Platform Boot',
    },
  },
  '1981clothings': {
    key: '1981clothings',
    name: '1981 Clothings',
    tagline: 'Made to Measure Luxury · Kass Towers',
    logoText: '1981 CLOTHINGS',
    bioUrl: 'www.1981clothings.com',
    contactPhone: '024 198 1000',
    hub: {
      name: '1981 Luxury Atelier',
      address: 'Kass Towers, Airport Residential Area',
      city: 'Accra, Ghana',
    },
    sampleFitName: 'Made-To-Measure Resort Atelier',
    sampleGarmentNames: {
      top: 'Embroidered Silk Blend Camp Shirt',
      bottom: 'Pleated Tailored Ivory Trousers',
      footwear: 'Handcrafted Tonal Loafer',
    },
  },
  modhq: {
    key: 'modhq',
    name: 'MOD HQ',
    tagline: 'Elevated Afro-Fusion Womenswear · Proudly Ghanaian',
    logoText: 'MOD HQ',
    contactPhone: '020 963 8613',
    hub: {
      name: 'The Mod HQ Studio',
      address: 'Abebresem St, Osu / Cantonments',
      city: 'Accra, Ghana',
    },
    sampleFitName: 'Afro-Fusion Collar Ensemble',
    sampleGarmentNames: {
      top: 'Pattern Blocked Striped Collar Blouse',
      bottom: 'High-Waisted Tailored Cigarette Pant',
      footwear: 'Minimalist Mules',
    },
  },
  missymill: {
    key: 'missymill',
    name: 'Missy Mill',
    tagline: 'Luxury Fashion for Women · Jewelry with Presence',
    logoText: 'MISSY MILL',
    contactPhone: '024 498 5565',
    hub: {
      name: 'Missy Mill Collection Hub',
      address: 'Accra Showroom, Nationwide Delivery',
      city: 'Accra, Ghana',
    },
    sampleFitName: 'Lavender Hand-Knit Halter & Silk Set',
    sampleGarmentNames: {
      top: 'Lavender Textured Crochet Halter',
      bottom: 'High-Slit Draped Silk Skirt',
      footwear: 'Strappy Evening Heeled Sandal',
    },
  },
  freetheyouth: {
    key: 'freetheyouth',
    name: 'Free The Youth',
    tagline: 'Streetwear & Creative Movement · Accra',
    logoText: 'FREE THE YOUTH',
    contactPhone: '024 327 0509',
    hub: {
      name: 'Free The Youth Flagship Hub',
      address: 'Mission House, Osu Oxford Street',
      city: 'Accra, Ghana',
    },
    sampleFitName: 'The Streetwear Archive Drop',
    sampleGarmentNames: {
      top: '480 GSM Heavyweight Boxy Hoodie',
      bottom: 'Multi-Pocket Technical Cargo Pants',
      footwear: 'Nike Orbit Agility Low',
    },
  },
};

// 👉 CHANGE THIS ONE LINE TO SWITCH THE BRAND DEMO INSTANTLY:
export const ACTIVE_BRAND_KEY = 'aroundclothing';

export function getActiveBrand(): BrandPreset {
  return BRAND_PRESETS[ACTIVE_BRAND_KEY] || BRAND_PRESETS.aroundclothing;
}

