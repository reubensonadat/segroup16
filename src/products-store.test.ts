import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getManagedProducts,
  updateProductPricing,
  getFinancialOverview,
  getManagedRunwayLooks,
  addOrUpdateRunwayLook,
  getRunwayDisplayMode,
  setRunwayDisplayMode,
  configureLookWithGarments,
} from './products-store';

test('getManagedProducts initializes and returns catalog with cost & selling prices', () => {
  const prods = getManagedProducts();
  assert.ok(prods.length > 0);
  const first = prods[0];
  assert.ok(first.costPriceGhs > 0);
  assert.ok(first.sellingPriceGhs > first.costPriceGhs);
});

test('updateProductPricing updates cost price and selling price', () => {
  const prods = getManagedProducts();
  const testId = prods[0].id;

  const success = updateProductPricing(testId, 150, 350);
  assert.strictEqual(success, true);

  const updatedProds = getManagedProducts();
  const target = updatedProds.find((p) => p.id === testId);
  assert.ok(target);
  assert.strictEqual(target?.costPriceGhs, 150);
  assert.strictEqual(target?.sellingPriceGhs, 350);
});

test('getFinancialOverview calculates COGS, net profit, and gross margin accurately', () => {
  const revenueGhs = 10000;
  const overview = getFinancialOverview(revenueGhs);

  assert.strictEqual(overview.revenueGhs, 10000);
  assert.ok(overview.cogsGhs > 0 && overview.cogsGhs < 10000);
  assert.strictEqual(overview.netProfitGhs, overview.revenueGhs - overview.cogsGhs);
  assert.ok(overview.marginPercent > 0 && overview.marginPercent < 100);
});

test('getManagedRunwayLooks supports adding and configuring up to 12 looks', () => {
  const looks = getManagedRunwayLooks();
  assert.ok(looks.length >= 6);

  // Add Look 07
  addOrUpdateRunwayLook({
    id: 7,
    lookNum: '07',
    name: 'Atelier Evening Sculpt',
    description: 'Bespoke tailoring with structured drape.',
    modelImage: '/assets/fit-1-model.webp',
    topProductId: 'fit-1-shirt',
    bottomProductId: 'fit-1-pants',
    shoesProductId: 'fit-1-shoes',
    activeOnRunway: true,
  });

  const updatedLooks = getManagedRunwayLooks();
  assert.strictEqual(updatedLooks.some((l) => l.id === 7), true);
});

test('getRunwayDisplayMode and setRunwayDisplayMode enforce format settings', () => {
  setRunwayDisplayMode(1);
  assert.strictEqual(getRunwayDisplayMode(), 1);

  setRunwayDisplayMode(2);
  assert.strictEqual(getRunwayDisplayMode(), 2);

  setRunwayDisplayMode(3);
  assert.strictEqual(getRunwayDisplayMode(), 3);
});

test('configureLookWithGarments supports Single Hero Mode with JSON specs and optional sizes', () => {
  configureLookWithGarments({
    lookId: 8,
    lookNum: '08',
    name: 'MacBook Pro M3 Max Studio Spec',
    description: 'Flagship workstation in Space Black.',
    modelImage: '/assets/macbook-hero.webp',
    mode: 1,
    top: {
      name: 'MacBook Pro 16-inch M3 Max',
      category: 'Tech Hardware',
      costPriceGhs: 24000,
      sellingPriceGhs: 36000,
      sizes: [],
      hasSizes: false,
      specs: {
        Processor: 'Apple M3 Max 16-core',
        Memory: '36GB Unified',
        Storage: '1TB SSD',
      },
    },
  });

  const looks = getManagedRunwayLooks();
  const look8 = looks.find((l) => l.id === 8);
  assert.ok(look8);
  assert.strictEqual(look8?.mode, 1);
  assert.strictEqual(look8?.bottomProductId, '');
  assert.strictEqual(look8?.shoesProductId, '');

  const prods = getManagedProducts();
  const item = prods.find((p) => p.id === 'fit-8-shirt');
  assert.ok(item);
  assert.strictEqual(item?.hasSizes, false);
  assert.strictEqual(item?.specs?.Processor, 'Apple M3 Max 16-core');
});

