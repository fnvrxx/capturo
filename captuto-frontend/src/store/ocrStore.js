import { create } from 'zustand';
import { lineConfidence, pageLines } from '../utils/ocrPreview.js';

export const useOcrStore = create((set) => ({
  selectedTemplate: null,
  uploadedFile: null,
  ocrResult: null,
  queue: [],
  activeIndex: 0,
  assignBoxToField: (fieldName, pageIndex, lineIndex) => set((state) => {
    const result = state.ocrResult;
    if (!result || !state.selectedTemplate?.fields.some((field) => field.name === fieldName)) return state;
    if (state.queue[state.activeIndex]?.status === 'saved') return state;
    const pages = result.ocr_pages || [];
    const lines = pageLines(result, pageIndex);
    const line = lines?.[lineIndex];
    if (!line || !String(line.text ?? '').trim()) return state;
    const next = {
      ...result,
      original_raw_fields: result.original_raw_fields ?? { ...result.raw_fields },
      raw_fields: { ...result.raw_fields, [fieldName]: String(line.text) },
      confidence_scores: { ...result.confidence_scores, [fieldName]: lineConfidence(line.confidence) },
      manual_mappings: {
        ...result.manual_mappings,
        [fieldName]: { page_index: pages[pageIndex]?.page_index ?? pageIndex, line_index: lineIndex, line_id: line.id ?? null, text: String(line.text), bbox: line.bbox, confidence: lineConfidence(line.confidence) },
      },
    };
    return { ocrResult: next, queue: state.queue.map((item, index) => index === state.activeIndex ? { ...item, result: next } : item) };
  }),
  setQueue: (queue) => set({ queue, activeIndex: 0, uploadedFile: queue[0]?.file, ocrResult: queue[0]?.result }),
  selectItem: (index) => set((state) => ({ activeIndex: index, uploadedFile: state.queue[index]?.file, ocrResult: state.queue[index]?.result })),
  updateItem: (index, changes) => set((state) => ({ queue: state.queue.map((item, i) => i === index ? { ...item, ...changes } : item) })),

  setTemplate: (template) => set({ selectedTemplate: template }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setOcrResult: (data) => set({ ocrResult: data }),

  resetOcr: () =>
    set({
      selectedTemplate: null,
      uploadedFile: null,
      ocrResult: null,
      queue: [],
      activeIndex: 0,
    }),
}));
