import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient | null {
  if (!_serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return null;
    }
    _serviceClient = createClient(url, key);
  }
  return _serviceClient;
}
