'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'

type Profile = { id: string; full_name?: string|null; role: 'student'|'tutor'|'admin'; username?: string|null }

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const didInit = useRef(false)

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, username')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data as Profile)
  }

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    ;(async () => {
      // Fast local session read (no network)
      const { data: { session } } = await supabase.auth.getSession()
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      setLoading(false)
    })()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      else setProfile(null)
    })
    return () => { subscription.unsubscribe() }
  }, [])

  if (loading) return <div className="w-20 h-9" />

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/sign-in" className="px-4 py-2 rounded-2xl border border-slate-300 text-slate-800 hover:bg-slate-50">
          Sign in
        </Link>
        <Link href="/auth/sign-up" className="px-4 py-2 rounded-2xl bg-black text-white hover:opacity-90">
          Sign up
        </Link>
      </div>
    )
  }

  const name = profile.full_name || user.email || 'You'
  const initial = (name[0] || 'U').toUpperCase()

  const role = profile.role

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-black text-white grid place-items-center shadow-sm hover:opacity-90"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-64 rounded-xl border
            bg-white text-slate-800 shadow-lg ring-1 ring-black/5
            dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700
            z-50
          "
        >
          <div className="px-4 py-3 text-sm">
            <div className="font-medium truncate">{name}</div>
            <div className="text-slate-500 dark:text-slate-400">· <b className="uppercase">{role}</b></div>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          <MenuLink href="/" label="Home" />
          {role === 'student' && (
            <>
              <MenuLink href="/student/request-new" label="New request" />
              <MenuLink href="/student/bookings" label="My bookings & payments" />
              <MenuLink href="/tutor/apply" label="Become a tutor" />
            </>
          )}
          {role === 'tutor' && (
            <>
              <MenuLink href="/tutor/feed" label="Tutor feed" />
              {user && <MenuLink href={`/tutor/${user.id}`} label="Tutor profile" />}
              <MenuLink href="/tutor/profile" label="Edit profile" />
            </>
          )}
          {role === 'admin' && (
            <>
              <MenuLink href="/admin/dashboard" label="Admin · Dashboard" />
              <MenuLink href="/admin/applications" label="Admin · Applications" />
            </>
          )}

          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <a
            href="/auth/sign-out"
            className="block w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Sign out
          </a>
        </div>
      )}
    </div>
  )
}

function MenuLink({ href, label, disabled = false }:{
  href: string; label: string; disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="px-4 py-2 text-slate-400 dark:text-slate-500 cursor-not-allowed select-none">
        {label}
      </div>
    )
  }
  return (
    <Link
      href={href}
      className="
        block px-4 py-2 hover:bg-slate-100 hover:text-slate-900
        dark:hover:bg-slate-800/70 dark:hover:text-white
        focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800/70
      "
    >
      {label}
    </Link>
  )
}


