import { useEffect, useRef, useState } from 'react';
import { CheckCircle, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { ocrService } from '../../services/ocrService';
import { useOcrStore } from '../../store/ocrStore';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const PROCESSING_STEPS = [
  'Membaca file...',
  'Mengunggah dokumen...',
  'PaddleOCR menganalisis dokumen...',
  'Mengekstrak field template...',
];

export default function DocumentUploader({ onNext, onBack }) {
  const { selectedTemplate, setOcrResult, setUploadedFile } = useOcrStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const fileRef = useRef();

  useEffect(() => () => {
    if (preview && preview !== 'pdf') URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFile = (nextFile) => {
    if (!nextFile) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(nextFile.type)) {
      toast.error('Hanya file JPG, PNG, atau PDF yang diizinkan');
      return;
    }

    setFile(nextFile);
    setPreview(nextFile.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(nextFile));
  };

  const processDocument = async () => {
    if (!file || !selectedTemplate) return;

    setProcessing(true);
    setCurrentStep(0);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('template_id', selectedTemplate.id);

    try {
      setCurrentStep(1);
      const response = await ocrService.process(formData);
      setCurrentStep(2);

      const result = response.data.data;
      if (!result?.raw_fields || !result?.confidence_scores) {
        throw new Error('Hasil OCR tidak lengkap. Silakan unggah ulang dokumen.');
      }

      setCurrentStep(3);
      setUploadedFile(file);
      setOcrResult(result);
      onNext();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Gagal memproses dokumen');
    } finally {
      setProcessing(false);
      setCurrentStep(-1);
    }
  };

  return (
    <div>
      <div className="bg-[#EEEDFE] border border-[#534AB7]/20 rounded-lg px-4 py-3 mb-6 text-sm text-[#3C3489] flex items-center justify-between">
        <span>Template dipilih: <strong>{selectedTemplate?.name}</strong></span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">PaddleOCR</span>
      </div>

      {!processing ? (
        <>
          <p className="text-xs text-gray-500 mb-2 font-medium">Upload atau ambil foto dokumen</p>
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files[0]);
            }}
            onDragOver={(event) => event.preventDefault()}
            className="border-2 border-dashed border-[#534AB7]/40 rounded-xl p-8 text-center cursor-pointer hover:border-[#534AB7] hover:bg-[#EEEDFE]/30 transition-colors mb-6"
          >
            {preview && preview !== 'pdf' ? (
              <img src={preview} alt="Pratinjau dokumen yang dipilih" className="max-h-56 mx-auto rounded-lg object-contain" />
            ) : preview === 'pdf' ? (
              <div className="flex flex-col items-center gap-2 text-[#534AB7]">
                <FileText size={36} />
                <p className="text-sm font-medium">{file?.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={28} />
                <p className="text-sm">Klik atau seret file ke sini</p>
                <p className="text-xs">JPG, PNG, PDF · maksimal 10 MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" capture="environment" className="hidden" onChange={(event) => handleFile(event.target.files[0])} />

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={onBack}>← Kembali</Button>
            <Button onClick={processDocument} disabled={!file}>Proses Dokumen →</Button>
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center" aria-live="polite">
          <div className="flex justify-center mb-5"><Spinner size="lg" /></div>
          <p className="text-xs text-gray-400 mb-4">PaddleOCR sedang memproses dokumen...</p>
          <div className="flex flex-col gap-2">
            {PROCESSING_STEPS.map((label, index) => (
              <div key={label} className={`flex items-center justify-center gap-2 text-sm ${index < currentStep ? 'text-green-600' : index === currentStep ? 'text-[#534AB7] font-medium' : 'text-gray-300'}`}>
                {index < currentStep ? <CheckCircle size={14} /> : index === currentStep ? <Spinner size="sm" /> : <span className="w-[14px]" />}
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
