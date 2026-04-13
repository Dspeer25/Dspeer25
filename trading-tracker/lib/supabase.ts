import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(url, key);

/** Each browser gets a stable random ID so data is isolated per person */
function getUserId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("trading-user-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("trading-user-id", id);
  }
  return id;
}

/**
 * Load a value. Priority:
 *  1. User-namespaced localStorage  (normal path)
 *  2. Old un-namespaced localStorage (migration from pre-userId era)
 *  3. Supabase                       (migration from cloud era)
 */
export async function getData<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  const uid = getUserId();
  const nsKey = `${uid}:${key}`;

  // 1. Already migrated / normal path
  try {
    const local = localStorage.getItem(nsKey);
    if (local) return JSON.parse(local) as T;
  } catch {}

  // 2. Old localStorage key (no userId prefix) — migrate it
  try {
    const old = localStorage.getItem(key);
    if (old) {
      localStorage.setItem(nsKey, old);
      localStorage.removeItem(key);
      return JSON.parse(old) as T;
    }
  } catch {}

  // 3. Supabase — one-time cloud migration for existing user
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!error && data) {
      const val = data.value as T;
      localStorage.setItem(nsKey, JSON.stringify(val));
      return val;
    }
  } catch {}

  return null;
}

/** Persist a value in the user's own localStorage bucket */
export async function setData<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;
  const uid = getUserId();
  try {
    localStorage.setItem(`${uid}:${key}`, JSON.stringify(value));
  } catch {}
}
