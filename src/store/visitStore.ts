import { create } from 'zustand';
import { Visit } from '../types';
import { api } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface VisitState {
  visits: Visit[];
  loaded: boolean;
  loadVisits: () => Promise<void>;
  addVisit: (visit: Omit<Visit, 'id' | 'createdAt'>) => Promise<Visit>;
  updateVisit: (id: string, updates: Partial<Omit<Visit, 'id' | 'createdAt'>>) => Promise<void>;
  deleteVisit: (id: string) => Promise<void>;
}

export const useVisitStore = create<VisitState>((set, get) => ({
  visits: [],
  loaded: false,

  loadVisits: async () => {
    const visits = await api.get<Visit[]>('/visits');
    set({ visits, loaded: true });
  },

  addVisit: async (data) => {
    const visit: Visit = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    await api.post('/visits', visit);
    set({ visits: [...get().visits, visit] });
    return visit;
  },

  updateVisit: async (id, updates) => {
    await api.put(`/visits/${id}`, updates);
    set({ visits: get().visits.map((v) => (v.id === id ? { ...v, ...updates } : v)) });
  },

  deleteVisit: async (id) => {
    await api.del(`/visits/${id}`);
    set({ visits: get().visits.filter((v) => v.id !== id) });
  },
}));
