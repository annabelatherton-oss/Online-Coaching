import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import ClientModal from './ClientModal'
import LoadingSpinner from '../../components/LoadingSpinner'

function StatusBadge({ client }) {
  const now = new Date()
  const exp = client.access_expires_at ? new Date(client.access_expires_at) : null
  const expired = exp && exp < now

  if (client.is_paused)
    return <span className="badge bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Paused</span>
  if (expired)
    return <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Expired</span>
  if (client.is_active)
    return <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
  return <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Inactive</span>
}

function TagChip({ tag }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400">
      {tag}
    </span>
  )
}

export default function ClientsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [duplicateData, setDuplicateData] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [pauseClientIds, setPauseClientIds] = useState(new Set())

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id, coach_id, profile_id, goal, current_calories, current_protein,
        current_carbs, current_fat, start_date, access_weeks, access_expires_at,
        is_active, is_paused, tags, created_at,
        profiles!clients_profile_id_fkey(full_name, email)
      `)
      .eq('coach_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else {
      setClients(data || [])
      if (data && data.length > 0) {
        const { data: pauses } = await supabase
          .from('plan_pauses')
          .select('client_id')
          .in('client_id', data.map(c => c.id))
          .eq('status', 'pending')
        setPauseClientIds(new Set((pauses || []).map(p => p.client_id)))
      }
    }
    setLoading(false)
  }

  useEffect(() => { loadClients() }, [profile.id])

  async function togglePause(client) {
    setActionLoading(client.id)
    await supabase
      .from('clients')
      .update({ is_paused: !client.is_paused })
      .eq('id', client.id)
    await loadClients()
    setActionLoading(null)
  }

  async function extendAccess(client) {
    setActionLoading(client.id)
    const newWeeks = parseInt(client.access_weeks) + 4
    await supabase
      .from('clients')
      .update({ access_weeks: newWeeks })
      .eq('id', client.id)
    await loadClients()
    setActionLoading(null)
  }

  async function deleteClient(client) {
    setActionLoading(client.id)
    await supabase.from('clients').delete().eq('id', client.id)
    await loadClients()
    setConfirmDelete(null)
    setActionLoading(null)
  }

  function openDuplicate(client) {
    setDuplicateData({
      goal: client.goal,
      current_calories: client.current_calories,
      current_protein: client.current_protein,
      current_carbs: client.current_carbs,
      current_fat: client.current_fat,
      access_weeks: client.access_weeks,
      tags: client.tags,
    })
    setEditClient(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditClient(null)
    setDuplicateData(null)
  }

  // Collect all unique tags across clients
  const allTags = [...new Set(clients.flatMap(c => c.tags || []))].sort()

  const filtered = clients.filter(c => {
    const name = c.profiles?.full_name?.toLowerCase() || ''
    const email = c.profiles?.email?.toLowerCase() || ''
    const q = search.toLowerCase()
    const matchesSearch = name.includes(q) || email.includes(q)
    const matchesTag = tagFilter === 'All' || (c.tags || []).includes(tagFilter)
    return matchesSearch && matchesTag
  })

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => { setEditClient(null); setDuplicateData(null); setShowModal(true) }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search + tag filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {allTags.length > 0 && (
          <select
            className="input sm:w-48"
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
          >
            <option value="All">All tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          {clients.length === 0 ? (
            <>
              <p className="text-gray-400 dark:text-gray-500 mb-3">You haven't added any clients yet.</p>
              <button
                onClick={() => { setEditClient(null); setDuplicateData(null); setShowModal(true) }}
                className="btn-primary"
              >
                Add your first client
              </button>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500">No clients match your search.</p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Access</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expires</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                            {client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {client.profiles?.full_name || '—'}
                          </p>
                          <p className="text-xs text-gray-400">{client.profiles?.email}</p>
                          {(client.tags || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {client.tags.map(tag => <TagChip key={tag} tag={tag} />)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge client={client} />
                        {pauseClientIds.has(client.id) && (
                          <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">🌴 Pause pending</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {client.access_weeks} week{client.access_weeks !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(client.access_expires_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/coach/clients/${client.id}`)}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => { setEditClient(client); setDuplicateData(null); setShowModal(true) }}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDuplicate(client)}
                          className="btn-secondary py-1.5 px-3 text-xs"
                          title="Duplicate client settings"
                        >
                          Dupe
                        </button>
                        <button
                          onClick={() => togglePause(client)}
                          disabled={actionLoading === client.id}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          {client.is_paused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={() => extendAccess(client)}
                          disabled={actionLoading === client.id}
                          className="btn-secondary py-1.5 px-3 text-xs"
                          title="Extend access by 4 weeks"
                        >
                          +4w
                        </button>
                        <button
                          onClick={() => setConfirmDelete(client)}
                          className="py-1.5 px-3 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(client => (
              <div key={client.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-brand-700 dark:text-brand-400">
                        {client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {client.profiles?.full_name || '—'}
                      </p>
                      <p className="text-xs text-gray-400">{client.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusBadge client={client} />
                    {pauseClientIds.has(client.id) && (
                      <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">🌴 Pause pending</span>
                    )}
                  </div>
                </div>
                {(client.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {client.tags.map(tag => <TagChip key={tag} tag={tag} />)}
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Access: {client.access_weeks} weeks · Expires: {formatDate(client.access_expires_at)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => navigate(`/coach/clients/${client.id}`)} className="btn-secondary py-1.5 px-3 text-xs">View</button>
                  <button onClick={() => { setEditClient(client); setDuplicateData(null); setShowModal(true) }} className="btn-secondary py-1.5 px-3 text-xs">Edit</button>
                  <button onClick={() => openDuplicate(client)} className="btn-secondary py-1.5 px-3 text-xs">Dupe</button>
                  <button onClick={() => togglePause(client)} disabled={actionLoading === client.id} className="btn-secondary py-1.5 px-3 text-xs">{client.is_paused ? 'Resume' : 'Pause'}</button>
                  <button onClick={() => extendAccess(client)} disabled={actionLoading === client.id} className="btn-secondary py-1.5 px-3 text-xs">+4 weeks</button>
                  <button onClick={() => setConfirmDelete(client)} className="py-1.5 px-3 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit/Duplicate modal */}
      {showModal && (
        <ClientModal
          client={editClient}
          duplicateData={duplicateData}
          onClose={closeModal}
          onSaved={() => { closeModal(); loadClients() }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete client?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This will remove <strong>{confirmDelete.profiles?.full_name}</strong>'s client record.
              Their login account will remain but they will no longer appear in your dashboard.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => deleteClient(confirmDelete)}
                disabled={actionLoading === confirmDelete.id}
                className="btn-danger flex-1"
              >
                {actionLoading === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
