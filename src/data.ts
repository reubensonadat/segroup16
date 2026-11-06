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

export const PRODUCTS: Record<string, ProductItem> = {
  'tatum-5-orbit-copy': {
    id: 'tatum-5-orbit-copy',
    name: 'Air Jordan 12 Retro',
    type: 'From the original lookbook',
    vendor: 'Nikey | Password: 1',
    price: 149.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit-copy',
  },
  tshirt: {
    id: 'tshirt',
    name: 'Tshirt',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 199.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/tshirt',
  },
  sweatshirt: {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 199.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt',
  },
  'tatum-5-orbit': {
    id: 'tatum-5-orbit',
    name: 'Tatum 5 Orbit',
    type: 'From the original lookbook',
    vendor: 'Nikey | Password: 1',
    price: 149.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit',
  },
  'hoodie-black': {
    id: 'hoodie-black',
    name: 'Hoodie Black',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 199.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/hoodie-black',
  },
  'sweatshirt-plus': {
    id: 'sweatshirt-plus',
    name: 'Sweatshirt Plus',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 199.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt-plus',
  },
  hoodie: {
    id: 'hoodie',
    name: 'Hoodie',
    type: 'From the original lookbook',
    vendor: 'Nike',
    price: 199.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/hoodie',
  },
  'air-jordan-12-retro-copy': {
    id: 'air-jordan-12-retro-copy',
    name: 'Luka 5',
    type: 'From the original lookbook',
    vendor: 'Nikey | Password: 1',
    price: 149.0,
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
    url: 'https://nike-makknzjs.myshopify.com/products/air-jordan-12-retro-copy',
  },
};

export const LOOKS: LookData[] = [
  {
    index: 0,
    lookNum: '01',
    name: 'The City Edit',
    key: 'bndthK',
    description: 'A charcoal knit and easy denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-1-640.webp',
    model1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-1.webp',
    probe: 'https://reel-ref-try-the-look.vercel.app/assets/model-1-640.webp',
    pins: [
      { index: 1, product: 'Air Jordan 12 Retro', left: '47%', top: '27%' },
      { index: 2, product: 'Tshirt', left: '48%', top: '58%' },
      { index: 3, product: 'Sweatshirt', left: '45%', top: '96%' },
    ],
    items: [
      { productId: 'tatum-5-orbit-copy' },
      { productId: 'tshirt' },
      { productId: 'sweatshirt' },
    ],
  },
  {
    index: 1,
    lookNum: '02',
    name: 'Gallery Opening',
    key: 'XckgG6',
    description: 'A clean white tee and relaxed denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-5-640.webp',
    model1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-5.webp',
    probe: 'https://reel-ref-try-the-look.vercel.app/assets/model-5-640.webp',
    pins: [
      { index: 1, product: 'Tatum 5 Orbit', left: '50%', top: '28%' },
      { index: 2, product: 'Hoodie Black', left: '48%', top: '58%' },
      { index: 3, product: 'Tshirt', left: '45%', top: '88%' },
    ],
    items: [
      { productId: 'tatum-5-orbit' },
      { productId: 'hoodie-black', tag: 'New' },
      { productId: 'tshirt' },
    ],
  },
  {
    index: 2,
    lookNum: '03',
    name: 'Gallery Opening',
    key: 'rLfAhC',
    description: 'Olive knitwear. A grounded palette.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-4-640.webp',
    model1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-4.webp',
    probe: 'https://reel-ref-try-the-look.vercel.app/assets/model-4-640.webp',
    pins: [
      { index: 1, product: 'Sweatshirt Plus', left: '50%', top: '28%' },
      { index: 2, product: 'Tatum 5 Orbit', left: '48%', top: '58%' },
      { index: 3, product: 'Tshirt', left: '45%', top: '88%' },
    ],
    items: [
      { productId: 'sweatshirt-plus' },
      { productId: 'tatum-5-orbit', tag: 'New' },
      { productId: 'tshirt' },
    ],
  },
  {
    index: 3,
    lookNum: '04',
    name: 'Studio Day',
    key: 'FKg67q',
    description: 'Black, white and laid-back denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-6-640.webp',
    model1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-6.webp',
    probe: 'https://reel-ref-try-the-look.vercel.app/assets/model-6-640.webp',
    pins: [
      { index: 1, product: 'Hoodie Black', left: '50%', top: '28%' },
      { index: 2, product: 'Air Jordan 12 Retro', left: '48%', top: '58%' },
      { index: 3, product: 'Tshirt', left: '45%', top: '88%' },
    ],
    items: [
      { productId: 'hoodie-black' },
      { productId: 'tatum-5-orbit-copy' },
      { productId: 'tshirt' },
    ],
  },
  {
    index: 4,
    lookNum: '05',
    name: 'Studio Day',
    key: '8KREEE',
    description: 'Burgundy layers. A tailored perspective.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-3-640.webp',
    model1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-3.webp',
    probe: 'https://reel-ref-try-the-look.vercel.app/assets/model-3-640.webp',
    pins: [
      { index: 1, product: 'Sweatshirt', left: '50%', top: '28%' },
      { index: 2, product: 'Tatum 5 Orbit', left: '48%', top: '58%' },
      { index: 3, product: 'Tshirt', left: '45%', top: '88%' },
    ],
    items: [
      { productId: 'sweatshirt' },
      { productId: 'tatum-5-orbit' },
      { productId: 'tshirt' },
    ],
  },
  {
    index: 5,
    lookNum: '06',
    name: 'Studio Day',
    key: 'N3bfm9',
    description: 'A grey crew and your favourite denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-2-640.webp',
    model1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-2.webp',
    probe: 'https://reel-ref-try-the-look.vercel.app/assets/model-2-640.webp',
    pins: [
      { index: 1, product: 'Hoodie', left: '50%', top: '28%' },
      { index: 2, product: 'Luka 5', left: '48%', top: '58%' },
      { index: 3, product: 'Tshirt', left: '45%', top: '88%' },
    ],
    items: [
      { productId: 'hoodie' },
      { productId: 'air-jordan-12-retro-copy' },
      { productId: 'tshirt' },
    ],
  },
];
