import { useState } from "react";
import { Plus, X, ArrowLeft } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Badge from "../ui/Badge";
import { useTemplateStore } from "../../store/templateStore";
import toast from "react-hot-toast";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
];

const TYPE_COLORS = {
  text: "blue",
  number: "purple",
  date: "green",
  currency: "amber",
  email: "gray",
};

export default function TemplateBuilder({ onBack }) {
  const { createTemplate } = useTemplateStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const addField = () => {
    if (!fieldName.trim()) return;
    setFields((prev) => [...prev, { name: fieldName.trim(), type: fieldType }]);
    setFieldName("");
    setFieldType("text");
  };

  const removeField = (idx) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Template name is required";
    if (!fields.length) newErrors.fields = "Add at least one field";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await createTemplate({ name: name.trim(), description, fields });
      toast.success("Template created");
      onBack();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create template";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 cursor-pointer transition-colors"
      >
        <ArrowLeft size={15} />
        Back to templates
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-medium text-gray-900 mb-4">Template Info</h2>

          <div className="flex flex-col gap-4">
            <Input
              label="Template Name"
              placeholder="e.g. Invoice, Purchase Order"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#534AB7] resize-none"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 my-5" />

          <h3 className="font-medium text-gray-800 text-sm mb-3">
            Add New Field
          </h3>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Field name (e.g. Invoice Number)"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addField()}
            />
            <Select
              options={FIELD_TYPES}
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={addField}
              disabled={!fieldName.trim()}
            >
              <Plus size={14} />
              Add Field
            </Button>
            {errors.fields && (
              <p className="text-xs text-red-500">{errors.fields}</p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <h2 className="font-medium text-gray-900 mb-4">Fields Preview</h2>

          <div className="flex-1">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No fields defined yet
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {fields.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800">{f.name}</span>
                      <Badge color={TYPE_COLORS[f.type]}>{f.type}</Badge>
                    </div>
                    <button
                      onClick={() => removeField(idx)}
                      className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
