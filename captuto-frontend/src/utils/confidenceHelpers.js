export function getConfidenceLevel(score) {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export function getConfidenceColor(level) {
  if (level === 'high') return 'green';
  if (level === 'medium') return 'amber';
  return 'red';
}

export function getConfidenceBadgeClass(level) {
  if (level === 'high') return 'bg-green-100 text-green-700';
  if (level === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export function getConfidenceBarClass(level) {
  if (level === 'high') return 'bg-green-500';
  if (level === 'medium') return 'bg-amber-500';
  return 'bg-red-500';
}

export function formatConfidence(score) {
  return `${Math.round(score * 100)}%`;
}
