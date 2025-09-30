import { supabaseServer } from '@/lib/supabase/server'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'
import Link from 'next/link'

export default async function AdminBookings() {
  const { user, profile } = await getUserAndProfile()
  if (!user || profile?.role !== 'admin') return null
  const sb = await supabaseServer()
  const { data: rows } = await sb
    .from('bookings')
    .select('id, price, platform_fee, start_time, request_id')
    .order('start_time', { ascending: false })
    .limit(50)
  const list = (rows || []) as { id:number; price:number|null; platform_fee:number|null; start_time:string; request_id:number|null }[]
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Bookings</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Fee</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(b => (
              <tr key={b.id} className="border-t border-white/5">
                <td className="px-3 py-2">#{b.id}</td>
                <td className="px-3 py-2">{new Date(b.start_time).toLocaleString()}</td>
                <td className="px-3 py-2">{formatVND(b.price || 0)}</td>
                <td className="px-3 py-2">{formatVND(b.platform_fee || 0)}</td>
                <td className="px-3 py-2">{b.request_id ? <Link href={`/chat/${b.request_id}`} className="underline">Chat</Link> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' VND'
}
