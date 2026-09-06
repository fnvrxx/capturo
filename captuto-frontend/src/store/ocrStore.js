import { create } from 'zustand';

export const useOcrStore = create((set) => ({
  selectedTemplate: null,
  uploadedFile: null,
  ocrResult: null,

  setTemplate: (template) => set({ selectedTemplate: template }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setOcrResult: (data) => set({ ocrResult: data }),

  resetOcr: () =>
    set({
      selectedTemplate: null,
      uploadedFile: null,
      ocrResult: null,
    }),
}));
