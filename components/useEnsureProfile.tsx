'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'

export function useEnsureProfile(desiredRole: 'student' | 'tutor') {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase
          .from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (!p) {
          await supabase.from('profiles').insert({
            id: user.id, role: desiredRole, full_name: user.email
          })
        }
      }
      setReady(true)
    })()
  }, [desiredRole])
  return ready
}
