import { useEffect, useState } from 'react';
import StepBar from '../components/ui/StepBar';
import TemplateSelector from '../components/ocr/TemplateSelector';
import DocumentUploader from '../components/ocr/DocumentUploader';
import AutoFillForm from '../components/ocr/AutoFillForm';
import BoundingBoxPreview from '../components/ocr/BoundingBoxPreview';
import { useOcrStore } from '../store/ocrStore';
import { useTemplateStore } from '../store/templateStore';

export default function OcrPage() {
  const [step, setStep] = useState(1);
  const { resetOcr, setUploadedFile, setOcrResult } = useOcrStore();
  const { fetchTemplates } = useTemplateStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleChangeTemplate = () => {
    resetOcr();
    setStep(1);
  };

  const handleRetake = () => {
    setUploadedFile(null);
    setOcrResult(null);
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
      {step === 3 && <BoundingBoxPreview onNext={() => setStep(4)} onRetake={handleRetake} />}
      {step === 4 && (
        <AutoFillForm
          onSaved={handleSaved}
          onChangeTemplate={handleChangeTemplate}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
