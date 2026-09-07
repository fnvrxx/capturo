import { useRef, useState } from 'react';
import { ocrService } from '../../services/ocrService';
import { useOcrStore } from '../../store/ocrStore';
import { importSpreadsheet, isSpreadsheet } from '../../utils/documentImport';
import Button from '../ui/Button';

export default function DocumentUploader({ onNext, onBack }) {
  const { selectedTemplate, setQueue } = useOcrStore();
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  const input = useRef(null);
  const addFiles = (incoming) => {
    const accepted = [];
    const errors = [];
    for (const file of incoming) {
      if (!/\.(jpe?g|png|pdf|csv|xlsx|xls)$/i.test(file.name)) errors.push(`${file.name}: format tidak didukung.`);
      else if (!file.size || file.size > 10 * 1024 * 1024) errors.push(`${file.name}: file harus berisi data dan maksimal 10 MB.`);
      else accepted.push(file);
    }
    setFiles((previous) => [...previous, ...accepted]);
    setMessages(errors);
  };
  const process = async () => {
    setBusy(true);
    setMessages([]);
    const queue = [];
    const errors = [];
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Memproses ${index + 1}/${files.length}: ${file.name}`);
        try {
          if (isSpreadsheet(file)) {
            const { results, warnings } = await importSpreadsheet(file, selectedTemplate.fields);
            results.forEach((result) => queue.push({ file, result, status: 'pending' }));
            errors.push(...warnings.map((warning) => `${file.name}: ${warning}`));
          } else {
            const body = new FormData();
            body.append('image', file);
            body.append('template_id', selectedTemplate.id);
            const response = await ocrService.process(body);
            const result = response.data.data;
            if (!result?.raw_fields || !result?.confidence_scores) throw new Error('Hasil OCR tidak lengkap.');
            queue.push({ file, result, status: 'pending' });
          }
        } catch (error) {
          errors.push(`${file.name}: ${error.response?.data?.message || error.message}`);
        }
      }
      setMessages(errors);
      if (queue.length) {
        setQueue(queue);
        setReady(true);
        setProgress(`${queue.length} record siap direview. ${errors.length ? 'Periksa pesan di bawah untuk file/sheet yang dilewati.' : ''}`);
      } else setProgress('Belum ada record yang dapat direview. Periksa file dan coba lagi.');
    } finally { setBusy(false); }
  };
  return (
    <section>
      <p className="mb-4 text-sm">Template: <strong>{selectedTemplate?.name}</strong></p>
      <p className="mb-4 text-sm text-gray-500">Pilih beberapa JPG, PNG, PDF, CSV, XLS, atau XLSX (maksimal 10 MB/file). Untuk tabel, gunakan nama field template sebagai header di baris pertama. Setiap baris menjadi satu record; semua sheet dibaca.</p>
      <input ref={input} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.csv,.xls,.xlsx" className="hidden" disabled={busy || ready}
        onChange={(event) => { addFiles(Array.from(event.target.files)); event.target.value = ''; }} />
      {!ready && <button type="button" disabled={busy} onClick={() => input.current?.click()}
        onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (!busy) addFiles(Array.from(event.dataTransfer.files)); }}
        className="w-full border-2 border-dashed rounded-xl p-8 mb-4 text-[#534AB7] disabled:opacity-50">Klik atau seret beberapa file ke sini</button>}
      <ul className="space-y-2 mb-4">
        {files.map((file, index) => <li key={index} className="flex justify-between gap-3 text-sm border rounded-lg p-3">
          <span className="break-all">{file.name}</span>
          {!ready && <button disabled={busy} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} aria-label={`Hapus ${file.name}`}>Hapus</button>}
        </li>)}
      </ul>
      <p role="status" className="text-sm mb-4">{progress}</p>
      {!!messages.length && <ul role="alert" className="text-sm text-red-700 mb-4 space-y-2">{messages.map((message, i) => <li key={i}>{message}</li>)}</ul>}
      <div className="flex gap-3">
        {!ready && <Button variant="secondary" onClick={onBack} disabled={busy}>Kembali</Button>}
        {ready ? <Button onClick={onNext}>Review hasil →</Button> : <Button onClick={process} disabled={busy || !files.length}>{busy ? 'Memproses…' : 'Proses semua file'}</Button>}
      </div>
    </section>
  );
}
