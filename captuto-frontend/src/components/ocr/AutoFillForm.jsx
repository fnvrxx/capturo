import { useState } from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ConfidenceBar from "../ui/ConfidenceBar";
import { useOcrStore } from "../../store/ocrStore";
import { recordService } from "../../services/recordService";
import {
  getConfidenceLevel,
  getConfidenceBadgeClass,
  formatConfidence,
} from "../../utils/confidenceHelpers";
import toast from "react-hot-toast";
import { ocrAuditResult } from '../../utils/ocrPreview';

export default function AutoFillForm({ onSaved, onRetake, onChangeTemplate }) {
  const { selectedTemplate, ocrResult } = useOcrStore();
  const fields = selectedTemplate?.fields || [];
  const rawFields = ocrResult?.raw_fields || {};
  const confidenceScores = ocrResult?.confidence_scores || {};

  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach((f) => {
      init[f.name] = rawFields[f.name] || "";
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const avgConfidence = fields.length
    ? fields.reduce((sum, f) => sum + (confidenceScores[f.name] || 0), 0) /
      fields.length
    : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await recordService.create({
        template_id: selectedTemplate.id,
        scanned_at: ocrResult?.scanned_at || new Date().toISOString(),
        raw_json: ocrAuditResult(ocrResult),
        data: values,
        confidence_scores: confidenceScores,
        document_image: null,
      });
      toast.success("Record saved to database");
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save record";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="bg-[#EEEDFE] border border-[#534AB7]/20 rounded-lg px-4 py-3 mb-6 text-sm text-[#3C3489]">
        PaddleOCR selesai memproses dokumen. Periksa dan koreksi field sebelum menyimpan.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {fields.map((field) => {
          const score = confidenceScores[field.name] ?? 0.85;
          const level = getConfidenceLevel(score);
          const badgeClass = getConfidenceBadgeClass(level);
          const isLow = level === "low";
          const isMedium = level === "medium";
          const isEditable = isLow || isMedium;

          return (
            <Card key={field.id} className={isLow ? "border-red-200" : ""}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {field.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)} ·{" "}
                  {formatConfidence(score)}
                </span>
              </div>

              {isEditable ? (
                <input
                  className={`w-full h-9 px-3 border rounded-lg text-sm outline-none mb-2
                    ${isLow ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`}
                  value={values[field.name]}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.name]: e.target.value,
                    }))
                  }
                  placeholder={isLow ? "Required — enter manually" : undefined}
                />
              ) : (
                <p className="font-medium text-gray-900 text-sm mb-2">
                  {values[field.name] || "—"}
                </p>
              )}

              <ConfidenceBar score={score} />
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
        <span>
          Average confidence:{" "}
          <strong className="text-gray-800">
            {formatConfidence(avgConfidence)}
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save to Database"}
        </Button>
        <Button variant="secondary" onClick={onRetake}>
          Retake Document Photo
        </Button>
        <Button variant="outline" onClick={onChangeTemplate}>
          Change Template
        </Button>
      </div>
    </div>
  );
}
