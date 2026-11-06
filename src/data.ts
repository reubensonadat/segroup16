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
  const cardNameOverrides: Record<string, string> = {};

  for (let fit = 1; fit <= 6; fit += 1) {
    for (const [type, suffix, optionLegend, sizes] of [
      ['shirt', 2, 'Size', ['S', 'M', 'L', 'XL']],
      ['pants', 3, 'Size', ['S', 'M', 'L', 'XL']],
      ['shoes', 4, 'Shoe size', ['40', '41', '42', '43', '44', '45', '46']],
    ] as const) {
      const id = `fit-${fit}-${type}`;
      const variantStart = 70000000000000 + fit * 1000 + suffix * 100;
      products[id] = {
        id,
        name: cardNameOverrides[id] || `Fit ${fit} ${type[0].toUpperCase()}${type.slice(1)}`,
        type: `Fit ${fit} lookbook`,
        vendor: 'Nike',
        price: type === 'shoes' ? 39.9 : type === 'pants' ? 24.9 : 19.9,
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
      { index: 1, product: 'Fit 1 Shirt', left: '48%', top: '48%' },
      { index: 2, product: 'Fit 1 Pants', left: '48%', top: '70%' },
      { index: 3, product: 'Fit 1 Shoes', left: '48%', top: '91%' },
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
      { index: 1, product: 'Fit 2 Shirt', left: '48%', top: '48%' },
      { index: 2, product: 'Fit 2 Pants', left: '48%', top: '70%' },
      { index: 3, product: 'Fit 2 Shoes', left: '48%', top: '91%' },
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
      { index: 1, product: 'Fit 3 Shirt', left: '48%', top: '48%' },
      { index: 2, product: 'Fit 3 Pants', left: '48%', top: '70%' },
      { index: 3, product: 'Fit 3 Shoes', left: '48%', top: '91%' },
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
      { index: 1, product: 'Fit 4 Shirt', left: '48%', top: '48%' },
      { index: 2, product: 'Fit 4 Pants', left: '48%', top: '70%' },
      { index: 3, product: 'Fit 4 Shoes', left: '48%', top: '91%' },
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
      { index: 1, product: 'Fit 5 Shirt', left: '48%', top: '48%' },
      { index: 2, product: 'Fit 5 Pants', left: '48%', top: '70%' },
      { index: 3, product: 'Fit 5 Shoes', left: '48%', top: '91%' },
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
      { index: 1, product: 'Fit 6 Shirt', left: '48%', top: '48%' },
      { index: 2, product: 'Fit 6 Pants', left: '48%', top: '70%' },
      { index: 3, product: 'Fit 6 Shoes', left: '48%', top: '91%' },
    ],
    items: [
      { productId: 'fit-6-shirt' },
      { productId: 'fit-6-pants' },
      { productId: 'fit-6-shoes' },
    ],
  },
];
