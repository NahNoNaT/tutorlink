'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'

type Message = {
  id: number
  request_id: number
  sender_id: string
  content: string
  created_at: string
}

export default function ChatBox({ requestId }: { requestId: number }) {
  const [userId, setUserId] = useState<string>('')
  const [list, setList] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const tempId = useRef(-1)
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function markRead(immediate = false) {
    if (!userId) return
    const run = async () => {
      try {
        await supabase
          .from('chat_reads')
          .upsert({ request_id: requestId, user_id: userId, last_read_at: new Date().toISOString() }, { onConflict: 'request_id,user_id' })
      } catch {}
    }
    if (immediate) return run()
    // debounce to tránh spam khi list thay đổi liên tục
    if (readTimer.current) clearTimeout(readTimer.current)
    readTimer.current = setTimeout(run, 400)
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })
      setList((data as Message[]) || [])
    })()

    const channel = supabase
      .channel(`messages-request-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}`
      }, payload => {
        setList(prev => [...prev, payload.new as Message])
        queueMicrotask(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight }))
      })
      .subscribe()
    // polling fallback mỗi 1s nếu realtime bị tắt
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })
      const rows = (data as Message[]) || []
      setList(prev => {
        if (rows.length !== prev.length) return rows
        return prev
      })
    }, 1000)

    return () => { supabase.removeChannel(channel); clearInterval(interval); if (readTimer.current) clearTimeout(readTimer.current) }
  }, [requestId])

  useEffect(() => {
    // luôn cuộn xuống cuối khi có tin mới
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
    // đánh dấu đã đọc
    // ignore lint dependency warning by calling inline
    ;(async () => { await markRead() })()
  }, [list])

  async function send() {
    setError('')
    const body = text.trim()
    if (!body) return
    setText('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Hãy đăng nhập'); return }
    const tmp = { id: tempId.current--, request_id: requestId, sender_id: user.id, content: body, created_at: new Date().toISOString() } as Message
    setList(prev => [...prev, tmp])
    const { data, error } = await supabase
      .from('messages')
      .insert({ request_id: requestId, sender_id: user.id, content: body })
      .select('*')
      .single()
    if (error) {
      setError(error.message)
      // loại bỏ optimistic nếu lỗi
      setList(prev => prev.filter(m => m.id !== tmp.id))
      return
    }
    // thay optimistic bằng bản ghi thực
    setList(prev => prev.map(m => (m.id === tmp.id ? (data as Message) : m)))
    // sau khi gửi cũng đánh dấu đã đọc (để reset badge trên danh sách)
    markRead(true)
  }

  return (
    <div className="mx-auto max-w-2xl w-full rounded-2xl border border-white/10 bg-white/5">
      <div className="px-4 py-3 border-b border-white/10 text-sm text-slate-300">Chat trước khi xác nhận đơn #{requestId}</div>
      <div ref={scroller} className="h-[360px] overflow-y-auto p-4 space-y-2">
        {list.map(m => (
          <div key={m.id} className={`flex ${m.sender_id===userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.sender_id===userId ? 'bg-teal-500/20 text-teal-100' : 'bg-white/10 text-slate-100'} rounded-xl px-3 py-2 max-w-[80%] whitespace-pre-wrap`}>{m.content}</div>
          </div>
        ))}
        {list.length===0 && (
          <div className="text-center text-sm text-slate-400">Hãy bắt đầu cuộc trò chuyện…</div>
        )}
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-white/10">
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() } }}
          placeholder="Nhập tin nhắn"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button onClick={send} className="rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 px-4 py-2 text-slate-900 text-sm font-semibold">Gửi</button>
      </div>
      {error && <div className="px-4 pb-3 text-sm text-rose-300">{error}</div>}
    </div>
  )
}
