import * as XLSX from 'xlsx';

export const normalizeHeader = (value) => String(value ?? '').replace(/^\uFEFF/, '').replace(/\s+/g, '').toLowerCase();
export const isSpreadsheet = (file) => /\.(csv|xlsx|xls)$/i.test(file.name);

export function rowsToRecords(rows, fields, source) {
  const headers = (rows[0] || []).map(normalizeHeader);
  const mapping = fields.map((field) => {
    const key = normalizeHeader(field.name);
    const matches = headers.flatMap((header, index) => header && header === key ? [index] : []);
    if (matches.length > 1) throw new Error(`Kolom "${field.name}" duplikat. Gunakan header unik.`);
    return { field, index: matches[0] ?? -1 };
  });
  if (!mapping.some(({ index }) => index >= 0)) throw new Error('Tidak ada kolom yang cocok dengan template.');
  return rows.slice(1).flatMap((row, offset) => {
    const data = Object.fromEntries(mapping.map(({ field, index }) => [field.name, index < 0 ? '' : String(row[index] ?? '')]));
    if (!Object.values(data).some((value) => value.trim() !== '')) return [];
    return [{
      raw_fields: data,
      // Direct imports have no model confidence; zero is only a compatibility value.
      confidence_scores: Object.fromEntries(fields.map((field) => [field.name, 0])),
      scanned_at: new Date().toISOString(),
      source: { ...source, row: offset + 2, type: 'spreadsheet' },
      missing_fields: mapping.filter(({ index }) => index < 0).map(({ field }) => field.name),
    }];
  });
}

export async function importSpreadsheet(file, fields) {
  const csv = /\.csv$/i.test(file.name);
  const input = csv ? await file.text() : await file.arrayBuffer();
  const workbook = XLSX.read(input, { type: csv ? 'string' : 'array', raw: csv, cellText: true });
  const results = [];
  const warnings = [];
  for (const sheet of workbook.SheetNames) {
    try {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, range: 0, raw: false, defval: '', blankrows: true });
      const records = rowsToRecords(rows, fields, { file: file.name, sheet });
      if (!records.length) warnings.push(`${sheet}: tidak ada baris data yang cocok.`);
      results.push(...records);
    } catch (error) {
      warnings.push(`${sheet}: ${error.message}`);
    }
  }
  if (!results.length) throw new Error(warnings.join(' ') || 'File kosong atau tidak dapat dibaca.');
  return { results, warnings };
}
