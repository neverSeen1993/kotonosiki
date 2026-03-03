import { create } from 'zustand';
import { MedicalRecord, RecordType } from '../types';
import { loadRecords, saveRecords } from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

interface RecordsState {
  records: MedicalRecord[];
  addRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt'>) => MedicalRecord;
  updateRecord: (id: string, updates: Partial<Omit<MedicalRecord, 'id' | 'createdAt'>>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByCat: (catId: string) => MedicalRecord[];
  getRecordsByCatAndType: (catId: string, type: RecordType) => MedicalRecord[];
  deleteRecordsByCat: (catId: string) => void;
  getUpcomingAppointments: () => MedicalRecord[];
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: loadRecords(),

  addRecord: (data) => {
    const record: MedicalRecord = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const records = [...get().records, record];
    set({ records });
    saveRecords(records);
    return record;
  },

  updateRecord: (id, updates) => {
    const records = get().records.map((r) => (r.id === id ? { ...r, ...updates } : r));
    set({ records });
    saveRecords(records);
  },

  deleteRecord: (id) => {
    const records = get().records.filter((r) => r.id !== id);
    set({ records });
    saveRecords(records);
  },

  getRecordsByCat: (catId) =>
    get()
      .records.filter((r) => r.catId === catId)
      .sort((a, b) => b.date.localeCompare(a.date)),

  getRecordsByCatAndType: (catId, type) =>
    get()
      .records.filter((r) => r.catId === catId && r.type === type)
      .sort((a, b) => b.date.localeCompare(a.date)),

  deleteRecordsByCat: (catId) => {
    const records = get().records.filter((r) => r.catId !== catId);
    set({ records });
    saveRecords(records);
  },

  getUpcomingAppointments: () =>
    get()
      .records.filter((r) => r.type === 'appointment' && r.status === 'scheduled')
      .sort((a, b) => a.date.localeCompare(b.date)),
}));
