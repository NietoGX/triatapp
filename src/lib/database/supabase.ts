import { createClient } from "@supabase/supabase-js";

// These values should be stored in environment variables in a production environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase URL or Anon Key is missing. Please check your environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
