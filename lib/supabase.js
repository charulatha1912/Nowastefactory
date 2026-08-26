import { createClient } from '@supabase/supabase-js'
 
const supabaseUrl = 'https://wipnveuggafmstyafgxn.supabase.co'
const supabaseAnonKey = 'sb_publishable_CxyotqrW0upEYZF8lAFGXQ_spoEGZ1r'


 
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
