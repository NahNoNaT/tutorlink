'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/browser'
import LoadingScreen from '@/components/ui/LoadingScreen'

type RequestRow = { id: number; subject: string | null; student_id: string; tutor_id: string | null }
type MessageRow = { request_id: number; created_at: string; content: string; sender_id: string }
type Profile = { id: string; full_name: string | null; role: 'student'|'tutor'|'admin' }
type ReadRow = { request_id: number; user_id: string; last_read_at: string }

export default function ChatThreadsPage() {
  const [loading, setLoading] = useState(true)
  const [uid, setUid] = useState<string>('')
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [reads, setReads] = useState<ReadRow[]>([])

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUid(user.id)
    const { data: reqs } = await supabase
      .from('requests')
      .select('id, subject, student_id, tutor_id')
      .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
    const list = (reqs as RequestRow[]) || []
    setRequests(list)
    const ids = list.map(r => r.id)
    if (ids.length) {
      const [{ data: msgs }, { data: rd }] = await Promise.all([
        supabase.from('messages')
          .select('request_id, created_at, content, sender_id')
          .in('request_id', ids)
          .order('created_at', { ascending: false }),
        supabase.from('chat_reads')
          .select('request_id, user_id, last_read_at')
          .eq('user_id', user.id)
          .in('request_id', ids)
      ])
      setMessages((msgs as MessageRow[]) || [])
      setReads((rd as ReadRow[]) || [])

      const counterpartIds = Array.from(new Set(list.map(r => (r.student_id === user.id ? r.tutor_id : r.student_id)).filter(Boolean))) as string[]
      if (counterpartIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', counterpartIds)
        const dict: Record<string, Profile> = {}
        for (const p of (profs as Profile[]) || []) dict[p.id] = p
        setProfiles(dict)
      }
    }
    setLoading(false)
  })() }, [])

  const latestByRequest = useMemo(() => {
    const map = new Map<number, MessageRow>()
    for (const m of messages) if (!map.has(m.request_id)) map.set(m.request_id, m)
    return map
  }, [messages])

  const unreadByRequest = useMemo(() => {
    const map = new Map<number, number>()
    for (const r of requests) {
      const lastRead = reads.find(x => x.request_id === r.id)?.last_read_at
      const lastTs = lastRead ? new Date(lastRead).getTime() : 0
      const cnt = messages.filter(m => m.request_id === r.id && new Date(m.created_at).getTime() > lastTs && m.sender_id !== uid).length
      map.set(r.id, cnt)
    }
    return map
  }, [reads, messages, requests, uid])

  if (loading) return <LoadingScreen label="" full={false} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-4">Chats</h2>
      {requests.map(r => {
        const last = latestByRequest.get(r.id)
        const subtitle = last ? `${new Date(last.created_at).toLocaleString()} · ${last.content.slice(0, 60)}` : 'Chưa có tin nhắn'
        const counterpartId = r.student_id === uid ? (r.tutor_id || '') : r.student_id
        const counterpart = counterpartId ? profiles[counterpartId] : undefined
        const name = (counterpart && counterpart.full_name) || (r.student_id === uid ? 'Tutor' : 'Student')
        const role = (counterpart && counterpart.role ? counterpart.role.toUpperCase() : '')
        const unread = unreadByRequest.get(r.id) || 0
        return (
          <Link key={r.id} href={`/chat/${r.id}`} className="block rounded-xl border border-white/10 bg-white/5 p-4 mb-3 text-slate-200 hover:bg-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{r.subject || `Request #${r.id}`}</div>
                <div className="text-xs text-slate-400 truncate">{name} {role && `· ${role}`}</div>
              </div>
              {unread > 0 && (
                <span className="ml-2 shrink-0 rounded-full bg-teal-500/20 text-teal-200 px-2 py-0.5 text-xs font-semibold">{unread}</span>
              )}
            </div>
            <div className="mt-1 text-sm text-slate-400 truncate">{subtitle}</div>
          </Link>
        )
      })}
      {requests.length === 0 && (
        <div className="text-slate-400">Chưa có đoạn chat nào.</div>
      )}
    </div>
  )
}
