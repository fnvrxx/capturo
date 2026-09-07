import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { rowsToRecords, importSpreadsheet } from '../src/utils/documentImport.js';
import { useOcrStore } from '../src/store/ocrStore.js';

const fields = [{ name: 'Invoice Number', type: 'text' }, { name: 'Total', type: 'currency' }, { name: 'Email', type: 'email' }];

test('maps reordered headers, preserves zero, skips blank matched rows and retains source row', () => {
  const records = rowsToRecords([
    ['TOTAL', ' invoice  NUMBER ', 'Ignored'],
    [0, '0012', 'unused'],
    ['', '', 'not a record'],
    [120, '0013', 'unused'],
  ], fields, { file: 'invoices.csv' });
  assert.equal(records.length, 2);
  assert.deepEqual(records[0].raw_fields, { 'Invoice Number': '0012', Total: '0', Email: '' });
  assert.deepEqual(records[0].missing_fields, ['Email']);
  assert.equal(records[1].source.row, 4);
});

test('rejects unmatched headers and ambiguous duplicate columns', () => {
  assert.throws(() => rowsToRecords([['Other'], ['value']], fields, {}), /Tidak ada kolom/);
  assert.throws(() => rowsToRecords([['Total', ' TOTAL '], [1, 2]], fields, {}), /duplikat/);
});

test('CSV supports BOM, quoted delimiters, empty fields and leading zeros', async () => {
  const file = { name: 'test.csv', text: async () => '\uFEFFInvoice Number,Total,Email\n0012,0,"a,b@example.com"\n,,\n' };
  const { results } = await importSpreadsheet(file, fields);
  assert.equal(results.length, 1);
  assert.equal(results[0].raw_fields['Invoice Number'], '0012');
  assert.equal(results[0].raw_fields.Email, 'a,b@example.com');
});

for (const bookType of ['xlsx', 'xls']) {
  test(`${bookType} reads all matching sheets and reports unmatched sheets`, async () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Invoice Number', 'Total'], ['0012', 0]]), 'First');
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Total'], [50]]), 'Second');
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Other'], ['ignored']]), 'Other');
    const bytes = XLSX.write(book, { type: 'array', bookType: bookType === 'xls' ? 'biff8' : bookType });
    const { results, warnings } = await importSpreadsheet({ name: `test.${bookType}`, arrayBuffer: async () => bytes }, fields);
    assert.equal(results.length, 2);
    assert.equal(results[1].source.sheet, 'Second');
    assert.equal(warnings.length, 1);
    assert.equal(results[0].raw_fields.Total, '0');
  });
}

test('queue keeps separate results and save status when moving between records', () => {
  const store = () => useOcrStore.getState();
  store().setQueue([{ file: { name: 'a' }, result: { raw_fields: { Total: '1' } }, status: 'pending' },
    { file: { name: 'b' }, result: { raw_fields: { Total: '2' } }, status: 'pending' }]);
  store().updateItem(0, { status: 'saved' });
  store().selectItem(1);
  assert.equal(store().uploadedFile.name, 'b');
  assert.equal(store().ocrResult.raw_fields.Total, '2');
  assert.equal(store().queue[0].status, 'saved');
  store().resetOcr();
  assert.deepEqual(store().queue, []);
});
