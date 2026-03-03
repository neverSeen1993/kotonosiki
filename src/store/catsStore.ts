import { create } from 'zustand';
import { Cat } from '../types';
import { loadCats, saveCats } from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

interface CatsState {
  cats: Cat[];
  addCat: (cat: Omit<Cat, 'id' | 'createdAt'>) => Cat;
  updateCat: (id: string, updates: Partial<Omit<Cat, 'id' | 'createdAt'>>) => void;
  deleteCat: (id: string) => void;
  getCatById: (id: string) => Cat | undefined;
}

export const useCatsStore = create<CatsState>((set, get) => ({
  cats: loadCats(),

  addCat: (data) => {
    const cat: Cat = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const cats = [...get().cats, cat];
    set({ cats });
    saveCats(cats);
    return cat;
  },

  updateCat: (id, updates) => {
    const cats = get().cats.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ cats });
    saveCats(cats);
  },

  deleteCat: (id) => {
    const cats = get().cats.filter((c) => c.id !== id);
    set({ cats });
    saveCats(cats);
  },

  getCatById: (id) => get().cats.find((c) => c.id === id),
}));
