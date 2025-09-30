import { supabaseServer } from '@/lib/supabase/server'

export type Role = 'student' | 'tutor' | 'admin'

export async function getUserAndProfile() {
  const sb = await supabaseServer() // ✅ await
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile }
}
