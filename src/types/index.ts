export type CatLocation = 'big_room' | 'quarantine' | 'kids_room' | 'foster_home';

export interface Patron {
  name: string;
  since: string;
  origin: string;
  instagram?: string;
  phone?: string;
}

export type TestResult = 'positive' | 'negative';

export interface Adoption {
  date: string;          // ISO date
  from: string;          // how/where adopted from
  email?: string;
  phone1?: string;
  phone2?: string;
  instagram?: string;
}

export interface Cat {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  sex: 'male' | 'female';
  color: string;
  photoUrl?: string;
  arrivalDate?: string;
  location?: CatLocation;
  origin?: string;
  history?: string;
  fiv?: TestResult;
  felv?: TestResult;
  patron?: Patron;
  adoption?: Adoption;
  adoptionNotes?: string;
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

export type UserRole = 'admin' | 'helper';

export interface User {
  id: string;
  name: string;
  login: string;
  passwordHash: string; // simple btoa hash — good enough for a local app
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
}
