import { create } from 'zustand';
import { templateService } from '../services/templateService';

export const useTemplateStore = create((set) => ({
  templates: [],
  isLoading: false,

  fetchTemplates: async () => {
    set({ isLoading: true });
    try {
      const res = await templateService.list();
      set({ templates: res.data.data || [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createTemplate: async (data) => {
    const res = await templateService.create(data);
    const newTemplate = res.data.data;
    set((state) => ({ templates: [...state.templates, newTemplate] }));
    return newTemplate;
  },

  deleteTemplate: async (id) => {
    await templateService.delete(id);
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
}));
