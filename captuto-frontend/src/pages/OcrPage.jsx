import { useEffect, useState } from 'react';
import StepBar from '../components/ui/StepBar';
import TemplateSelector from '../components/ocr/TemplateSelector';
import DocumentUploader from '../components/ocr/DocumentUploader';
import ConfirmationPanel from '../components/ocr/ConfirmationPanel';
import AutoFillForm from '../components/ocr/AutoFillForm';
import { useOcrStore } from '../store/ocrStore';
import { useTemplateStore } from '../store/templateStore';

export default function OcrPage() {
  const [step, setStep] = useState(1);
  const { resetOcr, setUploadedFile, setTempJson, tempJsonData } = useOcrStore();
  const { fetchTemplates } = useTemplateStore();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleConfirm = () => {
    if (!tempJsonData) return;
    // Hanya update status — data raw_fields dan confidence_scores dari Azure/simulasi tetap dipakai
    setTempJson({ ...tempJsonData, status: 'confirmed' });
    setStep(4);
  };

  const handleChangeTemplate = () => {
    resetOcr();
    setStep(1);
  };

  const handleRetake = () => {
    setUploadedFile(null);
    setTempJson(null);
    setStep(2);
  };

  const handleSaved = () => {
    resetOcr();
    setStep(1);
  };

  return (
    <div>
      <StepBar currentStep={step} />

      {step === 1 && <TemplateSelector onNext={() => setStep(2)} />}
      {step === 2 && <DocumentUploader onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && (
        <ConfirmationPanel
          onConfirm={handleConfirm}
          onChangeTemplate={handleChangeTemplate}
          onRetake={handleRetake}
        />
      )}
      {step === 4 && (
        <AutoFillForm
          onSaved={handleSaved}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
