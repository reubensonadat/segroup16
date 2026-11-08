import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAdminPage } from './admin-page';

test('renderAdminPage includes modal sheet container and edit product triggers in DOM', () => {
  const html = renderAdminPage();

  // Modal sheet element exists
  assert.ok(html.includes('id="ap-look-config-modal"'), 'Modal wrapper (#ap-look-config-modal) must be present in DOM');
  assert.ok(html.includes('id="ap-modal-body"'), 'Modal body container (#ap-modal-body) must be present in DOM');
  assert.ok(html.includes('id="ap-modal-title"'), 'Modal title (#ap-modal-title) must be present in DOM');
  assert.ok(html.includes('id="ap-modal-close-btn"'), 'Modal close button (#ap-modal-close-btn) must be present in DOM');
  assert.ok(html.includes('id="ap-look-backdrop"'), 'Modal backdrop (#ap-look-backdrop) must be present in DOM');

  // Trigger buttons exist
  assert.ok(html.includes('data-configure-slot='), 'Look cards must have data-configure-slot triggers');
  assert.ok(html.includes('data-edit-prod='), 'Garments must have data-edit-prod edit triggers');
});
