import { getConfidenceLevel, getConfidenceBarClass, formatConfidence } from '../../utils/confidenceHelpers';

export default function ConfidenceBar({ score }) {
  const level = getConfidenceLevel(score);
  const barClass = getConfidenceBarClass(level);
  const pct = Math.round(score * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[5px] bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 shrink-0">{formatConfidence(score)}</span>
    </div>
  );
}
