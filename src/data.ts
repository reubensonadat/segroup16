export interface ProductVariant {
  id: number;
  a: boolean;
  o: string[];
}

export interface ProductItem {
  id: string;
  name: string;
  type: string;
  vendor: string;
  price: number;
  image: string;
  width: number;
  height: number;
  thumbHeightPhone: number;
  sizes: string[];
  optionLegend: string;
  variants: ProductVariant[];
  url: string;
}

export interface LookPin {
  index: number;
  product: string;
  left: string;
  top: string;
}

export interface LookItemRef {
  productId: string;
  tag?: string;
}

export interface LookData {
  index: number;
  lookNum: string; // "01", "02", ...
  name: string;
  key: string;
  description: string;
  model640: string;
  model1080: string;
  probe: string;
  pins: LookPin[];
  items: LookItemRef[];
}

function createFitProducts(): Record<string, ProductItem> {
  const products: Record<string, ProductItem> = {};
  
  const itemSpecs: Record<string, { name: string; price: number; type: string }> = {
    'fit-1-shirt': { name: 'Charcoal Heavy Knit Crew', price: 28.9, type: 'Heavyweight Knit' },
    'fit-1-pants': { name: 'Vintage Washed Relaxed Denim', price: 34.9, type: 'Selvedge Denim' },
    'fit-1-shoes': { name: 'Nike Orbit Agility Low', price: 36.9, type: 'Kinetic Footwear' },

    'fit-2-shirt': { name: 'Combed Organic Boxy Tee', price: 15.9, type: 'Organic Jersey' },
    'fit-2-pants': { name: 'Easy Straight Leg Chino', price: 24.9, type: 'Daily Tailoring' },
    'fit-2-shoes': { name: "Air Force 1 '07 Retro", price: 39.9, type: 'Classic Footwear' },

    'fit-3-shirt': { name: 'Technical Mock Neck Longsleeve', price: 22.9, type: 'Performance Knit' },
    'fit-3-pants': { name: 'Pleated Tailored Trouser', price: 32.9, type: 'Architectural Pleat' },
    'fit-3-shoes': { name: 'Nike Pegasus Runway Edition', price: 42.9, type: 'Performance Runner' },

    'fit-4-shirt': { name: 'French Terry Zip Overshirt', price: 31.9, type: 'Layering Outerwear' },
    'fit-4-pants': { name: 'Architectural Cargo Pants', price: 29.9, type: 'Technical Cargo' },
    'fit-4-shoes': { name: 'Nike Dunk Low Grey Fog', price: 38.9, type: 'Low Silhouette' },

    'fit-5-shirt': { name: 'Minimalist Boxy Heavy Tee', price: 16.9, type: 'Drop Shoulder Tee' },
    'fit-5-pants': { name: 'Relaxed Nylon Track Pant', price: 26.9, type: 'Technical Track' },
    'fit-5-shoes': { name: 'Nike Air Max Triple Black', price: 44.9, type: 'Air Cushion Footwear' },

    'fit-6-shirt': { name: 'Layered Atelier Poplin Shirt', price: 27.9, type: 'Tailored Poplin' },
    'fit-6-pants': { name: 'Heavyweight Carpenter Denim', price: 36.9, type: 'Workwear Denim' },
    'fit-6-shoes': { name: 'Handcrafted Heritage Lug Boot', price: 59.9, type: 'Leather Footwear' },
  };

  for (let fit = 1; fit <= 6; fit += 1) {
    for (const [type, suffix, optionLegend, sizes] of [
      ['shirt', 2, 'Size', ['S', 'M', 'L', 'XL']],
      ['pants', 3, 'Size', ['S', 'M', 'L', 'XL']],
      ['shoes', 4, 'Shoe size', ['40', '41', '42', '43', '44', '45', '46']],
    ] as const) {
      const id = `fit-${fit}-${type}`;
      const spec = itemSpecs[id];
      const variantStart = 70000000000000 + fit * 1000 + suffix * 100;
      products[id] = {
        id,
        name: spec?.name || `Fit ${fit} ${type[0].toUpperCase()}${type.slice(1)}`,
        type: spec?.type || `Fit ${fit} lookbook`,
        vendor: 'Nike',
        price: spec?.price ?? (type === 'shoes' ? 39.9 : type === 'pants' ? 24.9 : 19.9),
        image: `/assets/fit-${fit}-${type}.webp`,
        width: type === 'shoes' ? 600 : 400,
        height: type === 'shoes' ? 801 : 536,
        thumbHeightPhone: type === 'shoes' ? 160 : 214,
        sizes: [...sizes],
        optionLegend,
        variants: sizes.map((size, index) => ({ id: variantStart + index, a: true, o: [size] })),
        url: `#product?id=${id}`,
      };
    }
  }

  return products;
}

