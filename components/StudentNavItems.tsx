'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'

export default function StudentNavItems() {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) { setRole(null); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle()
      setRole((p as any)?.role || null)
    })()
  }, [])

  if (role !== 'student') return null
  return (
    <Link prefetch href="/student/bookings" className="hidden md:inline-block text-sm text-slate-300 hover:text-white">
      My bookings
    </Link>
  )
}

