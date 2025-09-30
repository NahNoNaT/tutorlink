import { supabaseServer } from '@/lib/supabase/server'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'

export default async function AdminReviews() {
  const { user, profile } = await getUserAndProfile()
  if (!user || profile?.role !== 'admin') return null
  const sb = await supabaseServer()
  const { data: rows } = await sb
    .from('reviews')
    .select('id, rating, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  const list = (rows || []) as { id:number; rating:number; comment:string|null; created_at:string }[]
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Reviews</h2>
      <div className="rounded-xl border border-white/10 bg-white/5">
        <ul className="divide-y divide-white/10">
          {list.map(r => (
            <li key={r.id} className="p-3">
              <div className="text-sm">⭐ {r.rating}</div>
              <div className="text-slate-300 text-sm">{r.comment || '(no comment)'}</div>
              <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
