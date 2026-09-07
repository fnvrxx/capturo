import test from 'node:test';
import assert from 'node:assert/strict';
import { useOcrStore } from '../src/store/ocrStore.js';
import { ocrAuditResult } from '../src/utils/ocrPreview.js';

test('assigns a selected box across PDF pages, retains original evidence and isolates batch records', () => {
  const state = () => useOcrStore.getState();
  const line = { id: '1-0', text: 'PT Sumber Jaya', confidence: 0.94, bbox: [0, 0, 40, 30] };
  const result = { raw_fields: { Vendor: 'Wrong', Total: '100' }, confidence_scores: { Vendor: 0.1, Total: 0.9 }, ocr_pages: [{ page_index: 0, lines: [] }, { page_index: 1, image: 'data:image/png;base64,test', lines: [line] }] };
  state().resetOcr();
  state().setTemplate({ fields: [{ name: 'Vendor' }, { name: 'Total' }] });
  state().setQueue([{ result, status: 'pending' }, { result, status: 'pending' }]);
  state().assignBoxToField('Vendor', 1, 0);
  assert.equal(state().ocrResult.raw_fields.Vendor, line.text);
  assert.equal(state().ocrResult.confidence_scores.Vendor, 0.94);
  assert.equal(state().ocrResult.raw_fields.Total, '100');
  assert.equal(state().queue[1].result.raw_fields.Vendor, 'Wrong');
  assert.equal(result.raw_fields.Vendor, 'Wrong');
  const audit = ocrAuditResult(state().ocrResult);
  assert.equal(audit.original_raw_fields.Vendor, 'Wrong');
  assert.equal(audit.manual_mappings.Vendor.page_index, 1);
  assert.deepEqual(audit.manual_mappings.Vendor.bbox, line.bbox);
  assert.equal(audit.ocr_pages[1].image, undefined);
  state().selectItem(1);
  state().selectItem(0);
  assert.equal(state().ocrResult.raw_fields.Vendor, line.text);
  const before = state().ocrResult;
  state().assignBoxToField('Unknown', 1, 0);
  state().assignBoxToField('Vendor', 0, 12);
  assert.equal(state().ocrResult, before);
  state().updateItem(0, { status: 'saved' });
  state().assignBoxToField('Total', 1, 0);
  assert.equal(state().ocrResult, before);
  state().resetOcr();
});

test('legacy OCR boxes support reassignment without fabricating confidence', () => {
  const state = () => useOcrStore.getState();
  state().setTemplate({ fields: [{ name: 'Vendor' }] });
  state().setQueue([{ status: 'pending', result: { raw_fields: { Vendor: '' }, confidence_scores: { Vendor: 0 }, ocr_lines: [{ text: 'First' }, { text: 'Second', confidence: 0.8 }, { text: ' ' }] } }]);
  state().assignBoxToField('Vendor', 0, 0);
  assert.equal(state().ocrResult.confidence_scores.Vendor, null);
  state().assignBoxToField('Vendor', 0, 1);
  state().assignBoxToField('Vendor', 0, 2);
  assert.equal(state().ocrResult.raw_fields.Vendor, 'Second');
  assert.equal(state().ocrResult.original_raw_fields.Vendor, '');
  assert.equal(state().ocrResult.manual_mappings.Vendor.line_index, 1);
  state().resetOcr();
});
