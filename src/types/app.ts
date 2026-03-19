import type { HelperLocation } from './communication';

export type UserRole = 'patient' | 'caregiver';

export type AuthMode = 'demo' | 'magic_link' | 'password';

export type DemoMode = 'demo' | 'connected';

export interface AppConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  oneSignalAppId?: string;
  hasSupabase: boolean;
  hasOneSignal: boolean;
  mode: DemoMode;
  isLocalWeb: boolean;
  enablePasswordAuth: boolean;
  showPatientHeaderChrome: boolean;
}

export interface AppSession {
  profileId: string;
  role: UserRole;
  email: string | null;
  authMode: AuthMode;
  displayName: string;
}

export interface Pairing {
  id: string;
  code: string;
  patientId: string;
  caregiverId: string | null;
  status: 'pending' | 'paired';
  createdAt: string;
}

export interface StatusUpdate {
  id: string;
  patientId: string;
  caregiverId: string | null;
  helperLocation: HelperLocation;
  selectedNeeds: string[];
  energyStatus: string | null;
  selectedSymptoms: string[];
  messageText: string;
  sentAt: string;
  delivery: 'sent' | 'draft';
}

export interface NotificationPreference {
  userId: string;
  pushEnabled: boolean;
  localRemindersEnabled: boolean;
}

export interface CommunicationSubmission {
  type?: 'status' | 'need' | 'message';
  helperLocation?: HelperLocation;
  selectedNeeds?: string[];
  need?: string;
  energy?: string;
  energyStatus?: string | null;
  selectedSymptoms?: string[];
  symptoms?: string[];
  message?: string;
  messageText?: string;
}
