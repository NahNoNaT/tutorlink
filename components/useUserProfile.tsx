'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'

export type ProfileRow = { id: string; role: 'student'|'tutor'|'admin'; full_name: string|null }

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{(async()=>{
    const { data:{ user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setProfile(data as ProfileRow | null)
    }
    setLoading(false)
  })()},[])

  return { user, profile, loading }
}
