// app/tutor/[id]/page.tsx
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'

type TutorProfile = {
  tutor_id: string
  subjects: string[] | null
  districts: string[] | null
  price_per_hour: number | null
  bio: string | null
  verified: boolean | null
  rating_avg: number | null
  rating_count: number | null
}

function fmtVnd(n?: number | null) {
  if (!n) return '-'
  try {
    return new Intl.NumberFormat('vi-VN').format(n) + ' VND'
  } catch {
    return `${n} VND`
  }
}

function dayTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const day = start.toLocaleDateString('en-US', { weekday: 'short' })
  const st = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const et = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${day} ${st} – ${et}`
}

export default async function TutorPublicProfile({ params }: { params: { id: string } }) {
  const tutorId = params.id
  const sb = await supabaseServer()

  const { data: prof } = await sb
    .from('profiles')
    .select('id, full_name')
    .eq('id', tutorId)
    .maybeSingle()

  const { data: tprof } = await sb
    .from('tutor_profiles')
    .select('*')
    .eq('tutor_id', tutorId)
    .maybeSingle()

  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const { data: bookings } = await sb
    .from('bookings')
    .select('start_time, end_time, location')
    .eq('tutor_id', tutorId)
    .gte('start_time', now.toISOString())
    .lte('start_time', in7.toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  const { data: revs } = await sb
    .from('reviews')
    .select('rating, comment, created_at')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })
    .limit(3)

  const profile = (tprof || null) as TutorProfile | null
  const name: string = (prof as { full_name?: string | null } | null)?.full_name || 'Tutor'
  const avatarInitial = (name?.[0] || 'T').toUpperCase()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-slate-100">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-black text-white grid place-items-center text-xl font-semibold">
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-lg font-semibold">{name}</div>
              {typeof profile?.rating_avg === 'number' && (
                <div className="text-sm text-yellow-300">
                  ★ {profile.rating_avg.toFixed(1)}{' '}
                  <span className="text-slate-300">({profile.rating_count ?? 0})</span>
                </div>
              )}
              {profile?.verified && (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs px-2 py-0.5">
                  Verified
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-sm text-slate-300">
              {profile?.districts && profile.districts.length > 0 && (
                <div>
                  Quận:
                  {profile.districts.slice(0, 5).map((d, i) => (
                    <span key={i} className="inline-block rounded-full bg-white/10 px-2 py-0.5 ml-1">
                      {d}
                    </span>
                  ))}
                </div>
              )}
              {typeof profile?.price_per_hour === 'number' && (
                <div className="ml-auto md:ml-0">Giá/giờ: {fmtVnd(profile.price_per_hour)}</div>
              )}
              <div className="ml-auto md:ml-0">
                <Link
                  href={`/student/request-new?tutorId=${encodeURIComponent(tutorId)}`}
                  className="inline-flex items-center rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 px-3 py-1.5 text-slate-900 text-sm font-semibold hover:opacity-90"
                >
                  Request this tutor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About me */}
      <section className="mt-6">
        <h3 className="text-base font-semibold mb-2">About me</h3>
        <p className="text-slate-300 whitespace-pre-wrap">{profile?.bio || '-'}</p>
      </section>

      {/* Subjects & Districts */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-base font-semibold mb-2">Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {(profile?.subjects || []).length > 0
              ? (profile?.subjects || []).map((s, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-sm">
                    {s}
                  </span>
                ))
              : <span className="text-slate-400">-</span>}
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold mb-2">Districts</h3>
          <div className="flex flex-wrap gap-2">
            {(profile?.districts || []).length > 0
              ? (profile?.districts || []).map((d, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-sm">
                    {d}
                  </span>
                ))
              : <span className="text-slate-400">-</span>}
          </div>
        </div>
      </section>

      {/* Available this week */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Available this week</h3>
          <Link href={`/bookings`} className="text-sm text-teal-300 hover:underline">See all</Link>
        </div>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {(bookings as { start_time: string; end_time: string; location: string | null }[] | null)?.length
            ? (bookings as { start_time: string; end_time: string; location: string | null }[]).map((b, i) => (
                <li key={i}>
                  {dayTimeRange(b.start_time, b.end_time)}{b.location ? ` - ${b.location}` : ''}
                </li>
              ))
            : <li className="text-slate-500">-</li>}
        </ul>
      </section>

      {/* Reviews */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Reviews{profile?.rating_count ? ` (${profile.rating_count})` : ''}</h3>
          <Link href={`/tutor/${encodeURIComponent(tutorId)}/reviews`} className="text-sm text-teal-300 hover:underline">See all reviews</Link>
        </div>
        <ul className="mt-2 space-y-2">
          {(revs as { rating: number; comment: string | null; created_at: string }[] | null)?.length
            ? (revs as { rating: number; comment: string | null; created_at: string }[]).map((r, i) => (
                <li key={i} className="text-sm text-slate-300">
                  <span className="italic">{r.comment || '“(no comment)”'}</span>
                  {' '}· <span className="text-yellow-300">{r.rating} ★</span>
                  {' '}· {new Date(r.created_at).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })}
                </li>
              ))
            : <li className="text-sm text-slate-500">No reviews yet.</li>}
        </ul>
      </section>
    </div>
  )
}

