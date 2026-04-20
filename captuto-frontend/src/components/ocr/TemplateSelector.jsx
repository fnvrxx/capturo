import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import TemplateCard from '../template/TemplateCard';
import Button from '../ui/Button';
import { useTemplateStore } from '../../store/templateStore';
import { useOcrStore } from '../../store/ocrStore';

export default function TemplateSelector({ onNext }) {
  const { templates } = useTemplateStore();
  const { selectedTemplate, setTemplate } = useOcrStore();
  const navigate = useNavigate();

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Select the template that matches the document you want to scan.
      </p>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm mb-3">No templates found</p>
          <Button onClick={() => navigate('/templates')}>Create a template first</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selectable
              selected={selectedTemplate?.id === t.id}
              onSelect={() => setTemplate(t)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" onClick={() => navigate('/templates')}>
          <Plus size={14} />
          Create New Template
        </Button>
        <Button onClick={onNext} disabled={!selectedTemplate}>
          Next →
        </Button>
      </div>
    </div>
  );
}
