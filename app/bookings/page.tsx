'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase/browser'
import LoadingScreen from '@/components/ui/LoadingScreen'

type Row = {
  id: number
  request_id: number | null
  start_time: string
  end_time: string
  location: string
  price: number
  platform_fee: number
  payment_status?: string | null
}

export default function BookingsIndex() {
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { setMsg('Please sign in'); setLoading(false); return }
      const { data, error } = await supabase
        .from('bookings')
        .select('id,request_id,start_time,end_time,location,price,platform_fee,payment_status')
        .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
        .order('start_time', { ascending: false })
      if (error) setMsg(error.message)
      setRows((data as Row[]) || [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <LoadingScreen label="" full={false} />

  return (
    <div className="mx-auto max-w-3xl px-4">
      <h2 className="text-2xl font-bold text-white mb-4">My bookings</h2>
      {rows.map((b) => (
        <div key={b.id}>
          <Link
            href={`/bookings/${b.id}`}
            className="block rounded-xl border border-white/10 bg-white/5 p-4 mb-2 text-slate-200 hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">Booking #{b.id}</div>
              <div className="text-sm text-slate-400">
                {new Date(b.start_time).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-300">
              {new Date(b.start_time).toLocaleString()} {'->'} {new Date(b.end_time).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Location: {b.location || '-'}</div>
            <div className="mt-1 text-sm">
              <span className="mr-2 text-slate-400">Status:</span>
              <span
                className="inline-block px-2 py-0.5 rounded-full text-white text-xs"
                style={{
                  backgroundColor:
                    b.payment_status === 'paid'
                      ? '#16a34a'
                      : b.payment_status === 'failed'
                      ? '#dc2626'
                      : b.payment_status === 'canceled'
                      ? '#78716c'
                      : b.payment_status === 'pending_review'
                      ? '#f59e0b'
                      : '#475569',
                }}
              >
                {b.payment_status || 'unpaid'}
              </span>
            </div>
          </Link>
          {b.request_id && (
            <div className="mb-3">
              <a className="inline-block rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-100 hover:bg-white/10" href={`/chat/${b.request_id}`}>Chat</a>
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && <div className="text-slate-400">No bookings yet.</div>}
      {msg && <p className="text-slate-400 mt-2">{msg}</p>}
    </div>
  )
}
