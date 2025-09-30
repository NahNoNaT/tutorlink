'use client'
import { useParams } from 'next/navigation'
import ChatBox from '@/components/chat/ChatBox'
import ButtonLink from '@/components/ui/ButtonLink'

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const requestId = Number(Array.isArray(id) ? id[0] : id)
  if (!requestId || Number.isNaN(requestId)) {
    return <div className="mx-auto max-w-xl px-4 py-8 text-slate-300">Không tìm thấy phòng chat.</div>
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div className="flex gap-2"><ButtonLink href="/">Home</ButtonLink></div>
      <ChatBox requestId={requestId} />
    </div>
  )
}


