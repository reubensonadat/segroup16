import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  wrapN,
  shortestIndexDelta,
  computeRingSlot,
  computeClassicSlot,
  validateBagItems,
  addToBag,
  generateShortlistText,
} from './runway-logic';

test('clamp constraints', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});

test('wrapN wraps positive and negative', () => {
  assert.equal(wrapN(0, 12), 0);
  assert.equal(wrapN(12, 12), 0);
  assert.equal(wrapN(13, 12), 1);
  assert.equal(wrapN(-1, 12), 11);
  assert.equal(wrapN(-13, 12), 11);
});

test('shortestIndexDelta finds direct path around loop', () => {
  assert.equal(shortestIndexDelta(1, 0, 6), 1);
  assert.equal(shortestIndexDelta(5, 0, 6), -1);
  assert.equal(shortestIndexDelta(4, 0, 6), -2);
  assert.equal(shortestIndexDelta(3, 0, 6), 3);
  assert.equal(shortestIndexDelta(2, 5, 6), 3);
  assert.equal(shortestIndexDelta(1, 5, 6), 2);
});

test('computeRingSlot gives front slot coordinates on desktop', () => {
  const W = 1000;
  const H = 800;
  const slot0 = computeRingSlot(0, 0, W, H, false, 1.08, false);
  assert.equal(slot0.phi, 0);
  assert.equal(slot0.z, 0);
  assert.equal(slot0.persp, 1);
  assert.equal(slot0.sl, 0);
  assert.equal(Math.round(slot0.scale * 1000) / 1000, 1.08);
  assert.equal(slot0.x, 500);
  assert.equal(slot0.bottom, 34);
  assert.equal(slot0.blur, 0);
  assert.equal(slot0.opacity, 1);
  assert.equal(slot0.zIndex, 1080);

  // At rest, still = true hides front model body because hero takes over
  const slot0Still = computeRingSlot(0, 0, W, H, false, 1.08, true);
  assert.equal(slot0Still.opacity, 0);
});

test('computeClassicSlot gives phone slot line coordinates', () => {
  const W = 375;
  const slot0 = computeClassicSlot(0, W, false);
  assert.equal(slot0.x, 375 * 0.3);
  assert.equal(slot0.bottom, 22);
  assert.equal(slot0.scale, 1);
  assert.equal(slot0.opacity, 1);
  assert.equal(slot0.blur, 0);

  const slot1 = computeClassicSlot(1, W, false);
  assert.equal(slot1.x, 375 * (0.3 + 0.32));
  assert.equal(slot1.bottom, 44);
  assert.equal(slot1.scale, 0.76);
  assert.equal(slot1.opacity, 0.87);
  assert.equal(slot1.blur, 0.9);
});

test('validateBagItems filters safe entries and caps quantities', () => {
  const raw = [
    { id: 57015167025457, quantity: 1 },
    { id: 'bad', quantity: 2 },
    { id: 123, quantity: 99 }, // out of bounds
    { id: 456, quantity: -1 },
    null,
    { id: 56835911582001, quantity: 3.5 },
  ];
  const validated = validateBagItems(raw);
  assert.equal(validated.length, 2);
  assert.deepEqual(validated[0], { id: 57015167025457, quantity: 1 });
  assert.deepEqual(validated[1], { id: 56835911582001, quantity: 3 });
});

test('addToBag increments existing and pushes new up to 20 per item', () => {
  const initial = [{ id: 100, quantity: 19 }];
  const updated = addToBag(initial, [
    { id: 100, quantity: 5 }, // should cap at 20
    { id: 200, quantity: 2 },
  ]);
  assert.equal(updated.length, 2);
  assert.equal(updated[0].quantity, 20);
  assert.equal(updated[1].id, 200);
  assert.equal(updated[1].quantity, 2);
});

test('generateShortlistText creates formatted export text', () => {
  const text = generateShortlistText([
    {
      name: 'Air Jordan 12 Retro',
      size: '42',
      quantity: 1,
      url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit-copy',
    },
  ]);
  assert.match(text, /RUNWAY — STYLING SHORTLIST/);
  assert.match(text, /Air Jordan 12 Retro · Size 42 · Quantity 1/);
  assert.match(text, /https:\/\/nike-makknzjs\.myshopify\.com\/products\/tatum-5-orbit-copy/);
});
