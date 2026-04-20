import { RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import JsonPreview from '../ui/JsonPreview';
import { useOcrStore } from '../../store/ocrStore';

const TYPE_COLORS = {
  text: 'blue',
  number: 'purple',
  date: 'green',
  currency: 'amber',
  email: 'gray',
};

export default function ConfirmationPanel({ onConfirm, onChangeTemplate, onRetake }) {
  const { selectedTemplate, tempJsonData } = useOcrStore();

  const previewJson = tempJsonData
    ? {
        template: tempJsonData.template,
        scanned_at: tempJsonData.scanned_at,
        status: tempJsonData.status,
        raw_fields: tempJsonData.raw_fields,
      }
    : {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="font-medium text-gray-900 mb-1 text-sm">OCR data saved temporarily (.json)</h3>
        <p className="text-xs text-gray-400 mb-4">Data has not been saved to the database. Please confirm before AI processing.</p>
        <JsonPreview data={previewJson} />
      </Card>

      <Card>
        <h3 className="font-medium text-gray-900 mb-4 text-sm">Does this template match your document?</h3>

        <div className="mb-5">
          <p className="font-medium text-gray-800 mb-3">{selectedTemplate?.name}</p>
          <div className="flex flex-col gap-2">
            {(selectedTemplate?.fields || []).map((f) => (
              <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{f.name}</span>
                <Badge color={TYPE_COLORS[f.type]}>{f.type}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={onConfirm}>
            Yes, process with Azure AI
          </Button>
          <Button variant="secondary" className="w-full" onClick={onChangeTemplate}>
            No, change template
          </Button>
          <Button variant="outline" className="w-full" onClick={onRetake}>
            <RefreshCw size={13} />
            Not sure? Retake photo
          </Button>
        </div>
      </Card>
    </div>
  );
}