export const PRODUCTS: Record<string, ProductItem> = {
  'tatum-5-orbit-copy': {
    id: 'tatum-5-orbit-copy',
    name: 'Air Jordan 12 Retro',
    type: 'From the original lookbook',
    vendor: 'Nikey | Password: 1',
    price: 39.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit-copy.webp',
    width: 400,
    height: 400,
    thumbHeightPhone: 160,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    optionLegend: 'Shoe size',
    variants: [
      { id: 57015167025457, a: true, o: ['40'] },
      { id: 57015167058225, a: true, o: ['41'] },
      { id: 57015167090993, a: true, o: ['42'] },
      { id: 57015167123761, a: true, o: ['43'] },
      { id: 57015167156529, a: true, o: ['44'] },
      { id: 57015167189297, a: true, o: ['45'] },
      { id: 57015167222065, a: true, o: ['46'] },
    ],
    url: '#product?id=tatum-5-orbit-copy',
  },
  tshirt: {
    id: 'tshirt',
    name: 'Tshirt',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 19.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tshirt.webp',
    width: 400,
    height: 563,
    thumbHeightPhone: 225,
    sizes: ['S', 'L', 'M', 'XL'],
    optionLegend: 'Size',
    variants: [
      { id: 56835911582001, a: true, o: ['S'] },
      { id: 56835911614769, a: true, o: ['L'] },
      { id: 56835911647537, a: true, o: ['M'] },
      { id: 56835911680305, a: true, o: ['XL'] },
    ],
    url: '#product?id=tshirt',
  },
  sweatshirt: {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 19.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt.webp',
    width: 400,
    height: 581,
    thumbHeightPhone: 232,
    sizes: ['S', 'L', 'M', 'XL'],
    optionLegend: 'Size',
    variants: [
      { id: 56835806396721, a: true, o: ['S'] },
      { id: 56835806429489, a: true, o: ['L'] },
      { id: 56835806462257, a: true, o: ['M'] },
      { id: 56835806495025, a: true, o: ['XL'] },
    ],
    url: '#product?id=sweatshirt',
  },
  'tatum-5-orbit': {
    id: 'tatum-5-orbit',
    name: 'Tatum 5 Orbit',
    type: 'From the original lookbook',
    vendor: 'Nikey | Password: 1',
    price: 39.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit.webp',
    width: 400,
    height: 400,
    thumbHeightPhone: 160,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    optionLegend: 'Shoe size',
    variants: [
      { id: 57015166730545, a: true, o: ['40'] },
      { id: 57015166763313, a: true, o: ['41'] },
      { id: 57015166796081, a: true, o: ['42'] },
      { id: 57015166828849, a: true, o: ['43'] },
      { id: 57015166861617, a: true, o: ['44'] },
      { id: 57015166894385, a: true, o: ['45'] },
      { id: 57015166927153, a: true, o: ['46'] },
    ],
    url: '#product?id=tatum-5-orbit',
  },
  'hoodie-black': {
    id: 'hoodie-black',
    name: 'Hoodie Black',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 19.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-hoodie-black.webp',
    width: 400,
    height: 536,
    thumbHeightPhone: 214,
    sizes: ['S', 'L', 'M', 'XL'],
    optionLegend: 'Size',
    variants: [
      { id: 56836251681073, a: true, o: ['S'] },
      { id: 56836251713841, a: true, o: ['L'] },
      { id: 56836251746609, a: true, o: ['M'] },
      { id: 56836251779377, a: true, o: ['XL'] },
    ],
    url: '#product?id=hoodie-black',
  },
  'sweatshirt-plus': {
    id: 'sweatshirt-plus',
    name: 'Sweatshirt Plus',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 19.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt-plus.webp',
    width: 400,
    height: 610,
    thumbHeightPhone: 244,
    sizes: ['S', 'L', 'M', 'XL'],
    optionLegend: 'Size',
    variants: [
      { id: 56836143743281, a: true, o: ['S'] },
      { id: 56836143776049, a: true, o: ['L'] },
      { id: 56836143808817, a: true, o: ['M'] },
      { id: 56836143841585, a: true, o: ['XL'] },
    ],
    url: '#product?id=sweatshirt-plus',
  },
  hoodie: {
    id: 'hoodie',
    name: 'Hoodie',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 19.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-hoodie.webp',
    width: 400,
    height: 555,
    thumbHeightPhone: 222,
    sizes: ['S', 'L', 'M', 'XL'],
    optionLegend: 'Size',
    variants: [
      { id: 56836002185521, a: true, o: ['S'] },
      { id: 56836002218289, a: true, o: ['L'] },
      { id: 56836002251057, a: true, o: ['M'] },
      { id: 56836002283825, a: true, o: ['XL'] },
    ],
    url: '#product?id=hoodie',
  },
  'air-jordan-12-retro-copy': {
    id: 'air-jordan-12-retro-copy',
    name: 'Luka 5',
    type: 'From the original lookbook',
    vendor: 'Nikey | Password: 1',
    price: 39.9,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-air-jordan-12-retro-copy.webp',
    width: 400,
    height: 400,
    thumbHeightPhone: 160,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    optionLegend: 'Shoe size',
    variants: [
      { id: 57015176364337, a: true, o: ['40'] },
      { id: 57015176397105, a: true, o: ['41'] },
      { id: 57015176429873, a: true, o: ['42'] },
      { id: 57015176462641, a: true, o: ['43'] },
      { id: 57015176495409, a: true, o: ['44'] },
      { id: 57015176528177, a: true, o: ['45'] },
      { id: 57015176560945, a: true, o: ['46'] },
    ],
    url: '#product?id=air-jordan-12-retro-copy',
  },
  ...createFitProducts(),
};

