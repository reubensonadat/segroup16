import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOrders,
  saveOrders,
  createOrder,
  updateOrderStatus,
  getOrderStats,
  Order,
} from './orders-store';

// Mock localStorage in node environment if needed
const mockStore: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStore[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStore[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
  },
  key: (i: number) => Object.keys(mockStore)[i] ?? null,
  length: 0,
};

test('orders store seeds initial orders when empty', () => {
  localStorage.clear();
  const orders = getOrders();
  assert.ok(orders.length >= 3);
  assert.equal(orders[0].id.startsWith('RNW-'), true);
});

test('createOrder calculates total and prepends to orders', () => {
  const customer = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    street: '123 Main St',
    city: 'Seattle',
    postalCode: '98101',
    country: 'USA',
  };
  const items = [
    {
      id: 123456,
      productId: 'tshirt',
      name: 'Tshirt',
      size: 'M',
      price: 199.0,
      quantity: 1,
      image: 'test.webp',
    },
  ];

  const order = createOrder(customer, items, 199.0, 0, 15.92, 'Card');
  assert.ok(order.id.startsWith('RNW-'));
  assert.equal(order.status, 'Processing');
  assert.equal(order.total, 214.92);

  const all = getOrders();
  assert.equal(all[0].id, order.id);
});

test('updateOrderStatus changes order status correctly', () => {
  const orders = getOrders();
  const firstId = orders[0].id;
  const success = updateOrderStatus(firstId, 'Shipped');
  assert.equal(success, true);

  const updated = getOrders();
  assert.equal(updated[0].status, 'Shipped');
});

test('getOrderStats calculates accurate metrics', () => {
  const stats = getOrderStats();
  assert.ok(stats.totalOrders >= 1);
  assert.ok(stats.totalRevenue > 0);
  assert.equal(Math.round(stats.aov), Math.round(stats.totalRevenue / stats.totalOrders));
});
