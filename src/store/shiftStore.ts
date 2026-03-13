import { create } from 'zustand';
import { Shift } from '../types';
import { api } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface ShiftState {
  shifts: Shift[];
  loaded: boolean;
  loadShifts: () => Promise<void>;
  addShift: (shift: Omit<Shift, 'id' | 'createdAt'>) => Promise<Shift>;
  updateShift: (id: string, updates: Partial<Omit<Shift, 'id' | 'createdAt'>>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  shifts: [],
  loaded: false,

  loadShifts: async () => {
    const shifts = await api.get<Shift[]>('/shifts');
    set({ shifts, loaded: true });
  },

  addShift: async (data) => {
    const shift: Shift = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    await api.post('/shifts', shift);
    set({ shifts: [...get().shifts, shift] });
    return shift;
  },

  updateShift: async (id, updates) => {
    await api.put(`/shifts/${id}`, updates);
    set({ shifts: get().shifts.map((s) => (s.id === id ? { ...s, ...updates } : s)) });
  },

  deleteShift: async (id) => {
    await api.del(`/shifts/${id}`);
    set({ shifts: get().shifts.filter((s) => s.id !== id) });
  },
}));
