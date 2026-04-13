import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(url, key);

// Expose debug helper on window so you can call window.debugSupabase() in browser console
if (typeof window !== "undefined") {
  (window as any).debugSupabase = async () => {
    console.log("=== SUPABASE DEBUG ===");
    console.log("URL:", url);
    console.log("Key starts with:", key?.slice(0, 20));
    const { data, error } = await supabase.from("app_data").select("key");
    console.log("Keys in DB:", data?.map((r: any) => r.key));
    console.log("Error:", error);
    console.log("=== END DEBUG ===");
    return { data, error };
  };
}

/** Load from localStorage, fall back to Supabase once to migrate existing data */
export async function getData<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;

  // Normal path
  try {
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local) as T;
  } catch {}

  // One-time migration from Supabase → save to localStorage
  try {
    console.log("[supabase] fetching", key);
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    console.log("[supabase]", key, "→", error ? "ERROR:" + error.message : data ? "found" : "empty");
    if (!error && data) {
      const val = data.value as T;
      localStorage.setItem(key, JSON.stringify(val));
      return val;
    }
  } catch (e) {
    console.error("[supabase] exception fetching", key, e);
  }

  return null;
}

/** Save to localStorage only */
export async function setData<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
