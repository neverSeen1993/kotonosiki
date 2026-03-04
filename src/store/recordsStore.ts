import { create } from 'zustand';
import { MedicalRecord, RecordType } from '../types';
import { api } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface RecordsState {
  records: MedicalRecord[];
  loaded: boolean;
  loadRecords: () => Promise<void>;
  addRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt'>) => Promise<MedicalRecord>;
  updateRecord: (id: string, updates: Partial<Omit<MedicalRecord, 'id' | 'createdAt'>>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordsByCat: (catId: string) => MedicalRecord[];
  getRecordsByCatAndType: (catId: string, type: RecordType) => MedicalRecord[];
  deleteRecordsByCat: (catId: string) => Promise<void>;
  getUpcomingAppointments: () => MedicalRecord[];
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  loaded: false,

  loadRecords: async () => {
    const records = await api.get<MedicalRecord[]>('/records');
    set({ records, loaded: true });
  },

  addRecord: async (data) => {
    const record: MedicalRecord = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    await api.post('/records', record);
    set({ records: [...get().records, record] });
    return record;
  },

  updateRecord: async (id, updates) => {
    await api.put(`/records/${id}`, updates);
    set({ records: get().records.map((r) => (r.id === id ? { ...r, ...updates } : r)) });
  },

  deleteRecord: async (id) => {
    await api.del(`/records/${id}`);
    set({ records: get().records.filter((r) => r.id !== id) });
  },

  getRecordsByCat: (catId) =>
    get().records.filter((r) => r.catId === catId).sort((a, b) => b.date.localeCompare(a.date)),

  getRecordsByCatAndType: (catId, type) =>
    get().records.filter((r) => r.catId === catId && r.type === type).sort((a, b) => b.date.localeCompare(a.date)),

  deleteRecordsByCat: async (catId) => {
    const toDelete = get().records.filter((r) => r.catId === catId);
    await Promise.all(toDelete.map((r) => api.del(`/records/${r.id}`)));
    set({ records: get().records.filter((r) => r.catId !== catId) });
  },

  getUpcomingAppointments: () =>
    get().records.filter((r) => r.type === 'appointment' && r.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date)),
}));
