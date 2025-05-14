import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables if available, fallback to hardcoded values for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gqmvabykbzneyfjrcfxt.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXZhYnlrYnpuZXlmanJjZnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjU4MzEsImV4cCI6MjA2Mjc0MTgzMX0.2u6fqY1IZS_flxAxCfUH9xrNIsPd451eUxbRFAUGZ8w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);