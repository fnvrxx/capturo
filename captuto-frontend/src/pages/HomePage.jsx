import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, LayoutTemplate, FileText, Camera } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TemplateCard from '../components/template/TemplateCard';
import RecordsDrawer from '../components/template/RecordsDrawer';
import Spinner from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';
import { useTemplateStore } from '../store/templateStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { templates, isLoading, fetchTemplates } = useTemplateStore();
  const [activeTemplate, setActiveTemplate] = useState(null);

  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    fetchTemplates();
  }, []);

  const totalRecords = templates.reduce((sum, t) => sum + (t.records_count || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-gray-400">Where would you like to start today?</p>
      </div>

      <div className="bg-[#EEEDFE] border border-[#534AB7]/20 rounded-xl p-5 mb-6">
        <p className="font-medium text-[#3C3489] mb-1">Do you already have a document template?</p>
        <p className="text-sm text-[#534AB7]/70 mb-4">Templates define which fields OCR will extract.</p>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/ocr')}>
            <ScanLine size={14} />
            Start OCR
          </Button>
          <Button variant="secondary" onClick={() => navigate('/templates')}>
            <LayoutTemplate size={14} />
            Manage Templates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EEEDFE] rounded-lg flex items-center justify-center">
              <LayoutTemplate size={18} className="text-[#534AB7]" />
            </div>
            <div>
              <p className="text-2xl font-medium text-gray-900">{templates.length}</p>
              <p className="text-xs text-gray-400">Total Templates</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-medium text-gray-900">{totalRecords}</p>
              <p className="text-xs text-gray-400">Total Saved Records</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Camera size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-medium text-gray-900">{totalRecords}</p>
              <p className="text-xs text-gray-400">Scans This Month</p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900 text-sm">Active Templates</h2>
          {templates.length > 0 && (
            <p className="text-xs text-gray-400">Klik template untuk melihat data scan</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <LayoutTemplate size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm mb-3">No templates yet</p>
            <Button onClick={() => navigate('/templates')}>Create your first template</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.slice(0, 4).map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTemplate(t)}
                className="cursor-pointer"
              >
                <TemplateCard template={t} />
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTemplate && (
        <RecordsDrawer
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  );
}
