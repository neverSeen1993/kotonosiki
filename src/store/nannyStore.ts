import { create } from 'zustand';
import { Catnanny } from '../types';
import { api } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface NannyState {
  nannies: Catnanny[];
  loaded: boolean;
  loadNannies: () => Promise<void>;
  addNanny: (nanny: Omit<Catnanny, 'id' | 'createdAt'>) => Promise<Catnanny>;
  updateNanny: (id: string, updates: Partial<Omit<Catnanny, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNanny: (id: string) => Promise<void>;
  getNannyById: (id: string) => Catnanny | undefined;
}

export const useNannyStore = create<NannyState>((set, get) => ({
  nannies: [],
  loaded: false,

  loadNannies: async () => {
    const nannies = await api.get<Catnanny[]>('/nannies');
    set({ nannies, loaded: true });
  },

  addNanny: async (data) => {
    const nanny: Catnanny = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    await api.post('/nannies', nanny);
    set({ nannies: [...get().nannies, nanny] });
    return nanny;
  },

  updateNanny: async (id, updates) => {
    await api.put(`/nannies/${id}`, updates);
    set({
      nannies: get().nannies.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    });
  },

  deleteNanny: async (id) => {
    await api.del(`/nannies/${id}`);
    set({ nannies: get().nannies.filter((n) => n.id !== id) });
  },

  getNannyById: (id) => get().nannies.find((n) => n.id === id),
}));

