import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(url, key);

/** Load from localStorage only — no shared database fallback */
export async function getData<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local) as T;
  } catch {}
  return null;
}

/** Save to localStorage only */
export async function setData<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
