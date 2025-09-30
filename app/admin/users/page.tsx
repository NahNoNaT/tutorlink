import { supabaseServer } from '@/lib/supabase/server'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'
import RoleSelect from '@/components/admin/RoleSelect'

export default async function AdminUsers() {
  const { user, profile } = await getUserAndProfile()
  if (!user || profile?.role !== 'admin') return null

  const sb = await supabaseServer()
  const { data: rows } = await sb
    .from('profiles')
    .select('id, email, full_name, role, username')
    .order('created_at', { ascending: false })
    .limit(200)
  const list = (rows || []) as { id:string; email:string|null; full_name:string|null; role:'student'|'tutor'|'admin'; username:string|null }[]

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Users</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Username</th>
              <th className="px-3 py-2 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-3 py-2">{r.full_name || '-'}</td>
                <td className="px-3 py-2">{r.email || '-'}</td>
                <td className="px-3 py-2">{r.username || '-'}</td>
                <td className="px-3 py-2"><RoleSelect id={r.id} role={r.role} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
