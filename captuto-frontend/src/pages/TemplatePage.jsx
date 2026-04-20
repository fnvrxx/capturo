import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import TemplateCard from '../components/template/TemplateCard';
import TemplateBuilder from '../components/template/TemplateBuilder';
import Spinner from '../components/ui/Spinner';
import { useTemplateStore } from '../store/templateStore';

export default function TemplatePage() {
  const { templates, isLoading, fetchTemplates } = useTemplateStore();
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (showBuilder) {
    return <TemplateBuilder onBack={() => setShowBuilder(false)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-medium text-gray-900">Document Templates</h1>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus size={14} />
          Create New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm mb-3">No templates yet</p>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus size={14} />
            Create your first template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}
