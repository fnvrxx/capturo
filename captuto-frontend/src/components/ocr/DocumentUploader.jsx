import { useState, useRef } from 'react';
import { Upload, Camera, FileText, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useOcrStore } from '../../store/ocrStore';
import { ocrService } from '../../services/ocrService';
import { generateSimulatedOcrData } from '../../utils/confidenceHelpers';
import toast from 'react-hot-toast';

const PROCESSING_STEPS = [
  'Membaca file...',
  'Mengunggah ke Azure...',
  'Menganalisis dokumen...',
  'Mengekstrak field...',
  'Menyimpan ke .json sementara...',
];

const isAzureConfigured = Boolean(import.meta.env.VITE_AZURE_OCR_KEY);

export default function DocumentUploader({ onNext, onBack }) {
  const { selectedTemplate, setUploadedFile, setTempJson } = useOcrStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      toast.error('Hanya file JPG, PNG, atau PDF yang diizinkan');
      return;
    }
    setFile(f);
    if (f.type !== 'application/pdf') {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview('pdf');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const runProcessing = async (sourceFile) => {
    setProcessing(true);

    try {
      if (isAzureConfigured) {
        // Mode nyata: kirim ke backend → backend kirim ke Azure
        await runRealOcr(sourceFile);
      } else {
        // Mode simulasi: animasi langkah-langkah, generate data palsu
        await runSimulatedOcr(sourceFile);
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memproses dokumen');
      setProcessing(false);
      setCurrentStep(-1);
    }
  };

  const runRealOcr = async (sourceFile) => {
    // Tampilkan animasi langkah-langkah saat menunggu backend
    setCurrentStep(0);
    await animateStep(1, 300);  // "Membaca file"
    setCurrentStep(1);
    await animateStep(2, 300);  // "Mengunggah ke Azure"

    const formData = new FormData();
    formData.append('image', sourceFile);
    formData.append('template_id', selectedTemplate.id);

    setCurrentStep(2); // "Menganalisis dokumen" — ini yang paling lama (Azure processing)

    let result;
    try {
      const res = await ocrService.process(formData);
      result = res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Azure OCR gagal';
      throw new Error(msg);
    }

    setCurrentStep(3);
    await animateStep(4, 300);
    setCurrentStep(4);
    await animateStep(5, 300);

    const tempJson = {
      template:          result.template,
      scanned_at:        result.scanned_at,
      status:            result.status,
      raw_fields:        result.raw_fields,
      confidence_scores: result.confidence_scores,
      document_image:    result.document_image,
    };

    setUploadedFile(sourceFile);
    setTempJson(tempJson);
    setProcessing(false);
    setCurrentStep(-1);
    onNext();
  };

  const runSimulatedOcr = async (sourceFile) => {
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setCurrentStep(i);
      await animateStep(i, 500);
    }

    const { rawFields, confidences } = generateSimulatedOcrData(selectedTemplate.fields);
    const tempJson = {
      template:          selectedTemplate.name,
      scanned_at:        new Date().toISOString(),
      status:            'pending_confirmation',
      raw_fields:        rawFields,
      confidence_scores: confidences,
    };

    setUploadedFile(sourceFile);
    setTempJson(tempJson);
    setProcessing(false);
    setCurrentStep(-1);
    onNext();
  };

  const animateStep = (_, ms) => new Promise((r) => setTimeout(r, ms));

  const handleCameraSimulate = async () => {
    toast('Simulasi kamera aktif...', { icon: '📷' });
    await new Promise((r) => setTimeout(r, 1500));
    const fakeFile = new File(['camera-capture'], 'capture.jpg', { type: 'image/jpeg' });
    setFile(fakeFile);
    setPreview('camera');
    await runProcessing(fakeFile);
  };

  return (
    <div>
      <div className="bg-[#EEEDFE] border border-[#534AB7]/20 rounded-lg px-4 py-3 mb-6 text-sm text-[#3C3489] flex items-center justify-between">
        <span>Template dipilih: <strong>{selectedTemplate?.name}</strong></span>
        {isAzureConfigured
          ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Azure aktif</span>
          : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Mode simulasi</span>
        }
      </div>

      {!processing ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Upload foto dokumen</p>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-[#534AB7]/40 rounded-xl p-8 text-center cursor-pointer hover:border-[#534AB7] hover:bg-[#EEEDFE]/30 transition-colors"
              >
                {preview && preview !== 'pdf' ? (
                  <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                ) : preview === 'pdf' ? (
                  <div className="flex flex-col items-center gap-2 text-[#534AB7]">
                    <FileText size={36} />
                    <p className="text-sm font-medium">{file?.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload size={28} />
                    <p className="text-sm">Klik atau seret file ke sini</p>
                    <p className="text-xs">JPG, PNG, PDF</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Ambil foto langsung</p>
              <div
                onClick={handleCameraSimulate}
                className="border-2 border-dashed border-[#534AB7]/40 rounded-xl p-8 text-center cursor-pointer hover:border-[#534AB7] hover:bg-[#EEEDFE]/30 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 h-[calc(100%-28px)]"
              >
                <Camera size={28} />
                <p className="text-sm">Buka Kamera</p>
                <p className="text-xs">Simulasi kamera</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={onBack}>← Kembali</Button>
            {file && (
              <Button onClick={() => runProcessing(file)}>
                Proses Dokumen →
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 border-4 border-[#EEEDFE] rounded-full" />
              <div className="w-16 h-16 border-4 border-transparent border-t-[#534AB7] rounded-full animate-spin absolute inset-0" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            {isAzureConfigured ? 'Azure Document Intelligence sedang memproses...' : 'Mode simulasi aktif...'}
          </p>
          <div className="flex flex-col gap-2">
            {PROCESSING_STEPS.map((stepLabel, idx) => (
              <div key={idx} className={`flex items-center justify-center gap-2 text-sm transition-colors ${
                idx < currentStep ? 'text-green-600' : idx === currentStep ? 'text-[#534AB7] font-medium' : 'text-gray-300'
              }`}>
                {idx < currentStep ? <CheckCircle size={14} /> : idx === currentStep ? <Spinner size="sm" /> : <span className="w-[14px]" />}
                {stepLabel}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
