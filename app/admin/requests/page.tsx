import { supabaseServer } from '@/lib/supabase/server'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'
import Link from 'next/link'

export default async function AdminRequests() {
  const { user, profile } = await getUserAndProfile()
  if (!user || profile?.role !== 'admin') return null
  const sb = await supabaseServer()
  const { data: rows } = await sb
    .from('requests')
    .select('id, subject, level, district, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  const list = (rows || []) as { id:number; subject:string|null; level:string|null; district:string; status:string; created_at:string }[]

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Requests</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Subject</th>
              <th className="px-3 py-2 text-left">Level</th>
              <th className="px-3 py-2 text-left">District</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-3 py-2">#{r.id}</td>
                <td className="px-3 py-2">{r.subject}</td>
                <td className="px-3 py-2">{r.level || '-'}</td>
                <td className="px-3 py-2">{r.district}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2"><Link href={`/chat/${r.id}`} className="underline">Chat</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
