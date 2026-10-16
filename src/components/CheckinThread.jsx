import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// A small threaded conversation attached to one specific check-in — lets a client reply to their
// coach's comment on that week's check-in (and keep going back and forth) without it getting mixed
// into the general Messages chat, which isn't tied to any particular week. Reuses the same
// `messages` table as general chat (just scoped by checkin_id instead of left null), so it gets
// realtime delivery and the client->coach push notification for free — nothing new to build there.
export default function CheckinThread({ checkinId, clientId, coachId, viewerRole, otherPartyName }) {
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!checkinId) return
    let cancelled = false

    supabase.from('messages').select('*').eq('checkin_id', checkinId).order('created_at', { ascending: true })
      .then(({ data }) => { if (!cancelled) { setMessages(data || []); setLoading(false) } })

    const channel = supabase
      .channel(`checkin-thread-${checkinId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages', filter: `checkin_id=eq.${checkinId}`,
      }, payload => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .subscribe()
    channelRef.current = channel

    return () => {
      cancelled = true
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [checkinId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text || !clientId || !coachId || sending) return
    setSending(true)
    setBody('')
    const { data, error } = await supabase.from('messages')
      .insert({ client_id: clientId, coach_id: coachId, sender: viewerRole, body: text, checkin_id: checkinId })
      .select().single()
    if (!error && data) {
      setMessages(prev => [...prev, data])
      if (viewerRole === 'client') {
        supabase.functions.invoke('send-coach-message-notification', { body: { messageBody: text } }).catch(() => {})
      }
    } else if (error) {
      setBody(text)
    }
    setSending(false)
  }

  if (loading) return null

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
      {messages.length > 0 && (
        <div className="space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === viewerRole ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                msg.sender === viewerRole
                  ? 'bg-brand-500 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                <p className={`mt-0.5 ${msg.sender === viewerRole ? 'text-brand-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={otherPartyName ? `Reply to ${otherPartyName}…` : 'Reply…'}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  )
}
