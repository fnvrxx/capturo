import * as XLSX from 'xlsx';

export function exportToXlsx(template, records) {
  const fieldNames = template.fields.map((f) => f.name);

  const rows = records.map((record) => {
    const row = {};
    fieldNames.forEach((name) => {
      row[name] = record.data?.[name] ?? '';
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, { header: fieldNames });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Records');

  const date = new Date().toISOString().split('T')[0];
  const filename = `${template.name.replace(/\s+/g, '_')}_${date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
