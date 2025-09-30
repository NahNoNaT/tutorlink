'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/browser'
import ButtonLink from '@/components/ui/ButtonLink'
import LoadingScreen from '@/components/ui/LoadingScreen'

type Req = {
  id: number
  student_id: string
  tutor_id: string | null
  subject: string | null
  level: string | null
  district: string
  address_note: string | null
  start_time: string | null
  duration_minutes: number | null
  budget: number | null
  first_free: boolean
  status: string
  created_at: string
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const requestId = Number(Array.isArray(id) ? id[0] : id)
  const [loading, setLoading] = useState(true)
  const [uid, setUid] = useState('')
  const [role, setRole] = useState<'student'|'tutor'|'admin'|''>('')
  const [req, setReq] = useState<Req | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUid(user.id)
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (p?.role) setRole(p.role)
    }
    if (!requestId || Number.isNaN(requestId)) { setLoading(false); return }
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()
    setReq((data as Req) || null)
    setLoading(false)
  })() }, [requestId])

  const canAccept = useMemo(() => {
    if (!req) return false
    if (req.status !== 'open') return false
    if (role !== 'tutor') return false
    // Nếu request nhắm trực tiếp, chỉ tutor đó mới được nhận (RLS cũng sẽ enforce)
    if (req.tutor_id && req.tutor_id !== uid) return false
    return true
  }, [req, role, uid])

  async function accept() {
    if (!req) return
    setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Hãy đăng nhập'); return }

    const { data, error } = await supabase
      .from('requests')
      .update({ status: 'accepted', tutor_id: user.id })
      .eq('id', req.id)
      .eq('status', 'open')
      .select('*')
    if (error) { setMsg(error.message); return }
    if (!data || !data.length) { setMsg('Đơn đã có người nhận.'); return }
    const row = data[0] as Req

    const start = row.start_time ? new Date(row.start_time) : new Date()
    const end = new Date(start.getTime() + ((row.duration_minutes || 90) * 60000))
    const price = row.budget || 200000
    const fee = Math.round(price * 0.2)

    const { data: bk, error: bErr } = await supabase
      .from('bookings')
      .insert({
        request_id: row.id,
        tutor_id: user.id,
        student_id: row.student_id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: row.address_note || row.district,
        price: price,
        platform_fee: fee
      })
      .select('id')
      .single()
    if (bErr) { setMsg(bErr.message); return }
    router.push(`/bookings/${bk?.id}`)
  }

  if (!requestId || Number.isNaN(requestId)) {
    return <div className="mx-auto max-w-xl px-4 py-8 text-slate-300">Không tìm thấy request.</div>
  }
  if (loading) return <LoadingScreen label="" full={false} />
  if (!req) return <div className="mx-auto max-w-xl px-4 py-8 text-slate-300">Request không tồn tại.</div>

  const start = req.start_time ? new Date(req.start_time) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-3">
      <div className="flex gap-2">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/tutor/feed" variant="outline">Back to feed</ButtonLink>
        <ButtonLink href={`/chat/${req.id}`} variant="outline">Open chat</ButtonLink>
      </div>
      <h1 className="text-2xl font-bold text-white">Request #{req.id}</h1>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
        <div className="font-semibold mb-1">{req.subject || 'N/A'} • {req.level || 'N/A'} • {req.district}</div>
        <div className="text-sm text-slate-300">Budget: {req.budget || '-'} • {req.first_free ? '1st free' : 'paid'}</div>
        <div className="text-sm text-slate-300">Status: {req.status}</div>
        <div className="text-sm text-slate-300">Start: {start ? start.toLocaleString() : '(not set)'}</div>
        <div className="text-sm text-slate-300">Duration: {req.duration_minutes || 90} minutes</div>
        {req.address_note && <div className="text-sm text-slate-300">Address: {req.address_note}</div>}
        {req.tutor_id && <div className="text-sm text-slate-300">Target tutor: {req.tutor_id === uid ? 'You' : req.tutor_id}</div>}
      </div>

      <div className="flex gap-2">
        {canAccept && (
          <button onClick={accept} className="rounded-2xl bg-black text-white px-4 py-2">Accept</button>
        )}
        <a className="px-4 py-2 rounded-2xl border" href={`/chat/${req.id}`}>Chat</a>
      </div>

      {msg && <div className="text-sm text-rose-300">{msg}</div>}
    </div>
  )
}