export const LOOKS: LookData[] = [
  {
    index: 0,
    lookNum: '01',
    name: 'The City Edit',
    key: 'bndthK',
    description: 'A charcoal knit and easy denim.',
    model640: '/assets/fit-1-model.webp',
    model1080: '/assets/fit-1-model.webp',
    probe: '/assets/fit-1-model.webp',
    pins: [
      { index: 1, product: 'Charcoal Heavy Knit Crew', left: '48%', top: '48%' },
      { index: 2, product: 'Vintage Washed Relaxed Denim', left: '48%', top: '70%' },
      { index: 3, product: 'Nike Orbit Agility Low', left: '48%', top: '91%' },
    ],
    items: [
      { productId: 'fit-1-shirt' },
      { productId: 'fit-1-pants' },
      { productId: 'fit-1-shoes' },
    ],
  },
  {
    index: 1,
    lookNum: '02',
    name: 'Gallery Opening',
    key: 'XckgG6',
    description: 'A clean white tee and relaxed denim.',
    model640: '/assets/fit-2-model.webp',
    model1080: '/assets/fit-2-model.webp',
    probe: '/assets/fit-2-model.webp',
    pins: [
      { index: 1, product: 'Combed Organic Boxy Tee', left: '48%', top: '48%' },
      { index: 2, product: 'Easy Straight Leg Chino', left: '48%', top: '70%' },
      { index: 3, product: "Air Force 1 '07 Retro", left: '48%', top: '91%' },
    ],
    items: [
      { productId: 'fit-2-shirt' },
      { productId: 'fit-2-pants' },
      { productId: 'fit-2-shoes' },
    ],
  },
  {
    index: 2,
    lookNum: '03',
    name: 'Gallery Opening',
    key: 'rLfAhC',
    description: 'Olive knitwear. A grounded palette.',
    model640: '/assets/fit-3-model.webp',
    model1080: '/assets/fit-3-model.webp',
    probe: '/assets/fit-3-model.webp',
    pins: [
      { index: 1, product: 'Technical Mock Neck Longsleeve', left: '48%', top: '48%' },
      { index: 2, product: 'Pleated Tailored Trouser', left: '48%', top: '70%' },
      { index: 3, product: 'Nike Pegasus Runway Edition', left: '48%', top: '91%' },
    ],
    items: [
      { productId: 'fit-3-shirt' },
      { productId: 'fit-3-pants' },
      { productId: 'fit-3-shoes' },
    ],
  },
  {
    index: 3,
    lookNum: '04',
    name: 'Studio Day',
    key: 'FKg67q',
    description: 'Black, white and laid-back denim.',
    model640: '/assets/fit-4-model.webp',
    model1080: '/assets/fit-4-model.webp',
    probe: '/assets/fit-4-model.webp',
    pins: [
      { index: 1, product: 'French Terry Zip Overshirt', left: '48%', top: '48%' },
      { index: 2, product: 'Architectural Cargo Pants', left: '48%', top: '70%' },
      { index: 3, product: 'Nike Dunk Low Grey Fog', left: '48%', top: '91%' },
    ],
    items: [
      { productId: 'fit-4-shirt' },
      { productId: 'fit-4-pants' },
      { productId: 'fit-4-shoes' },
    ],
  },
  {
    index: 4,
    lookNum: '05',
    name: 'Studio Day',
    key: '8KREEE',
    description: 'Burgundy layers. A tailored perspective.',
    model640: '/assets/fit-5-model.webp',
    model1080: '/assets/fit-5-model.webp',
    probe: '/assets/fit-5-model.webp',
    pins: [
      { index: 1, product: 'Minimalist Boxy Heavy Tee', left: '48%', top: '48%' },
      { index: 2, product: 'Relaxed Nylon Track Pant', left: '48%', top: '70%' },
      { index: 3, product: 'Nike Air Max Triple Black', left: '48%', top: '91%' },
    ],
    items: [
      { productId: 'fit-5-shirt' },
      { productId: 'fit-5-pants' },
      { productId: 'fit-5-shoes' },
    ],
  },
  {
    index: 5,
    lookNum: '06',
    name: 'Studio Day',
    key: 'N3bfm9',
    description: 'A grey crew and your favourite denim.',
    model640: '/assets/fit-6-model.webp',
    model1080: '/assets/fit-6-model.webp',
    probe: '/assets/fit-6-model.webp',
    pins: [
      { index: 1, product: 'Layered Atelier Poplin Shirt', left: '48%', top: '48%' },
      { index: 2, product: 'Heavyweight Carpenter Denim', left: '48%', top: '70%' },
      { index: 3, product: 'Handcrafted Heritage Lug Boot', left: '48%', top: '91%' },
    ],
    items: [
      { productId: 'fit-6-shirt' },
      { productId: 'fit-6-pants' },
      { productId: 'fit-6-shoes' },
    ],
  },
];
