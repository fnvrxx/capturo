import { useNavigate } from 'react-router-dom';
import { Download, ScanLine, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import FieldTag from '../ui/FieldTag';
import Button from '../ui/Button';
import { useTemplateStore } from '../../store/templateStore';
import { useOcrStore } from '../../store/ocrStore';
import { recordService } from '../../services/recordService';
import { exportToXlsx } from '../../utils/exportXlsx';
import toast from 'react-hot-toast';

export default function TemplateCard({ template, selectable = false, selected = false, onSelect }) {
  const navigate = useNavigate();
  const { deleteTemplate } = useTemplateStore();
  const { setTemplate } = useOcrStore();

  const fields = template.fields || [];
  const visibleFields = fields.slice(0, 3);
  const overflow = fields.length - 3;

  const handleNewScan = (e) => {
    e.stopPropagation();
    setTemplate(template);
    navigate('/ocr');
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const res = await recordService.list(template.id);
      const records = res.data.data || [];
      if (!records.length) {
        toast.error('No records to export');
        return;
      }
      exportToXlsx(template, records);
      toast.success('Exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    try {
      await deleteTemplate(template.id);
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all ${
        selectable && selected ? 'border-[#534AB7] ring-2 ring-[#534AB7]/20' : ''
      } ${selectable ? 'hover:border-[#534AB7]/50' : ''}`}
      onClick={selectable ? onSelect : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
          {template.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{template.description}</p>
          )}
        </div>
        <Badge color="green">Active</Badge>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>{fields.length} fields</span>
        <span>·</span>
        <span>{template.records_count ?? 0} records</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-4 min-h-[24px]">
        {visibleFields.map((f) => (
          <FieldTag key={f.id} name={f.name} type={f.type} />
        ))}
        {overflow > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-500">
            +{overflow} more
          </span>
        )}
      </div>

      {!selectable && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button size="sm" onClick={handleNewScan} className="flex-1">
            <ScanLine size={13} />
            New Scan
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDownload}>
            <Download size={13} />
            .xlsx
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 size={13} />
          </Button>
        </div>
      )}
    </Card>
  );
}
