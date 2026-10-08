import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client, or `null` when the backend is not configured. The app is
 * local-first: everything works on the device, and an account only adds
 * backup and sync across devices.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: typeof window !== 'undefined' || Platform.OS !== 'web',
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

export const isBackendConfigured = supabase !== null;
