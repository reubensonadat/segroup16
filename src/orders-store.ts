/**
 * Orders Store for Runway Clothing Brand
 * Persists orders placed via checkout to localStorage
 */

export interface OrderItem {
  id: number;
  productId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CustomerInfo {
  fullName: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    mapsUrl?: string;
  };
  fulfillment?: 'pickup' | 'delivery';
}

export type OrderStatus =
  | 'Processing'
  | 'Shipped'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Ready for Pickup'
  | 'Delivered'
  | 'Collected'
  | 'Cancelled';

export interface Order {
  id: string;
  createdAt: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  bundleDiscount?: number;
  bundleName?: string;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
}

const ORDERS_STORAGE_KEY = 'runway-orders-v1';

/**
 * Demo seed orders — realistic Greater Accra customers, local runway products,
 * and statuses that are coherent with each order's age and fulfillment method:
 * newest order still Processing, pickup order waiting at the hub, yesterday's
 * courier dispatch In Transit, and the oldest order fully Delivered.
 */
const SEED_ORDERS: Order[] = [
  {
    id: 'RNW-1042',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    customer: {
      fullName: 'Ama Serwaa Boateng',
      phone: '024 555 0182',
      street: 'GPS: 5.5632, -0.1836',
      city: 'East Legon, Accra',
      country: 'Ghana',
      fulfillment: 'delivery',
    },
    items: [
      {
        id: 920110441,
        productId: 'fit-1-shirt',
        name: 'Charcoal Heavy Knit Crew',
        size: 'M',
        price: 28.9,
        quantity: 1,
        image: '/assets/fit-1-shirt.webp',
      },
    ],
    subtotal: 28.9,
    shipping: 0.0,
    tax: 0.0,
    total: 28.9,
    status: 'Processing',
    paymentMethod: 'Mobile Money (MTN MoMo)',
  },
  {
    id: 'RNW-1017',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(), // 3.5 hours ago
    customer: {
      fullName: 'Kwesi Mensah',
      phone: '020 411 7723',
      street: 'Osu Oxford Street Hub',
      city: 'Accra',
      country: 'Ghana',
      fulfillment: 'pickup',
    },
    items: [
      {
        id: 920110442,
        productId: 'fit-2-shirt',
        name: 'Combed Organic Boxy Tee',
        size: 'L',
        price: 15.9,
        quantity: 1,
        image: '/assets/fit-2-shirt.webp',
      },
      {
        id: 920110443,
        productId: 'fit-2-pants',
        name: 'Easy Straight Leg Chino',
        size: '32',
        price: 24.9,
        quantity: 1,
        image: '/assets/fit-2-pants.webp',
      },
    ],
    subtotal: 40.8,
    bundleDiscount: 4.08,
    bundleName: 'Look 02 — Gallery Opening',
    shipping: 0.0,
    tax: 0.0,
    total: 36.72,
    status: 'Ready for Pickup',
    paymentMethod: 'Mobile Money (Telecel Cash)',
  },
  {
    id: 'RNW-0984',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
    customer: {
      fullName: 'Naa Adjeley Quaye',
      phone: '055 290 6614',
      street: '12 Bamboo Ave, Airport Residential',
      city: 'Accra',
      country: 'Ghana',
      fulfillment: 'delivery',
    },
    items: [
      {
        id: 920110444,
        productId: 'fit-3-shirt',
        name: 'Technical Mock Neck Longsleeve',
        size: 'L',
        price: 22.9,
        quantity: 1,
        image: '/assets/fit-3-shirt.webp',
      },
      {
        id: 920110445,
        productId: 'fit-3-shoes',
        name: 'Nike Pegasus Runway Edition',
        size: '42',
        price: 42.9,
        quantity: 1,
        image: '/assets/fit-3-shoes.webp',
      },
    ],
    subtotal: 65.8,
    shipping: 3.5,
    tax: 0.0,
    total: 69.3,
    status: 'In Transit',
    paymentMethod: 'Mobile Money (MTN MoMo)',
  },
  {
    id: 'RNW-0921',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 62).toISOString(), // ~2.5 days ago
    customer: {
      fullName: 'Yaw Owusu-Ansah',
      phone: '027 833 4409',
      street: '5 Thurston Gardens, Cantonments',
      city: 'Accra',
      country: 'Ghana',
      fulfillment: 'delivery',
    },
    items: [
      {
        id: 920110446,
        productId: 'fit-5-pants',
        name: 'Relaxed Nylon Track Pant',
        size: '34',
        price: 26.9,
        quantity: 1,
        image: '/assets/fit-5-pants.webp',
      },
    ],
    subtotal: 26.9,
    shipping: 0.0,
    tax: 0.0,
    total: 26.9,
    status: 'Delivered',
    paymentMethod: 'Mobile Money (AT Money)',
  },
];

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      // Seed initial sample orders
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(SEED_ORDERS));
      return SEED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_ORDERS;
  } catch {
    return SEED_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to localStorage', e);
  }
}

export function createOrder(
  customer: CustomerInfo,
  items: OrderItem[],
  subtotal: number,
  shipping = 0,
  tax = 0,
  paymentMethod = 'Credit Card',
  bundleDiscount = 0,
  bundleName?: string
): Order {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const total = Math.max(0, Math.round((subtotal - bundleDiscount + shipping + tax) * 100) / 100);
  const newOrder: Order = {
    id: `RNW-${randomNum}`,
    createdAt: new Date().toISOString(),
    customer,
    items,
    subtotal,
    bundleDiscount: bundleDiscount > 0 ? bundleDiscount : undefined,
    bundleName,
    shipping,
    tax,
    total,
    status: 'Processing',
    paymentMethod,
  };

  const existing = getOrders();
  const updated = [newOrder, ...existing];
  saveOrders(updated);
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): boolean {
  const orders = getOrders();
  const target = orders.find((o) => o.id === orderId);
  if (!target) return false;
  target.status = status;
  saveOrders(orders);
  return true;
}

export function resetOrdersToSeed(): Order[] {
  saveOrders(SEED_ORDERS);
  return SEED_ORDERS;
}

export function getOrderStats() {
  const orders = getOrders();
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const processingCount = orders.filter((o) => o.status === 'Processing').length;
  const inProgressCount = orders.filter((o) =>
    ['Shipped', 'In Transit', 'Out for Delivery', 'Ready for Pickup'].includes(o.status)
  ).length;
  const completedCount = orders.filter((o) => o.status === 'Delivered' || o.status === 'Collected').length;

  return {
    totalRevenue,
    totalOrders,
    aov,
    processingCount,
    shippedCount: inProgressCount,
    deliveredCount: completedCount,
  };
}
