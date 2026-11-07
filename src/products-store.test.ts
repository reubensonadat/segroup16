import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getManagedProducts,
  updateProductPricing,
  getFinancialOverview,
  getManagedRunwayLooks,
  addOrUpdateRunwayLook,
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

