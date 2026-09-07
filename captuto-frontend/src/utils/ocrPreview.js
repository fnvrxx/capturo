export function pageLines(result, pageIndex) {
  const page = result?.ocr_pages?.[pageIndex];
  if (Array.isArray(page?.lines)) return page.lines;
  const lines = result?.ocr_lines || [];
  const index = page?.page_index ?? pageIndex;
  // Legacy untagged results can only be associated with the first page.
  return lines.filter((line) => (line.page_index ?? 0) === index);
}

export function boxPolygon(box) {
  if (!Array.isArray(box)) return [];
  if (box.length === 4 && box.every(Number.isFinite)) {
    const [x1, y1, x2, y2] = box;
    if (x2 <= x1 || y2 <= y1) return [];
    return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
  }
  return box.length >= 3 && box.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)) ? box : [];
}

export function lineConfidence(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
}

export function confidenceLabel(value) {
  const score = lineConfidence(value);
  return score === null ? 'N/A' : `${(score * 100).toFixed(1)}%`;
}

export function confidenceColor(value) {
  const score = lineConfidence(value);
  return score === null ? '#64748b' : score >= 0.8 ? '#15803d' : score >= 0.5 ? '#b45309' : '#b91c1c';
}

// Page rasters are only for this preview; keep them out of database audit JSON.
export function ocrAuditResult(result) {
  if (!result) return {};
  return {
    ...result,
    ocr_pages: (result.ocr_pages || []).map((page) => ({
      page_index: page.page_index, width: page.width, height: page.height,
    })),
  };
}
