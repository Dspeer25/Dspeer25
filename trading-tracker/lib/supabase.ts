import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(url, key);

/** Load from localStorage (fast), fall back to Supabase */
export async function getData<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;

  try {
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local) as T;
  } catch {}

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

/** Save to localStorage immediately, sync to Supabase in background */
export async function setData<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  try {
    await supabase
      .from("app_data")
      .upsert({ key, value }, { onConflict: "key" });
  } catch {}
}
