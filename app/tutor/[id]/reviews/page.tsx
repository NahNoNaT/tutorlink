// app/tutor/[id]/reviews/page.tsx
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'

export default async function TutorReviews({ params }: { params: { id: string } }) {
  const tutorId = params.id
  const sb = await supabaseServer()

  const { data: prof } = await sb
    .from('profiles')
    .select('full_name')
    .eq('id', tutorId)
    .maybeSingle()

  const { data: rows } = await sb
    .from('reviews')
    .select('rating, comment, created_at')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })

  const list = (rows || []) as { rating: number; comment: string | null; created_at: string }[]
  const name = (prof as { full_name?: string | null } | null)?.full_name || 'Tutor'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-slate-100">
      <div className="mb-3">
        <Link href={`/tutor/${encodeURIComponent(tutorId)}`} className="text-sm text-teal-300 hover:underline">← Back to profile</Link>
      </div>
      <h2 className="text-xl font-semibold mb-3">Reviews for {name}</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
        {list.length === 0 && (
          <div className="p-4 text-slate-400">No reviews yet.</div>
        )}
        {list.map((r, i) => (
          <div key={i} className="p-4">
            <div className="text-sm text-yellow-300">{r.rating} ★</div>
            <div className="text-sm text-slate-200">{r.comment || '(no comment)'}</div>
            <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

