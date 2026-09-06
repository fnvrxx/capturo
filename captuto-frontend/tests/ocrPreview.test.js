import test from 'node:test';
import assert from 'node:assert/strict';
import { boxPolygon, confidenceLabel, ocrAuditResult } from '../src/utils/ocrPreview.js';

test('rectangle and rotated polygon coordinates are preserved in source pixels', () => {
  assert.deepEqual(boxPolygon([10, 20, 60, 80]), [[10, 20], [60, 20], [60, 80], [10, 80]]);
  const rotated = [[1, 3], [20, 1], [23, 10], [4, 12]];
  assert.deepEqual(boxPolygon(rotated), rotated);
  for (const invalid of [null, [], [40, 30, 10, 20], [[1, NaN], [2, 3], [4, 5]]]) {
    assert.deepEqual(boxPolygon(invalid), []);
  }
});

test('confidence is shown per box without inventing a score for missing values', () => {
  assert.equal(confidenceLabel(0.976), '97.6%');
  assert.equal(confidenceLabel(0), '0.0%');
  assert.equal(confidenceLabel(undefined), 'N/A');
  assert.equal(confidenceLabel(NaN), 'N/A');
  assert.equal(confidenceLabel(1.2), '100.0%');
});

test('saving retains OCR evidence without persisting page image payloads', () => {
  const result = { raw_fields: { Name: 'Fajar' }, ocr_lines: [{ confidence: 0.97 }], ocr_pages: [{ page_index: 0, width: 100, height: 200, image: 'data:image/jpeg;base64,test' }] };
  const audit = ocrAuditResult(result);
  assert.equal(audit.ocr_pages[0].image, undefined);
  assert.equal(audit.ocr_pages[0].width, 100);
  assert.deepEqual(audit.ocr_lines, result.ocr_lines);
  assert.equal(result.ocr_pages[0].image, 'data:image/jpeg;base64,test');
});
