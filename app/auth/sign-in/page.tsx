'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/browser'
import Link from 'next/link'

export default function SignInPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      let emailToUse = login.trim()
      const isEmail = emailToUse.includes('@')
      if (!isEmail) {
        const uname = emailToUse.toLowerCase()
        const res = await fetch('/api/auth/username-to-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uname }),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          const reason = payload?.reason
          const msgMap: Record<string, string> = {
            invalid_username: 'Username is invalid',
            not_found: 'Username not found',
            lookup_failed: 'Unable to look up username. Please try again.',
            bad_request: 'Request is invalid',
          }
          setMsg(reason && msgMap[reason] ? msgMap[reason] : 'Username not found')
          setLoading(false)
          return
        }
        const payload = await res.json().catch(() => null)
        if (!payload?.email) {
          setMsg('Username not found')
          setLoading(false)
          return
        }
        emailToUse = payload.email
      }

      const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password })
      if (error) {
        setMsg(error.message)
        setLoading(false)
        return
      }

      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Email or username"
          value={login}
          onChange={e => setLogin(e.target.value)}
          required
        />
        <input
          className="w-full border px-3 py-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button disabled={loading} className="w-full px-4 py-2 rounded-2xl bg-black text-white">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </form>

      <p className="text-sm text-slate-600 mt-3">
        Don&apos;t have an account? <Link href="/auth/sign-up" className="underline">Sign up</Link>
      </p>
    </div>
  )
}