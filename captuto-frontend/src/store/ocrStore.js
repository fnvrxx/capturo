import { create } from 'zustand';

export const useOcrStore = create((set) => ({
  selectedTemplate: null,
  uploadedFile: null,
  tempJsonData: null,
  autoFillData: [],

  setTemplate: (template) => set({ selectedTemplate: template }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setTempJson: (data) => set({ tempJsonData: data }),
  setAutoFillData: (data) => set({ autoFillData: data }),

  resetOcr: () =>
    set({
      selectedTemplate: null,
      uploadedFile: null,
      tempJsonData: null,
      autoFillData: [],
    }),
}));
