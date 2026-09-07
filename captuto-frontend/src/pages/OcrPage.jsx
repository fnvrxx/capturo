import { useEffect, useState } from 'react';
import StepBar from '../components/ui/StepBar';
import TemplateSelector from '../components/ocr/TemplateSelector';
import DocumentUploader from '../components/ocr/DocumentUploader';
import AutoFillForm from '../components/ocr/AutoFillForm';
import BoundingBoxPreview from '../components/ocr/BoundingBoxPreview';
import Button from '../components/ui/Button';
import { useOcrStore } from '../store/ocrStore';
import { useTemplateStore } from '../store/templateStore';

export default function OcrPage() {
  const [step, setStep] = useState(1);
  const { resetOcr, queue, activeIndex, selectItem, updateItem } = useOcrStore();
  const fetchTemplates = useTemplateStore((state) => state.fetchTemplates);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  const openItem = (index) => {
    selectItem(index);
    setStep(queue[index].result.source?.type === 'spreadsheet' ? 4 : 3);
  };
  const finishItem = (status) => {
    updateItem(activeIndex, { status });
    const next = queue.findIndex((item, index) => index !== activeIndex && item.status === 'pending');
    if (next >= 0) openItem(next);
    else setStep(5);
  };
  const restart = () => { resetOcr(); setStep(1); fetchTemplates(); };
  const item = queue[activeIndex];
  return (
    <div>
      <StepBar currentStep={Math.min(step, 4)} />
      {step === 1 && <TemplateSelector onNext={() => setStep(2)} />}
      {step === 2 && <DocumentUploader onNext={() => openItem(0)} onBack={() => setStep(1)} />}
      {(step === 3 || step === 4) && item && <>
        <p className="mb-4 text-sm break-all">Record {activeIndex + 1}/{queue.length} · {item.file.name}
          {item.result.source?.sheet && ` · Sheet ${item.result.source.sheet} · Baris ${item.result.source.row}`}
        </p>
        {step === 3 && <BoundingBoxPreview key={activeIndex} onNext={() => setStep(4)} onRetake={() => finishItem('skipped')} />}
        {step === 4 && <AutoFillForm key={activeIndex} onSaved={() => finishItem('saved')} onSkip={() => finishItem('skipped')} />}
      </>}
      {step === 5 && <section>
        <h2 className="text-lg font-semibold mb-3">Review selesai</h2>
        <p className="mb-4">{queue.filter((entry) => entry.status === 'saved').length} record disimpan, {queue.filter((entry) => entry.status === 'skipped').length} dilewati.</p>
        <ul className="space-y-2 mb-4">{queue.map((entry, index) => <li key={index} className="border rounded-lg p-3 text-sm">
          {entry.file.name}{entry.result.source?.row && ` · ${entry.result.source.sheet} · Baris ${entry.result.source.row}`} — {entry.status === 'saved' ? 'Disimpan' : 'Dilewati'}
          {entry.status === 'skipped' && <Button variant="ghost" onClick={() => { updateItem(index, { status: 'pending' }); openItem(index); }}>Review ulang</Button>}
        </li>)}</ul>
        <Button onClick={restart}>Upload berikutnya</Button>
      </section>}
    </div>
  );
}
