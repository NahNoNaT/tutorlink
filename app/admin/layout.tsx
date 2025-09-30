import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getUserAndProfile()
  if (!user) redirect('/auth/sign-in?next=/admin/dashboard')
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl grid grid-cols-[240px_1fr]">
        <aside className="sticky top-0 h-screen border-r border-white/10 bg-slate-950/60 backdrop-blur p-4">
          <div className="mb-6 text-sm font-extrabold tracking-[0.3em]">ADMIN</div>
          <nav className="flex flex-col gap-1 text-sm">
            <NavItem href="/admin/dashboard" label="Dashboard" />
            <NavItem href="/admin/applications" label="Applications" />
            <NavItem href="/admin/users" label="Users" />
            <NavItem href="/admin/requests" label="Requests" />
            <NavItem href="/admin/bookings" label="Bookings" />
            <NavItem href="/admin/reviews" label="Reviews" />
            <NavItem href="/admin/settings" label="Settings" />
          </nav>
        </aside>
        <main>
          <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/50 backdrop-blur">
            <div className="px-6 py-3 flex items-center gap-3">
              <input className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Search…" />
              <div className="hidden sm:flex gap-2 text-xs">
                <span className="rounded-full border border-white/10 px-2 py-1 text-slate-300">Today</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-slate-300">This week</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-slate-300">This month</span>
              </div>
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white">
      {label}
    </Link>
  )
}
