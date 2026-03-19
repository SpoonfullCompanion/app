import { createClient } from '@supabase/supabase-js';
import { appConfig } from './appConfig';

export const supabase = appConfig.hasSupabase
  ? createClient(appConfig.supabaseUrl!, appConfig.supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
