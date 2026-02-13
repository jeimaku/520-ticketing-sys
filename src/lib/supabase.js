import { createClient } from '@supabase/supabase-js'

// Import environment variables using Vite's import.meta.env object
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)