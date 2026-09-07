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
  avatarIcon: string | null;
}

export type ConnectionType = 'caregiver' | 'patient_friend';
export type ConnectionStatus = 'pending' | 'active' | 'declined';

export interface Connection {
  id: string;
  patientId: string;
  followerId: string;
  connectionType: ConnectionType;
  status: ConnectionStatus;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  /** Denormalized from profiles — populated when fetching connection lists */
  patientDisplayName?: string;
  patientAvatarIcon?: string | null;
  followerDisplayName?: string;
  followerAvatarIcon?: string | null;
}

export type NeedPriority = 'when_you_can' | 'soon' | 'asap';

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
  needPriority?: NeedPriority | null;
  /** null = broadcast to all active helpers; non-null = targeted helper profile IDs */
  targetedFollowerIds?: string[] | null;
  completedAt?: string | null;
  completedBy?: string | null;
  /** Denormalized — populated on friend feed updates */
  patientDisplayName?: string;
  patientAvatarIcon?: string | null;
}

export interface CaregiverResponse {
  id: string;
  statusUpdateId: string;
  caregiverId: string;
  caregiverDisplayName?: string;
  message: string;
  seenAt: string | null;
  createdAt: string;
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
  needPriority?: NeedPriority | null;
  /** null = all helpers; array of profile IDs = targeted send */
  targetedFollowerIds?: string[] | null;
}
