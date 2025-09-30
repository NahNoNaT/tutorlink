'use client'
// Edit Tutor Public Profile + inline preview
import { useEffect, useState } from 'react'
import ButtonLink from '@/components/ui/ButtonLink'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { supabase } from '@/lib/supabase/browser'
import { useEnsureProfile } from '@/components/useEnsureProfile'

type TutorProfileRow = {
  tutor_id: string
  subjects: string[]
  districts: string[]
  price_per_hour: number
  bio: string | null
  verified: boolean | null
  rating_avg: number | null
  rating_count: number | null
}

const DANANG_DISTRICTS = [
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
  'Hòa Vang',
  'Hoàng Sa',
]

export default function TutorProfile() {
  const ready = useEnsureProfile('tutor')
  const [row, setRow] = useState<TutorProfileRow | null>(null)
  const [fullName, setFullName] = useState('Tutor')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [onboarding, setOnboarding] = useState(false)
  // preview-only data no longer shown; keep minimal form

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Please sign in'); return }

    // idempotent upsert to ensure a row exists
    await supabase.from('tutor_profiles').upsert(
      { tutor_id: user.id, subjects: [], districts: [], price_per_hour: 200000, bio: null },
      { onConflict: 'tutor_id' }
    )

    const { data, error } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('tutor_id', user.id)
      .maybeSingle()
    if (error) setMsg(error.message)
    setRow(data as TutorProfileRow)

    const { data: pf } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    setFullName(((pf || {}) as { full_name?: string | null }).full_name || 'Tutor')

    // no preview data fetch here
  })() }, [])

  const save = async () => {
    if (!row) return
    setSaving(true); setMsg('')
    const payload = {
      subjects: (row.subjects || []).map(s => s.trim()).filter(Boolean),
      districts: (row.districts || []).map(s => s.trim()).filter(Boolean),
      price_per_hour: Number(row.price_per_hour) || 200000,
      bio: row.bio || null,
    }
    const { error } = await supabase
      .from('tutor_profiles')
      .upsert({ tutor_id: row.tutor_id, ...payload }, { onConflict: 'tutor_id' })
    if (!error) {
      await supabase.from('profiles').update({ full_name: fullName || null }).eq('id', row.tutor_id)
    }
    setMsg(error ? error.message : 'Saved!')
    setSaving(false)
  }

  if (!ready) return <LoadingScreen label="" full={false} />
  if (!row) return <LoadingScreen label="" full={false} />

  const fmtVnd = (n?: number | null) => new Intl.NumberFormat('vi-VN').format(Math.max(0, n || 0)) + ' VND'
  // helpers

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-slate-100">
      <div className="mb-4 flex gap-2">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/tutor/feed" variant="outline">Go to feed</ButtonLink>
        {row?.tutor_id && (
          <ButtonLink href={`/tutor/${row.tutor_id}`} variant="outline">View public profile</ButtonLink>
        )}
      </div>

      <h2 className="text-xl font-semibold text-white">Edit public profile</h2>

      <form className="grid gap-3 mt-3" onSubmit={(e)=>{e.preventDefault(); save();}}>
        <div>
          <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Full name</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Your full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Subjects</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="e.g. Toan 12, Ly 11"
            value={(row.subjects || []).join(', ')}
            onChange={e => setRow({ ...row, subjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Districts (Đà Nẵng)</label>
          <p className="text-xs text-slate-400 mb-2 pl-3">Chọn nhiều quận bạn có thể nhận dạy.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DANANG_DISTRICTS.map((d) => {
              const checked = (row.districts || []).includes(d)
              return (
                <label key={d} className="cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => {
                      const set = new Set(row.districts || [])
                      if (e.target.checked) set.add(d)
                      else set.delete(d)
                      setRow({ ...row, districts: Array.from(set) })
                    }}
                  />
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:border-white/20 peer-checked:border-teal-400/60 peer-checked:bg-teal-500/10 peer-checked:text-teal-200 text-center">
                    <span className="truncate block">{d}</span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Price per hour</label>
          <div className="flex items-stretch rounded-xl border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-teal-400">
            <input
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              type="number" min={1}
              value={Math.max(1, Math.floor((row.price_per_hour||0)/1000))}
              onChange={e => setRow({ ...row, price_per_hour: Math.max(1, Number(e.target.value||'1'))*1000 })}
              placeholder="Price per hour"
            />
            <span className="px-3 py-2 text-sm text-slate-400 border-l border-white/10">.000 VND</span>
          </div>
          <p className="text-xs text-slate-400 pl-3 mt-1">≈ {fmtVnd(row.price_per_hour)} / hour</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Bio</label>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 min-h-[120px] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Short introduction"
            value={row.bio || ''}
            onChange={e => setRow({ ...row, bio: e.target.value })}
          />
        </div>
        <div>
          <button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 px-4 py-2 text-slate-900 font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {msg && <p className="mt-2 text-sm text-slate-400">{msg}</p>}
        </div>
      </form>

      {process.env.NEXT_PUBLIC_ENABLE_STRIPE === '1' && (
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Nhận tiền (payouts)</h3>
        <p className="text-sm text-slate-300 mb-3">Kết nối tài khoản Stripe để nhận tiền sau mỗi buổi học.</p>
        <button
          className="rounded-2xl bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={onboarding}
          onClick={async () => {
            setOnboarding(true)
            try {
              const res = await fetch('/api/payments/onboard', { method: 'POST' })
              let json: any = null
              const ct = res.headers.get('content-type') || ''
              if (ct.includes('application/json')) {
                json = await res.json().catch(() => null)
              }
              if (!res.ok) {
                setMsg((json && (json.message || json.reason)) || `Onboard failed (${res.status})`)
                return
              }
              if (json?.url) {
                window.location.href = json.url
              } else {
                setMsg('Onboard response missing URL')
              }
            } catch (e: unknown) {
              const err = e instanceof Error ? e.message : 'Unexpected error'
              setMsg(err)
            } finally {
              setOnboarding(false)
            }
          }}
        >{onboarding ? 'Đang mở...' : 'Bật nhận tiền với Stripe'}</button>
      </div>
      )}
    </div>
  )
}
