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
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
}

const ORDERS_STORAGE_KEY = 'runway-orders-v1';

const SEED_ORDERS: Order[] = [
  {
    id: 'RNW-5299',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 mins ago
    customer: {
      fullName: 'Reubenson Adat',
      phone: '0243270509',
      street: 'GPS: 5.11538, -1.30110',
      city: 'Accra',
      country: 'Ghana',
      fulfillment: 'delivery',
    },
    items: [
      {
        id: 57015167090993,
        productId: 'tatum-5-orbit-copy',
        name: 'Air Jordan 12 Retro',
        size: '40',
        price: 39.9,
        quantity: 1,
        image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit-copy.webp',
      },
    ],
    subtotal: 39.9,
    shipping: 0.0,
    tax: 0.0,
    total: 39.9,
    status: 'Delivered',
    paymentMethod: 'Mobile Money (MTN MoMo)',
  },
  {
    id: 'RNW-9284',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    customer: {
      fullName: 'Marcus Vance',
      email: 'm.vance@studio.design',
      street: '48 Mercer St, Apt 4B',
      city: 'New York, NY',
      postalCode: '10013',
      country: 'United States',
      fulfillment: 'delivery',
    },
    items: [
      {
        id: 57015167090993,
        productId: 'tatum-5-orbit-copy',
        name: 'Air Jordan 12 Retro',
        size: '42',
        price: 149.0,
        quantity: 1,
        image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit-copy.webp',
      },
      {
        id: 56835806462257,
        productId: 'sweatshirt',
        name: 'Sweatshirt',
        size: 'M',
        price: 199.0,
        quantity: 1,
        image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt.webp',
      },
    ],
    subtotal: 348.0,
    shipping: 0.0,
    tax: 27.84,
    total: 375.84,
    status: 'Processing',
    paymentMethod: 'Apple Pay (•••• 9021)',
  },
  {
    id: 'RNW-8841',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(), // 3.5 hours ago
    customer: {
      fullName: 'Aaliyah Chen',
      email: 'aaliyah.chen@format.io',
      street: '1200 S Grand Ave',
      city: 'Los Angeles, CA',
      postalCode: '90015',
      country: 'United States',
      fulfillment: 'delivery',
    },
    items: [
      {
        id: 57015166796081,
        productId: 'tatum-5-orbit',
        name: 'Tatum 5 Orbit',
        size: '42',
        price: 149.0,
        quantity: 1,
        image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit.webp',
      },
      {
        id: 56836251713841,
        productId: 'hoodie-black',
        name: 'Hoodie Black',
        size: 'L',
        price: 199.0,
        quantity: 1,
        image: 'https://reel-ref-try-the-look.vercel.app/assets/source-hoodie-black.webp',
      },
      {
        id: 56835911614769,
        productId: 'tshirt',
        name: 'Tshirt',
        size: 'L',
        price: 199.0,
        quantity: 1,
        image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tshirt.webp',
      },
    ],
    subtotal: 547.0,
    shipping: 0.0,
    tax: 43.76,
    total: 590.76,
    status: 'Out for Delivery',
    paymentMethod: 'Visa (•••• 4419)',
  },
  {
    id: 'RNW-7319',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
    customer: {
      fullName: 'Stefan Kowalski',
      email: 'stefan.k@nordic.de',
      street: 'Accra Mall Boutique Front Desk',
      city: 'Accra',
      country: 'Ghana',
      fulfillment: 'pickup',
    },
    items: [
      {
        id: 56836143808817,
        productId: 'sweatshirt-plus',
        name: 'Sweatshirt Plus',
        size: 'M',
        price: 199.0,
        quantity: 1,
        image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt-plus.webp',
      },
    ],
    subtotal: 199.0,
    shipping: 0.0,
    tax: 15.92,
    total: 214.92,
    status: 'Ready for Pickup',
    paymentMethod: 'Mastercard (•••• 8102)',
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
  paymentMethod = 'Credit Card'
): Order {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newOrder: Order = {
    id: `RNW-${randomNum}`,
    createdAt: new Date().toISOString(),
    customer,
    items,
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
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
