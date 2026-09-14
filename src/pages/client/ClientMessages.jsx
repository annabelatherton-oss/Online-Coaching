import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ClientMessages() {
  const { session } = useAuth()
  const [clientRecord, setClientRecord] = useState(null)
  const [coachName, setCoachName] = useState('')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    load()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [session.user.id])

  async function load() {
    const { data: client } = await supabase
      .from('clients')
      .select('id, coach_id')
      .eq('profile_id', session.user.id)
      .single()

    if (!client) { setLoading(false); return }
    setClientRecord(client)

    const [{ data: coach }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', client.coach_id).single(),
      supabase
        .from('messages')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: true }),
    ])

    setCoachName(coach?.full_name || 'Your Coach')
    setMessages(msgs || [])

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('client_id', client.id)
      .eq('sender', 'coach')
      .is('read_at', null)

    const channel = supabase
      .channel(`client-messages-${client.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `client_id=eq.${client.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        if (payload.new.sender === 'coach') {
          supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', payload.new.id)
        }
      })
      .subscribe()

    channelRef.current = channel
    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !clientRecord || sending) return
    setSending(true)
    const body = newMessage.trim()
    setNewMessage('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ client_id: clientRecord.id, coach_id: clientRecord.coach_id, sender: 'client', body })
      .select()
      .single()
    if (!error && data) {
      setMessages(prev => [...prev, data])
    }
    setSending(false)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  if (!clientRecord) return (
    <div className="card text-center py-12">
      <p className="text-gray-400">No coaching account linked.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chat with {coachName}</p>
      </div>

      <div className="card flex flex-col p-0 overflow-hidden" style={{ height: 'calc(100vh - 14rem)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              {coachName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{coachName}</p>
            <p className="text-xs text-gray-400">Your coach</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">
              No messages yet. Send your coach a message!
            </p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === 'client'
                  ? 'bg-brand-500 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'client' ? 'text-brand-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <form onSubmit={sendMessage} className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) }
              }}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
