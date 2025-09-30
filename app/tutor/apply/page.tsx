'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { supabase } from '../../../lib/supabase/browser'
import { useUserProfile } from '../../../components/useUserProfile'

const DANANG_DISTRICTS = [
  'Hai Chau',
  'Thanh Khe',
  'Son Tra',
  'Ngu Hanh Son',
  'Lien Chieu',
  'Cam Le',
  'Hoa Vang',
  'Hoang Sa',
]

const CHECKMARK = String.fromCharCode(0x2713)

type FormState = {
  full_name: string
  phone: string
  subjects: string
  districts: string[]
  price_per_hour: number
  bio: string
  evidence_url: string
}

export default function TutorApplyPage() {
  const router = useRouter()
  const { user, profile, loading } = useUserProfile()
  const [form, setForm] = useState<FormState>({
    full_name: '',
    phone: '',
    subjects: '',
    districts: [],
    price_per_hour: 200_000,
    bio: '',
    evidence_url: '',
  })
  const [msg, setMsg] = useState('')
  const [showPricePreview, setShowPricePreview] = useState(false)
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, n))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setMsg('Hay dang nhap')
      return
    }
    const payload = {
      user_id: user.id,
      full_name: form.full_name || profile?.full_name || user.email,
      email: user.email,
      phone: form.phone.startsWith('+84') ? form.phone : `+84 ${form.phone}`,
      subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
      districts: form.districts,
      price_per_hour: Number(form.price_per_hour) || 200_000,
      bio: form.bio,
      evidence_url: form.evidence_url,
      status: 'pending',
    }
    const { error } = await supabase.from('tutor_applications').insert(payload)
    if (error) {
      setMsg(error.message)
      return
    }

    try {
      await fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {}

    router.push('/tutor/apply/success')
  }

  if (loading) return <LoadingScreen label="" full={false} />

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl px-4 py-8 space-y-3">
      <h2 className="text-xl font-semibold text-white">Don xin tro thanh gia su</h2>
      {profile?.role === 'tutor' && <p className="text-green-500">Ban da la gia su.</p>}
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        placeholder="Ho ten"
        value={form.full_name}
        onChange={e => setForm({ ...form, full_name: e.target.value })}
      />
      <div className="flex items-stretch rounded-xl border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-teal-400">
        <span className="px-3 py-2 text-sm text-slate-400 border-r border-white/10 select-none">+84</span>
        <input
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          placeholder="So dien thoai"
          value={form.phone.replace(/^\+?84\s?/, '')}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        placeholder="Mon (vd: Toan, Ly)"
        value={form.subjects}
        onChange={e => setForm({ ...form, subjects: e.target.value })}
      />
      <DistrictPicker
        value={form.districts}
        onChange={districts => setForm({ ...form, districts })}
      />
      <div className="flex items-stretch rounded-xl border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-teal-400">
        <input
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          type="number"
          min={1}
          value={Math.max(1, Math.floor((form.price_per_hour || 0) / 1000))}
          onFocus={() => setShowPricePreview(false)}
          onBlur={() => setShowPricePreview(true)}
          onChange={e => {
            const k = Math.max(1, Number(e.target.value || '1'))
            setForm({ ...form, price_per_hour: k * 1000 })
          }}
          placeholder="Gia/gi"
        />
        <span className="px-3 py-2 text-sm text-slate-400 border-l border-white/10">.000 VND</span>
      </div>
      {showPricePreview && <p className="text-xs text-slate-400">So tien: {fmt(form.price_per_hour)} VND</p>}
      <textarea
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 min-h-[100px]"
        placeholder="Gioi thieu ngan"
        value={form.bio}
        onChange={e => setForm({ ...form, bio: e.target.value })}
      />
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        placeholder="Link chung chi/CV (tuy chon)"
        value={form.evidence_url}
        onChange={e => setForm({ ...form, evidence_url: e.target.value })}
      />
      <button className="rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 px-4 py-2 text-slate-900 font-semibold">
        Gui don
      </button>
      {msg && <p className="text-sm text-slate-400">{msg}</p>}
    </form>
  )
}

type DistrictPickerProps = {
  value: string[]
  onChange: (next: string[]) => void
}

function DistrictPicker({ value, onChange }: DistrictPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleOption = (district: string) => {
    const exists = value.includes(district)
    const next = exists ? value.filter(item => item !== district) : [...value, district]
    onChange(next)
  }

  const summary = value.length ? value.join(', ') : 'Chon khu vuc (Da Nang)'

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
        onClick={() => setOpen(prev => !prev)}
      >
        <div className="flex items-center gap-2">
          <span className="truncate">{summary}</span>
          <span className="ml-auto text-xs text-slate-400">
            {value.length ? `${value.length}/${DANANG_DISTRICTS.length}` : 'Bam de chon'}
          </span>
        </div>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/90 p-2 shadow-lg backdrop-blur space-y-2">
          {DANANG_DISTRICTS.map(district => {
            const checked = value.includes(district)
            const activeStyles = checked
              ? 'border-teal-500/40 bg-teal-500/15 text-teal-100 hover:bg-teal-500/25'
              : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/20 hover:bg-white/10'
            const checkStyles = checked
              ? 'border-teal-400 bg-teal-500/80 text-slate-900'
              : 'border-white/20 text-transparent'
            return (
              <button
                type="button"
                key={district}
                onClick={() => toggleOption(district)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all ${activeStyles}`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-md border text-xs transition ${checkStyles}`}>
                  {checked ? CHECKMARK : ''}
                </span>
                <span className="flex-1 text-left">{district}</span>
              </button>
            )
          })}
          {value.length > 0 && (
            <button
              type="button"
              className="mt-1 w-full rounded-lg bg-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/20"
              onClick={() => onChange([])}
            >
              Bo chon tat ca
            </button>
          )}
        </div>
      )}
      {value.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1 text-xs text-slate-300">
          {value.map(district => (
            <span key={district} className="rounded-full border border-white/10 bg-white/10 px-2 py-1">
              {district}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
