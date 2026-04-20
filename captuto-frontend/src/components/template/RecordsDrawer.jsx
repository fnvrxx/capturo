import { useEffect, useState } from 'react';
import { X, Download, ScanLine, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Badge from '../ui/Badge';
import { recordService } from '../../services/recordService';
import { exportToXlsx } from '../../utils/exportXlsx';
import { getConfidenceLevel, getConfidenceBadgeClass, formatConfidence } from '../../utils/confidenceHelpers';
import { useOcrStore } from '../../store/ocrStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function RecordsDrawer({ template, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { setTemplate } = useOcrStore();
  const navigate = useNavigate();

  const fields = template?.fields || [];

  useEffect(() => {
    if (!template) return;
    setLoading(true);
    recordService.list(template.id)
      .then((res) => setRecords(res.data.data || []))
      .catch(() => toast.error('Gagal memuat records'))
      .finally(() => setLoading(false));
  }, [template?.id]);

  const handleNewScan = () => {
    setTemplate(template);
    navigate('/ocr');
  };

  const handleDownload = () => {
    if (!records.length) { toast.error('Tidak ada data untuk diekspor'); return; }
    exportToXlsx(template, records);
    toast.success('Berhasil diekspor');
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-300 italic">—</span>;
    return val;
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-medium text-gray-900">{template.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {fields.length} field · {records.length} record
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleDownload}>
              <Download size={13} />
              Export .xlsx
            </Button>
            <Button size="sm" onClick={handleNewScan}>
              <ScanLine size={13} />
              Scan Baru
            </Button>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Table panel */}
          <div className={`flex-1 overflow-auto ${selectedRecord ? 'border-r border-gray-100' : ''}`}>
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner size="lg" />
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <p className="text-sm">Belum ada data scan untuk template ini</p>
                <Button size="sm" onClick={handleNewScan}>
                  <ScanLine size={13} />
                  Mulai Scan Pertama
                </Button>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-100 whitespace-nowrap">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-100 whitespace-nowrap">
                      Waktu Scan
                    </th>
                    {fields.map((f) => (
                      <th key={f.id} className="text-left px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-100 whitespace-nowrap">
                        {f.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 border-b border-gray-100 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => {
                    const isSelected = selectedRecord?.id === record.id;
                    return (
                      <tr
                        key={record.id}
                        onClick={() => setSelectedRecord(isSelected ? null : record)}
                        className={`cursor-pointer border-b border-gray-50 transition-colors ${
                          isSelected ? 'bg-[#EEEDFE]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(record.scanned_at)}
                        </td>
                        {fields.map((f) => (
                          <td key={f.id} className="px-4 py-3 text-gray-800 max-w-[160px] truncate">
                            {formatValue(record.data?.[f.name])}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <ChevronRight size={14} className={`text-gray-300 transition-transform ${isSelected ? 'rotate-90 text-[#534AB7]' : ''}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel — muncul saat baris diklik */}
          {selectedRecord && (
            <div className="w-72 shrink-0 overflow-y-auto bg-gray-50/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Detail Record</p>
                <button onClick={() => setSelectedRecord(null)} className="text-gray-300 hover:text-gray-500 cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-4">{formatDate(selectedRecord.scanned_at)}</p>

              <div className="flex flex-col gap-3">
                {fields.map((f) => {
                  const value = selectedRecord.data?.[f.name];
                  const score = selectedRecord.confidence_scores?.[f.name];
                  const level = score != null ? getConfidenceLevel(score) : null;
                  const badgeClass = level ? getConfidenceBadgeClass(level) : '';

                  return (
                    <div key={f.id} className="bg-white rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">{f.name}</span>
                        {level && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeClass}`}>
                            {formatConfidence(score)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {value || <span className="text-gray-300 italic font-normal">—</span>}
                      </p>
                      {score != null && (
                        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              level === 'high' ? 'bg-green-500' : level === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: formatConfidence(score) }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {records.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Menampilkan <strong className="text-gray-600">{records.length}</strong> record
            </p>
            <p className="text-xs text-gray-400">Klik baris untuk melihat detail & confidence</p>
          </div>
        )}
      </div>
    </>
  );
}
