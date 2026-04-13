import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

/** Load a stored value by key */
export async function getData<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("app_data")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data.value as T;
}

/** Persist a value by key */
export async function setData<T>(key: string, value: T): Promise<void> {
  await supabase
    .from("app_data")
    .upsert({ key, value }, { onConflict: "key" });
}
