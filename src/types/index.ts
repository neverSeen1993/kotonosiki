export interface Cat {
  id: string;
  name: string;
  breed: string;
  birthDate: string; // ISO date string
  sex: 'male' | 'female';
  color: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
}

export type RecordType = 'procedure' | 'vaccination' | 'appointment';
export type RecordStatus = 'done' | 'scheduled' | 'cancelled';

export interface MedicalRecord {
  id: string;
  catId: string;
  type: RecordType;
  title: string;
  date: string; // ISO date string
  vet?: string;
  clinic?: string;
  notes?: string;
  status: RecordStatus;
  nextDueDate?: string;
  createdAt: string;
}
