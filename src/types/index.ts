export type CatLocation = 'big_room' | 'quarantine' | 'kids_room' | 'foster_home';

export interface Patron {
  name: string;
  since: string;
  origin: string;
  instagram?: string;
  phone?: string;
}

export type TestResult = 'positive' | 'negative' | 'not_tested';

export interface Adoption {
  date: string;          // ISO date
  from: string;          // how/where adopted from
  email?: string;
  phone1?: string;
  phone2?: string;
  instagram?: string;
}

export interface PromotionLink {
  name: string;
  url: string;
}

export interface Promotion {
  website: boolean;
  gladpet?: string;
  happyPaw?: string;
  extraLinks?: PromotionLink[];
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
  sterilised?: boolean;
  patron?: Patron;
  adoption?: Adoption;
  adoptionNotes?: string;
  promotion?: Promotion;
  driveUrl?: string;
  notes?: string;
  createdAt: string;
}

export type RecordType = 'procedure' | 'vaccination' | 'appointment' | 'treatment' | 'surgery';
export type RecordStatus = 'done' | 'scheduled' | 'cancelled' | 'ongoing';

export interface MedicalRecord {
  id: string;
  catId: string;
  type: RecordType;
  title: string;
  date: string; // ISO date string
  vet?: string;
  clinic?: string;
  notes?: string;
  doneNotes?: string;   // notes added when marking as done — separate from the record's own notes
  status: RecordStatus;
  nextDueDate?: string;
  scheduledTime?: string; // HH:MM for appointments
  photoUrl?: string;      // photo link, e.g. when marking done
  // treatment-specific
  description?: string;
  drug?: string;
  dosage?: string;
  dateEnd?: string;
  special?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'helper' | 'viewer';

export interface WeightEntry {
  id: string;
  catId: string;
  date: string; // ISO date
  weightKg: number;
  notes?: string;
  createdAt: string;
}

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

export interface Visit {
  id: string;
  title: string;
  date: string;          // ISO date
  time?: string;         // HH:MM
  description?: string;
  visitor?: string;      // who is visiting
  phone?: string;
  catId?: string;        // optional link to a cat
  status: 'planned' | 'done' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export type ShiftType = 'half' | 'full';

export interface Shift {
  id: string;
  nannyName: string;      // котоняня name
  date: string;            // ISO date
  type: ShiftType;         // half = 4h, full = 8h
  extraHours?: number;     // additional hours on top
  notes?: string;
  createdAt: string;
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  entityId?: string;
  details: string;
  changes?: FieldChange[];
  snapshot?: Record<string, unknown>;
}

