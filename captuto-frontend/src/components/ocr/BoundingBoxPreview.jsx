import { useEffect, useState } from 'react';
import { useOcrStore } from '../../store/ocrStore';
import { boxPolygon, confidenceColor, confidenceLabel, pageLines } from '../../utils/ocrPreview';
import Button from '../ui/Button';
import PdfPagePreview from './PdfPagePreview';

function PageOverlay({ page, lines, selected, onSelect, zoom }) {
  const width = Number(page.width);
  const height = Number(page.height);
  if (!(width > 0 && height > 0)) return <p role="alert">Ukuran halaman tidak tersedia.</p>;
  const fontSize = Math.max(12, width / 65);
  return (
    <div style={{ width: `${zoom}%` }} className="min-w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full h-auto bg-white" aria-label="Dokumen dengan bounding box dan confidence OCR">
        <image href={page.image} width={width} height={height} preserveAspectRatio="none" />
        {lines.map((line, index) => {
          const points = boxPolygon(line.bbox);
          if (!points.length) return null;
          const color = confidenceColor(line.confidence);
          const label = `${index + 1} · ${confidenceLabel(line.confidence)}`;
          const labelWidth = fontSize * label.length * 0.62;
          const x = Math.max(0, Math.min(width - labelWidth, Math.min(...points.map((p) => p[0]))));
          const y = Math.max(fontSize * 1.4, Math.min(...points.map((p) => p[1])));
          const active = selected === index;
          return (
            <g key={line.id || index} role="button" tabIndex={0} aria-pressed={active}
              aria-label={`Kotak ${index + 1}: ${line.text}, confidence ${confidenceLabel(line.confidence)}`}
              onClick={() => onSelect(index)} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(index); }
              }} className="cursor-pointer focus:outline-none focus:opacity-70">
              <title>{line.text} — {confidenceLabel(line.confidence)}</title>
              <polygon points={points.map((point) => point.join(',')).join(' ')} stroke={active ? '#534AB7' : color}
                strokeWidth={active ? 3 : 1.5} vectorEffect="non-scaling-stroke" fill={active ? '#534AB7' : color} fillOpacity={active ? 0.2 : 0.04} />
              <rect x={x} y={y - fontSize * 1.4} width={labelWidth} height={fontSize * 1.4} rx={3} fill={active ? '#534AB7' : color} />
              <text x={x + fontSize * 0.2} y={y - fontSize * 0.3} fontSize={fontSize} fill="white">{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Older service versions already return boxes for JPG/PNG, but no page images.
function LegacyImage({ file, ...props }) {
  const [page, setPage] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setPage({ image: url, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => setFailed(true);
    image.src = url;
    return () => { image.onload = null; image.onerror = null; URL.revokeObjectURL(url); };
  }, [file]);
  if (failed) return <p role="alert" className="p-6">Gambar tidak dapat ditampilkan. Silakan unggah ulang.</p>;
  return page ? <PageOverlay page={page} {...props} /> : <p className="p-6" role="status">Memuat gambar…</p>;
}

export default function BoundingBoxPreview({ onNext, onRetake }) {
  const { ocrResult, uploadedFile, selectedTemplate, assignBoxToField } = useOcrStore();
  const [targetField, setTargetField] = useState('');
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const isPdf = uploadedFile?.type === 'application/pdf' || /\.pdf$/i.test(uploadedFile?.name || '');
  const pages = ocrResult?.ocr_pages || [];
  const page = pages[pageNumber];
  const pageCount = Math.max(1, pages.length, pdfPageCount);
  const lines = pageLines(ocrResult, pageNumber);
  const activeLine = selected === null ? null : lines[selected];
  const overlayProps = { lines, selected, onSelect: setSelected, zoom };
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Bounding Box Preview</h2>
        <p className="text-sm text-gray-500 mt-1">Pilih kotak atau teks hasil OCR, pilih field template tujuan, lalu terapkan. Nilainya akan masuk ke form review.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
        <label className="flex items-center gap-2">Halaman
          <select aria-label="Halaman dokumen" value={pageNumber} onChange={(event) => { setPageNumber(Number(event.target.value)); setSelected(null); }} className="border border-gray-200 rounded-lg p-2">
            {Array.from({ length: pageCount }, (_, index) => <option key={index} value={index}>{index + 1} / {pageCount}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">Zoom
          <select aria-label="Zoom dokumen" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="border border-gray-200 rounded-lg p-2">
            {[100, 150, 200, 300].map((value) => <option key={value} value={value}>{value}%</option>)}
          </select>
        </label>
        <span className="text-gray-500">{lines.length} area teks</span>
      </div>
      <div className="flex flex-wrap gap-4 text-xs mb-4">
        <span className="text-green-700">● Tinggi ≥ 80%</span>
        <span className="text-amber-700">● Sedang 50–79.9%</span>
        <span className="text-red-700">● Rendah &lt; 50%</span>
        <span className="text-gray-500">Confidence menunjukkan keyakinan model, bukan jaminan teks benar.</span>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-100 overflow-auto max-h-[70vh]">
          {page?.image ? <PageOverlay page={page} {...overlayProps} /> : isPdf ? (
            <PdfPagePreview file={uploadedFile} pageIndex={pageNumber} metadata={page} onPageCount={setPdfPageCount}
              renderPage={(raster, hasCoordinates) => <PageOverlay page={raster} {...overlayProps} lines={hasCoordinates ? lines : []} />} />
          ) : uploadedFile?.type.startsWith('image/') ? (
            <LegacyImage file={uploadedFile} {...overlayProps} />
          ) : <p className="p-6 text-sm text-gray-600">Pratinjau halaman belum tersedia untuk dokumen ini. Unggah ulang setelah layanan OCR diperbarui.</p>}
        </div>
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-sm">Teks terdeteksi</h3>
            <p className="text-xs text-gray-500 mt-1">Nomor sesuai dengan label pada gambar.</p>
          </div>
          <div className="max-h-[48vh] overflow-y-auto p-2">
            {!lines.length && <p className="p-3 text-sm text-gray-500">Tidak ada teks terdeteksi. Anda dapat unggah ulang atau lanjut mengisi field secara manual.</p>}
            {lines.map((line, index) => (
              <button type="button" key={line.id || index} aria-pressed={selected === index} onClick={() => setSelected(index)}
                className={`w-full text-left p-3 rounded-lg mb-1 border ${selected === index ? 'border-[#534AB7] bg-[#EEEDFE]' : 'border-transparent hover:bg-gray-50'}`}>
                <span className="flex justify-between gap-2 text-xs mb-1"><span className="text-gray-500">Kotak {index + 1}</span><strong style={{ color: confidenceColor(line.confidence) }}>{confidenceLabel(line.confidence)}</strong></span>
                <span className="block text-sm text-gray-800 break-words">{line.text || '(Teks kosong)'}</span>
                {!boxPolygon(line.bbox).length && <span className="text-xs text-gray-500">Koordinat tidak tersedia</span>}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 text-sm" aria-live="polite">
            {activeLine ? <><p className="font-medium break-words">{activeLine.text}</p><p className="mt-1 text-gray-500">Confidence: {confidenceLabel(activeLine.confidence)}</p></> : <p className="text-gray-500">Pilih salah satu kotak untuk melihat detail.</p>}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-3 text-sm">
            <label className="block" htmlFor="ocr-target-field">Masukkan ke field template</label>
            <select id="ocr-target-field" value={targetField} onChange={(event) => { setTargetField(event.target.value); setAssignmentMessage(''); }} className="w-full border rounded-lg p-2">
              <option value="">Pilih field tujuan</option>
              {(selectedTemplate?.fields || []).map((field) => <option key={field.id ?? field.name} value={field.name}>{field.name}</option>)}
            </select>
            {targetField && <p className="text-gray-500 break-words">Nilai saat ini: {ocrResult?.raw_fields?.[targetField] || '—'}. Menerapkan kotak akan mengganti nilai ini.</p>}
            <Button disabled={!targetField || !String(activeLine?.text ?? '').trim()} onClick={() => {
              assignBoxToField(targetField, pageNumber, selected);
              setAssignmentMessage(`${targetField} diisi dengan “${activeLine.text}”.`);
            }}>Gunakan teks untuk field</Button>
            <p role="status" className="text-green-700 break-words">{assignmentMessage}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 border rounded-xl p-4">
        <h3 className="font-medium text-sm mb-3">Hasil field template</h3>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          {(selectedTemplate?.fields || []).map((field) => <div key={field.id ?? field.name}>
            <dt className="text-gray-500">{field.name}{ocrResult?.manual_mappings?.[field.name] && <span className="text-[#534AB7]"> · Dipilih dari kotak OCR</span>}</dt>
            <dd className="break-words">{ocrResult?.raw_fields?.[field.name] ?? '—'}</dd>
          </div>)}
        </dl>
      </div>
      <div className="flex flex-wrap justify-between gap-3 mt-6">
        <Button variant="secondary" onClick={onRetake}>Lewati dokumen</Button>
        <Button onClick={onNext}>Lanjut ke Review &amp; Save →</Button>
      </div>
    </section>
  );
}
