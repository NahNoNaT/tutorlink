'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/browser'
import { useEnsureProfile } from '../../../components/useEnsureProfile'
import LoadingScreen from '@/components/ui/LoadingScreen'

type BookingRow = { id: number; tutor_id: string; start_time: string }

export default function NewReview() {
  const ready = useEnsureProfile('student')
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [selected, setSelected] = useState<number | ''>('')
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [msg, setMsg] = useState<string>('')

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setMsg('Hãy đăng nhập')
    const { data, error } = await supabase
      .from('bookings')
      .select('id, tutor_id, start_time')
      .eq('student_id', user.id)
      .order('start_time', { ascending: false })
    if (error) setMsg(error.message)
    setBookings((data as BookingRow[]) || [])
  })() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setMsg('Hãy đăng nhập')
    if (!selected) return setMsg('Chọn buổi học để đánh giá')

    const b = bookings.find(x => x.id === Number(selected))
    if (!b) return setMsg('Booking không hợp lệ')

    const { error } = await supabase.from('reviews').insert({
      booking_id: b.id, student_id: user.id, tutor_id: b.tutor_id, rating, comment
    })
    if (error) return setMsg(error.message)

    const { data: all } = await supabase.from('reviews').select('rating').eq('tutor_id', b.tutor_id)
    const avg = all && all.length
      ? (all as { rating: number }[]).reduce((s, r) => s + r.rating, 0) / all.length
      : rating

    await supabase.from('tutor_profiles')
      .update({ rating_avg: avg, rating_count: all?.length || 1 })
      .eq('tutor_id', b.tutor_id)

    setMsg('Cảm ơn bạn! Review đã được ghi nhận.')
    setSelected(''); setRating(5); setComment('')
  }

  if (!ready) return <LoadingScreen label="" full={false} />

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl px-4 py-8 space-y-3">
      <h2 className="text-xl font-semibold text-white">Đánh giá buổi học</h2>

      <select
        value={selected}
        onChange={e => setSelected(e.target.value === '' ? '' : Number(e.target.value))}
        className="tl-select"
        style={{ colorScheme: 'dark' }}
      >
        <option value=''>Chọn booking</option>
        {bookings.map(b => (
          <option key={b.id} value={b.id}>
            #{b.id} · {new Date(b.start_time).toLocaleString()}
          </option>
        ))}
      </select>

      <div className="flex items-stretch rounded-xl border border-white/10 bg-white/5">
        <input
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          type="number" min={1} max={5}
          value={rating}
          onChange={e => setRating(Math.min(5, Math.max(1, Number(e.target.value || '1'))))}
          placeholder="Rating"
        />
        <span className="px-3 py-2 text-sm text-slate-400 border-l border-white/10">/5</span>
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 min-h-[100px] placeholder:text-slate-500"
        placeholder="Nhận xét ngắn về gia sư"
      />

      <button className="rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 px-4 py-2 text-slate-900 font-semibold">Gửi đánh giá</button>
      {msg && <p className="text-sm text-slate-400">{msg}</p>}
    </form>
  )
}
