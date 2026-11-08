import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBundleDiscountPercent,
  setBundleDiscountPercent,
  getBundleDiscountForLook,
  setBundleDiscountForLook,
  analyzeCartBundles,
} from './bundle-store';
import { PRODUCTS } from './data';
import { toGhs } from './currency';

test('getBundleDiscountPercent and setBundleDiscountPercent persist correctly', () => {
  // Reset or set test rate
  setBundleDiscountPercent(15);
  assert.strictEqual(getBundleDiscountPercent(), 15);

  setBundleDiscountPercent(10);
  assert.strictEqual(getBundleDiscountPercent(), 10);
});

test('analyzeCartBundles returns 0 discount when items do not form a complete 3-piece look', () => {
  // Only a shirt and a pair of pants from look 1
  const shirtVariant = PRODUCTS['fit-1-shirt'].variants[0].id;
  const pantsVariant = PRODUCTS['fit-1-pants'].variants[0].id;

  const result = analyzeCartBundles([
    { id: shirtVariant, quantity: 1 },
    { id: pantsVariant, quantity: 1 },
  ]);

  assert.strictEqual(result.bundles.length, 0);
  assert.strictEqual(result.totalBundleDiscountGhs, 0);
  assert.strictEqual(result.bundledVariantIds.size, 0);
});

test('analyzeCartBundles automatically detects complete 3-piece look bundle and applies discount', () => {
  setBundleDiscountPercent(10);

  const shirtVariant = PRODUCTS['fit-1-shirt'].variants[0].id;
  const pantsVariant = PRODUCTS['fit-1-pants'].variants[0].id;
  const shoesVariant = PRODUCTS['fit-1-shoes'].variants[0].id;

  const result = analyzeCartBundles([
    { id: shirtVariant, quantity: 1 },
    { id: pantsVariant, quantity: 1 },
    { id: shoesVariant, quantity: 1 },
  ]);

  assert.strictEqual(result.bundles.length, 1);
  assert.strictEqual(result.bundles[0].lookName, 'The City Edit');
  assert.strictEqual(result.bundles[0].bundleCount, 1);
  assert.strictEqual(result.bundles[0].discountPercent, 10);

  const expectedRegularGhs =
    toGhs(PRODUCTS['fit-1-shirt'].price) +
    toGhs(PRODUCTS['fit-1-pants'].price) +
    toGhs(PRODUCTS['fit-1-shoes'].price);

  assert.strictEqual(result.bundles[0].totalRegularGhs, expectedRegularGhs);
  const expectedDiscountGhs = Math.round(expectedRegularGhs * 0.1 * 100) / 100;
  assert.strictEqual(result.totalBundleDiscountGhs, expectedDiscountGhs);
  assert.strictEqual(result.bundledVariantIds.has(shirtVariant), true);
  assert.strictEqual(result.bundledVariantIds.has(pantsVariant), true);
  assert.strictEqual(result.bundledVariantIds.has(shoesVariant), true);
});

test('analyzeCartBundles applies per-look discount overrides when configured', () => {
  setBundleDiscountPercent(10); // Global default 10%
  setBundleDiscountForLook(1, 25); // Look 1 override: 25%

  const shirtVariant = PRODUCTS['fit-1-shirt'].variants[0].id;
  const pantsVariant = PRODUCTS['fit-1-pants'].variants[0].id;
  const shoesVariant = PRODUCTS['fit-1-shoes'].variants[0].id;

  const result = analyzeCartBundles([
    { id: shirtVariant, quantity: 1 },
    { id: pantsVariant, quantity: 1 },
    { id: shoesVariant, quantity: 1 },
  ]);

  assert.strictEqual(result.bundles.length, 1);
  assert.strictEqual(result.bundles[0].discountPercent, 25);

  const expectedRegularGhs =
    toGhs(PRODUCTS['fit-1-shirt'].price) +
    toGhs(PRODUCTS['fit-1-pants'].price) +
    toGhs(PRODUCTS['fit-1-shoes'].price);

  const expectedDiscountGhs = Math.round(expectedRegularGhs * 0.25 * 100) / 100;
  assert.strictEqual(result.totalBundleDiscountGhs, expectedDiscountGhs);

  // Clean up override
  setBundleDiscountForLook(1, null);
});


