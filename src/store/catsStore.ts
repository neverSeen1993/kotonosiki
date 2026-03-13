import { create } from 'zustand';
import { Cat } from '../types';
import { api } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface CatsState {
  cats: Cat[];
  loaded: boolean;
  loadCats: () => Promise<void>;
  addCat: (cat: Omit<Cat, 'id' | 'createdAt'>) => Promise<Cat>;
  updateCat: (id: string, updates: Partial<Omit<Cat, 'id' | 'createdAt'>>) => Promise<void>;
  updateCatAdoption: (id: string, updates: Pick<Partial<Cat>, 'adoption' | 'adoptionNotes'>) => Promise<void>;
  deleteCat: (id: string) => Promise<void>;
  getCatById: (id: string) => Cat | undefined;
}

export const useCatsStore = create<CatsState>((set, get) => ({
  cats: [],
  loaded: false,

  loadCats: async () => {
    const cats = await api.get<Cat[]>('/cats');
    set({ cats, loaded: true });
  },

  addCat: async (data) => {
    const existing = get().cats;
    const trimmed = data.name.trim().toLowerCase();
    if (existing.some((c) => c.name.trim().toLowerCase() === trimmed)) {
      throw new Error(`Кіт з іменем "${data.name}" вже існує`);
    }
    const cat: Cat = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    await api.post('/cats', cat);
    set({ cats: [...get().cats, cat] });
    return cat;
  },

  updateCat: async (id, updates) => {
    await api.put(`/cats/${id}`, updates);
    set({
      cats: get().cats.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...updates };
        // Remove keys explicitly set to null (cleared fields)
        for (const key of Object.keys(updates)) {
          if ((updates as Record<string, unknown>)[key] === null) {
            delete (merged as Record<string, unknown>)[key];
          }
        }
        return merged as Cat;
      }),
    });
  },

  updateCatAdoption: async (id, updates) => {
    await api.put(`/cats/${id}/adoption`, updates);
    set({
      cats: get().cats.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...updates };
        for (const key of Object.keys(updates)) {
          if ((updates as Record<string, unknown>)[key] === null) {
            delete (merged as Record<string, unknown>)[key];
          }
        }
        return merged as Cat;
      }),
    });
  },

  deleteCat: async (id) => {
    await api.del(`/cats/${id}`);
    set({ cats: get().cats.filter((c) => c.id !== id) });
  },

  getCatById: (id) => get().cats.find((c) => c.id === id),
}));
