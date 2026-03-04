import { create } from 'zustand';
import { WeightEntry } from '../types';
import { api } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface WeightState {
  weights: WeightEntry[];
  loaded: boolean;
  loadWeights: () => Promise<void>;
  addWeight: (entry: Omit<WeightEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateWeight: (id: string, updates: Partial<Omit<WeightEntry, 'id' | 'createdAt'>>) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;
  getWeightsByCat: (catId: string) => WeightEntry[];
  deleteWeightsByCat: (catId: string) => Promise<void>;
}

export const useWeightStore = create<WeightState>((set, get) => ({
  weights: [],
  loaded: false,

  loadWeights: async () => {
    const weights = await api.get<WeightEntry[]>('/weights');
    set({ weights, loaded: true });
  },

  addWeight: async (data) => {
    const entry: WeightEntry = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    await api.post('/weights', entry);
    set({ weights: [...get().weights, entry] });
  },

  updateWeight: async (id, updates) => {
    await api.put(`/weights/${id}`, updates);
    set({ weights: get().weights.map((w) => (w.id === id ? { ...w, ...updates } : w)) });
  },

  deleteWeight: async (id) => {
    await api.del(`/weights/${id}`);
    set({ weights: get().weights.filter((w) => w.id !== id) });
  },

  getWeightsByCat: (catId) =>
    get().weights.filter((w) => w.catId === catId).sort((a, b) => b.date.localeCompare(a.date)),

  deleteWeightsByCat: async (catId) => {
    const toDelete = get().weights.filter((w) => w.catId === catId);
    await Promise.all(toDelete.map((w) => api.del(`/weights/${w.id}`)));
    set({ weights: get().weights.filter((w) => w.catId !== catId) });
  },
}));
