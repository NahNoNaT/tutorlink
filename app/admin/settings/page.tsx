import { getUserAndProfile } from '@/lib/auth/getProfileServer'

export default async function AdminSettings() {
  const { user, profile } = await getUserAndProfile()
  if (!user || profile?.role !== 'admin') return null
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p>Các thiết lập admin sẽ đặt ở đây.</p>
      </div>
    </div>
  )
}

