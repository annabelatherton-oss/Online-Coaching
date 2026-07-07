import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function CoachMessages() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!profile?.id) return
    loadClients()
  }, [profile?.id])

  async function loadClients() {
    setLoading(true)
    const [{ data: clientRows }, { data: msgRows }] = await Promise.all([
      supabase
        .from('clients')
        .select('id, profiles!clients_profile_id_fkey(full_name)')
        .eq('coach_id', profile.id)
        .order('created_at'),
      supabase
        .from('messages')
        .select('id, client_id, sender, body, read_at, created_at')
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: false }),
    ])

    const msgMap = {}
    for (const m of msgRows || []) {
      if (!msgMap[m.client_id]) {
        msgMap[m.client_id] = { last: m, unread: 0 }
      }
      if (m.sender === 'client' && !m.read_at) {
        msgMap[m.client_id].unread++
      }
    }

    const enriched = (clientRows || []).map(c => ({
      id: c.id,
      full_name: c.profiles?.full_name || 'Unknown',
      last_message: msgMap[c.id]?.last?.body || null,
      last_message_at: msgMap[c.id]?.last?.created_at || null,
      last_sender: msgMap[c.id]?.last?.sender || null,
      unread: msgMap[c.id]?.unread || 0,
    }))

    enriched.sort((a, b) => {
      if (a.unread && !b.unread) return -1
      if (!a.unread && b.unread) return 1
      if (a.last_message_at && b.last_message_at) return new Date(b.last_message_at) - new Date(a.last_message_at)
      if (a.last_message_at) return -1
      if (b.last_message_at) return 1
      return a.full_name.localeCompare(b.full_name)
    })

    setClients(enriched)
    setLoading(false)
  }

  async function openChat(clientId) {
    setSelectedId(clientId)
    setMessages([])
    setNewMessage('')

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('coach_id', profile.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    setMessages(data || [])

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('coach_id', profile.id)
      .eq('client_id', clientId)
      .eq('sender', 'client')
      .is('read_at', null)

    setClients(prev => prev.map(c => c.id === clientId ? { ...c, unread: 0 } : c))

    const channel = supabase
      .channel(`coach-messages-${clientId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `client_id=eq.${clientId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        if (payload.new.sender === 'client') {
          supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', payload.new.id)
        }
      })
      .subscribe()

    channelRef.current = channel
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedId || sending) return
    setSending(true)
    const body = newMessage.trim()
    setNewMessage('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ client_id: selectedId, coach_id: profile.id, sender: 'coach', body })
      .select()
      .single()
    if (!error && data) {
      setMessages(prev => [...prev, data])
      setClients(prev => prev.map(c =>
        c.id === selectedId
          ? { ...c, last_message: body, last_message_at: data.created_at, last_sender: 'coach' }
          : c
      ))
    }
    setSending(false)
  }

  const selected = clients.find(c => c.id === selectedId)

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 lg:-mx-6 -my-4 lg:-my-6 overflow-hidden">
      {/* Client list */}
      <div className={`${selectedId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0`}>
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <h1 className="font-semibold text-gray-900 dark:text-white text-lg">Messages</h1>
          <p className="text-xs text-gray-400 mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {clients.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">No clients yet.</p>
          )}
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => openChat(c.id)}
              className={`w-full text-left px-4 py-3.5 transition-colors ${
                c.id === selectedId
                  ? 'bg-brand-50 dark:bg-brand-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {c.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium truncate ${c.id === selectedId ? 'text-brand-700 dark:text-brand-400' : 'text-gray-900 dark:text-white'}`}>
                      {c.full_name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {c.last_message_at && (
                        <span className="text-xs text-gray-400">{formatTime(c.last_message_at)}</span>
                      )}
                      {c.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.last_message ? (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {c.last_sender === 'coach' ? 'You: ' : ''}{c.last_message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5 italic">No messages yet</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      {selectedId ? (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setSelectedId(null)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {selected?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{selected?.full_name}</h2>
            </div>
            {/* Quick links to client profile sections */}
            <div className="flex items-center gap-1">
              {[
                { label: 'Check-ins', tab: 'Check-ins' },
                { label: 'Meal Plan', tab: 'Meal Plan' },
                { label: 'Training', tab: 'Training' },
                { label: 'Progress', tab: 'Weight' },
              ].map(link => (
                <button
                  key={link.tab}
                  onClick={() => navigate(`/coach/clients/${selectedId}?tab=${encodeURIComponent(link.tab)}`)}
                  className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-400 transition-colors whitespace-nowrap"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-10">No messages yet. Say hello!</p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'coach' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === 'coach'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'coach' ? 'text-brand-200' : 'text-gray-400 dark:text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <form onSubmit={sendMessage} className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) }
                }}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
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
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center text-gray-400 dark:text-gray-600">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm">Select a client to view your conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}
