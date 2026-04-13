import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(url, key);

/**
 * Load a value.
 * 1. Check localStorage first (normal path + where friends' data lives)
 * 2. Fall back to Supabase once to migrate existing data, then save to localStorage
 */
export async function getData<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;

  // Normal path — data already in this browser
  try {
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local) as T;
  } catch {}

  // One-time migration: pull from Supabase and save locally
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!error && data) {
      const val = data.value as T;
      localStorage.setItem(key, JSON.stringify(val));
      return val;
    }
  } catch {}

  return null;
}

/** Save to localStorage — data lives on this computer, no account needed */
export async function setData<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
