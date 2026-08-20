import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project: Settings > API.
// Set them as environment variables (see .env.example) — never hard-code
// real keys into a file that gets committed to a public repo.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Copy .env.example to .env and fill in your project's URL and anon key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
