'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import { useEnsureProfile } from '@/components/useEnsureProfile'
import ButtonLink from '@/components/ui/ButtonLink'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { useRouter, useSearchParams } from 'next/navigation'

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

type FormState = {
  subject: string
  district: string
  address_note: string
  start_time: string
  duration_minutes: number
  budget: number
  first_free: boolean
}

export default function NewRequest() {
  const router = useRouter()
  const search = useSearchParams()
  const ready = useEnsureProfile('student')
  const [form, setForm] = useState<FormState>({
    subject: '',
    district: '',
    address_note: '',
    start_time: '',
    duration_minutes: 90,
    budget: 200_000,
    first_free: true,
  })
  const [msg, setMsg] = useState('')
  const [showBudgetPreview, setShowBudgetPreview] = useState(false)
  const [directTutorId, setDirectTutorId] = useState<string>('')

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, n))

  useEffect(() => {
    const to = search.get('to') || ''
    const subject = search.get('subject') || ''
    if (to) setDirectTutorId(to)
    if (subject) setForm(f => ({ ...f, subject }))
  }, [search])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Hãy đăng nhập'); return }

    const startISO = form.start_time ? new Date(form.start_time).toISOString() : null
    if (startISO && new Date(startISO).getTime() < Date.now()) {
      return setMsg('Thời gian bắt đầu phải lớn hơn hiện tại')
    }

    const { data: ins, error } = await supabase
      .from('requests')
      .insert({
        student_id: user.id,
        tutor_id: directTutorId || null,
        subject: form.subject,
        level: null,
        district: form.district,
        address_note: form.address_note,
        start_time: startISO,
        duration_minutes: form.duration_minutes,
        budget: form.budget,
        first_free: form.first_free,
      })
      .select('id')
      .single()

    if (error) return setMsg(error.message)
    const reqId = (ins as { id?: number } | null)?.id
    if (reqId) router.push(`/student/request-new/success?id=${reqId}`)
    else router.push('/student/request-new/success')
  }

  if (!ready) return <LoadingScreen label="" full={false} />

  // datetime-local min (local zone, to minutes)
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const minLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl px-4 py-8 space-y-3">
      <div className="mb-2 flex gap-2">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/tutor/feed" variant="outline">View tutor feed</ButtonLink>
      </div>
      {directTutorId && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm text-teal-100">
          Yêu cầu này sẽ gửi trực tiếp tới một gia sư cụ thể.
        </div>
      )}
      <h2 className="text-xl font-semibold text-white">Create a learning request</h2>

      <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Subject</label>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
        placeholder="Subject"
        value={form.subject}
        onChange={e => setForm({ ...form, subject: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">District (Đà Nẵng)</label>
        <p className="text-xs text-slate-400 mb-2 pl-3">Chọn một quận.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DANANG_DISTRICTS.map(d => {
            const checked = form.district === d
            return (
              <label key={d} className="cursor-pointer select-none">
                <input type="radio" name="district" className="peer sr-only" checked={checked} onChange={() => setForm({ ...form, district: d })} />
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:border-white/20 peer-checked:border-teal-400/60 peer-checked:bg-teal-500/10 peer-checked:text-teal-200 text-center">
                  <span className="truncate block">{d}</span>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Address note</label>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
        placeholder="Address note"
        value={form.address_note}
        onChange={e => setForm({ ...form, address_note: e.target.value })}
      />

      <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Start time</label>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
        type="datetime-local"
        min={minLocal}
        value={form.start_time}
        onChange={e => setForm({ ...form, start_time: e.target.value })}
      />

      <label className="block text-sm font-medium text-slate-200 pl-3 mb-1">Budget</label>
      <div className="flex items-stretch rounded-xl border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-teal-400">
        <input
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          type="number"
          min={1}
          value={Math.max(1, Math.floor((form.budget || 0) / 1000))}
          onChange={e => {
            const k = Math.max(1, Number(e.target.value || '1'))
            setForm({ ...form, budget: k * 1000 })
          }}
          onFocus={() => setShowBudgetPreview(false)}
          onBlur={() => setShowBudgetPreview(true)}
          placeholder="Budget"
        />
        <span className="px-3 py-2 text-sm text-slate-400 border-l border-white/10">.000 VND</span>
      </div>
      {showBudgetPreview && (
        <p className="text-xs text-slate-400 pl-3 mt-1">Số tiền: {fmt(form.budget)} VND</p>
      )}

      <label className="flex items-center gap-2 mt-1">
        <input
          type="checkbox"
          checked={form.first_free}
          onChange={e => setForm({ ...form, first_free: e.target.checked })}
        />
        <span className="text-sm text-slate-300">First lesson free</span>
      </label>
      <button className="rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 px-4 py-2 text-slate-900 font-semibold">Create</button>
      {msg && <p className="text-sm text-slate-400">{msg}</p>}
    </form>
  )
}
