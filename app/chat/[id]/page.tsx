'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/browser'
import ChatBox from '@/components/chat/ChatBox'
import ButtonLink from '@/components/ui/ButtonLink'
import LoadingScreen from '@/components/ui/LoadingScreen'

type Req = { id:number; subject:string|null; student_id:string; tutor_id:string|null }

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const requestId = Number(Array.isArray(id) ? id[0] : id)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [req, setReq] = useState<Req | null>(null)
  const [lastTutorId, setLastTutorId] = useState<string>('')

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    if (!requestId || Number.isNaN(requestId)) { setLoading(false); return }
    const { data: r } = await supabase
      .from('requests')
      .select('id, subject, student_id, tutor_id')
      .eq('id', requestId)
      .maybeSingle()
    setReq((r as Req) || null)

    if (r && user && r.tutor_id == null && r.student_id === user.id) {
      const { data: msg } = await supabase
        .from('messages')
        .select('sender_id, created_at')
        .eq('request_id', requestId)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      const sender = (msg as { sender_id:string }[] | null)?.[0]?.sender_id || ''
      setLastTutorId(sender)
    }
    setLoading(false)
  })() }, [requestId])

  const targetTutorId = useMemo(() => {
    if (!req) return ''
    if (req.tutor_id) return req.tutor_id
    return lastTutorId
  }, [req, lastTutorId])

  if (!requestId || Number.isNaN(requestId)) {
    return <div className="mx-auto max-w-xl px-4 py-8 text-slate-300">Không tìm thấy phòng chat.</div>
  }

  const createDirect = () => {
    if (!req || !targetTutorId) return
    const params = new URLSearchParams()
    params.set('to', targetTutorId)
    if (req.subject) params.set('subject', req.subject)
    router.push(`/student/request-new?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div className="flex gap-2 items-center">
        <ButtonLink href="/">Home</ButtonLink>
        {loading ? (
          <span className="text-xs text-slate-400">Đang tải...</span>
        ) : (
          req && userId === req.student_id && targetTutorId && (
            <button
              onClick={createDirect}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
            >Tạo request gửi riêng gia sư này</button>
          )
        )}
      </div>
      {loading ? <LoadingScreen label="" full={false} /> : <ChatBox requestId={requestId} />}
    </div>
  )
}

