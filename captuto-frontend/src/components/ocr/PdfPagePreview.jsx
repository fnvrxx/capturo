import { useEffect, useState } from 'react';

// Only load PDF.js when the OCR service did not provide its own page raster.
export default function PdfPagePreview({ file, pageIndex, metadata, onPageCount, renderPage }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let disposed = false;
    let task;
    let renderTask;
    async function load() {
      try {
        const pdfjs = await import('pdfjs-dist');
        const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        if (disposed) return;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const data = await file.arrayBuffer();
        if (disposed) return;
        task = pdfjs.getDocument({ data });
        const pdf = await task.promise;
        if (disposed) return;
        onPageCount(pdf.numPages);
        const page = await pdf.getPage(pageIndex + 1);
        if (disposed) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 2000 / Math.max(base.width, base.height)) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
        await renderTask.promise;
        if (!disposed) setState({ file, pageIndex, image: canvas.toDataURL('image/png'), width: viewport.width, height: viewport.height });
      } catch (error) {
        if (!disposed) setState({ file, pageIndex, error: error.name === 'PasswordException' ? 'PDF terkunci. Unggah PDF tanpa password.' : 'PDF tidak dapat ditampilkan. Periksa file dan unggah ulang.' });
      }
    }
    load();
    return () => { disposed = true; renderTask?.cancel(); void task?.destroy(); };
  }, [file, pageIndex, onPageCount]);
  if (!state || state.file !== file || state.pageIndex !== pageIndex) return <p role="status" className="p-6">Memuat halaman PDF…</p>;
  if (state.error) return <p role="alert" className="p-6">{state.error}</p>;
  const hasCoordinates = metadata?.width > 0 && metadata?.height > 0;
  return <>
    {!hasCoordinates && <p className="p-3 text-sm text-amber-700">Halaman PDF tersedia, tetapi ukuran koordinat OCR belum tersedia. Perbarui service.py di Kaggle lalu proses ulang PDF untuk menampilkan kotak secara akurat.</p>}
    {renderPage({ image: state.image, width: hasCoordinates ? metadata.width : state.width, height: hasCoordinates ? metadata.height : state.height }, hasCoordinates)}
  </>;
}
