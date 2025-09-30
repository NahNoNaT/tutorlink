import { supabaseServer } from '@/lib/supabase/server'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'
import Link from 'next/link'

export default async function AdminDashboard() {
  const { user, profile } = await getUserAndProfile()
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-xl font-semibold text-white">Bạn không có quyền</h2>
        <p className="text-slate-400">Chỉ admin có thể xem trang này.</p>
      </div>
    )
  }

  const sb = await supabaseServer()

  // Profiles counts
  const { count: totalUsers } = await sb.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalTutors } = await sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tutor')
  const { count: totalStudents } = await sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')

  // Requests counts
  const { count: requestsOpen } = await sb.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open')
  const { count: requestsAccepted } = await sb.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted')
  const { count: totalRequests } = await sb.from('requests').select('*', { count: 'exact', head: true })

  // Applications pending (treat NULL status as pending)
  const { count: pendingApps } = await sb
    .from('tutor_applications')
    .select('*', { count: 'exact', head: true })
    .or('status.eq.pending,status.is.null')

  // Bookings summary (count + revenue)
  const { data: bookingsData } = await sb
    .from('bookings')
    .select('id, price, platform_fee, start_time, request_id, tutor_id, student_id')
    .order('start_time', { ascending: false })
    .limit(20)

  const safeBookings = (bookingsData || []) as { id:number; price:number|null; platform_fee:number|null; start_time:string; request_id:number|null; tutor_id:string; student_id:string }[]
  const bookingsCount = safeBookings.length
  const totalRevenue = safeBookings.reduce((s, b) => s + (b.price || 0), 0)
  const totalPlatform = safeBookings.reduce((s, b) => s + (b.platform_fee || 0), 0)

  // Reviews summary
  const { data: reviews = [] as { rating:number }[] } = await sb.from('reviews').select('rating').limit(500)
  const avgRating = reviews && reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin · Dashboard</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/applications" className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-100">Xem đơn ứng tuyển</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Người dùng" value={(totalUsers ?? 0)} sub={`${totalTutors ?? 0} tutor · ${totalStudents ?? 0} student`} />
        <Card title="Requests" value={(totalRequests ?? 0)} sub={`${requestsOpen ?? 0} open · ${requestsAccepted ?? 0} accepted`} />
        <Card title="Đơn pending" value={(pendingApps ?? 0)} sub="Tutor applications" />
        <Card title="Bookings" value={bookingsCount} sub={`Revenue ${formatVND(totalRevenue)} · Fee ${formatVND(totalPlatform)}`} />
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-white">Giao dịch gần đây</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Thời gian</th>
              <th className="px-3 py-2 text-left">Giá</th>
              <th className="px-3 py-2 text-left">Phí</th>
              <th className="px-3 py-2 text-left">Request</th>
            </tr>
          </thead>
          <tbody>
            {safeBookings.map(b => (
              <tr key={b.id} className="border-t border-white/5">
                <td className="px-3 py-2">#{b.id}</td>
                <td className="px-3 py-2">{new Date(b.start_time).toLocaleString()}</td>
                <td className="px-3 py-2">{formatVND(b.price || 0)}</td>
                <td className="px-3 py-2">{formatVND(b.platform_fee || 0)}</td>
                <td className="px-3 py-2">
                  {b.request_id ? (
                    <Link href={`/chat/${b.request_id}`} className="underline">Chat</Link>
                  ) : '-'}
                </td>
              </tr>
            ))}
            {safeBookings.length === 0 && (
              <tr><td className="px-3 py-8 text-center text-slate-400" colSpan={5}>Chưa có giao dịch</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-slate-400">Đánh giá trung bình hiện tại: <span className="text-slate-200 font-medium">{avgRating.toFixed(2)}</span></div>
    </div>
  )
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' VND'
}

function Card({ title, value, sub }: { title: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}
