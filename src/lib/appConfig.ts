import type { AppConfig } from '../types/app';
import { isNativeApp } from './nativeAuth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
const showPatientHeaderChrome = import.meta.env.VITE_SHOW_PATIENT_HEADER_CHROME !== 'false';
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalWeb = !isNativeApp() && (hostname === 'localhost' || hostname === '127.0.0.1');

export const appConfig: AppConfig = {
  supabaseUrl,
  supabaseAnonKey,
  oneSignalAppId,
  hasSupabase: Boolean(supabaseUrl && supabaseAnonKey),
  hasOneSignal: Boolean(oneSignalAppId),
  mode: supabaseUrl && supabaseAnonKey ? 'connected' : 'demo',
  isLocalWeb,
  enablePasswordAuth: isLocalWeb && Boolean(supabaseUrl && supabaseAnonKey),
  showPatientHeaderChrome,
};
