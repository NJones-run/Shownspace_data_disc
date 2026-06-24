import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    db: {
      schema: "data_disc"
    },
    auth: {
      persistSession: false
    }
  });
}
