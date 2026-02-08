import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vujngwincyvyxzhitgsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1am5nd2luY3l2eXh6aGl0Z3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk5ODgsImV4cCI6MjA4NjA0NTk4OH0.0Q-M_KTmeTXX-8gN-8JRJORIQNspMso-_TMkQH0if_g'

export const supabase = createClient(supabaseUrl, supabaseKey)