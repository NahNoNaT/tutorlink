import Link from 'next/link'
import UserMenu from './UserMenu'
import StudentNavItems from './StudentNavItems'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/40">
      <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
        <Link href="/" className="font-extrabold tracking-[0.3em] text-slate-100">TUTORLINK</Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <Link prefetch href="/student/request-new">For students</Link>
          <Link prefetch href="/tutor/feed">Job board</Link>
          <Link prefetch href="/reviews/new">Feedback</Link>
          <Link prefetch href="/chat">Chats</Link>
          <StudentNavItems />
        </nav>

        {/* ⬇️ Tự quyết định: nếu chưa login => Sign in/Sign up; nếu login => avatar menu */}
        <UserMenu />
      </div>
    </header>
  )
}
