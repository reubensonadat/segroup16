import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, compressImageToWebp } from './image-compression';

test('formatBytes formats byte numbers into clean units', () => {
  assert.strictEqual(formatBytes(0), '0 B');
  assert.strictEqual(formatBytes(512), '512 B');
  assert.strictEqual(formatBytes(1024), '1 KB');
  assert.strictEqual(formatBytes(204800), '200 KB');
  assert.strictEqual(formatBytes(3670016), '3.5 MB');
});

test('compressImageToWebp safely processes image input and returns compression metadata', async () => {
  const dummyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const result = await compressImageToWebp(dummyDataUrl, {
    maxWidth: 800,
    quality: 0.85,
  });

  assert.ok(result);
  assert.ok(result.dataUrl);
  assert.ok(typeof result.originalSize === 'number');
  assert.ok(typeof result.compressedSize === 'number');
  assert.ok(typeof result.savedPercent === 'number');
});
