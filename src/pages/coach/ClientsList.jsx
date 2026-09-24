import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import ClientModal from './ClientModal'
import LoadingSpinner from '../../components/LoadingSpinner'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function clientStatus(client) {
  if (client.is_archived) return 'archived'
  const now = new Date()
  const exp = client.access_expires_at ? new Date(client.access_expires_at) : null
  const expired = exp && exp < now
  const expiringSoon = exp && !expired && exp <= new Date(now.getTime() + SEVEN_DAYS_MS)
  if (client.is_paused) return 'paused'
  if (expired) return 'expired'
  if (expiringSoon) return 'expiring'
  if (client.is_active) return 'active'
  return 'inactive'
}

function StatusBadge({ client, onClick }) {
  const status = clientStatus(client)
  const clickable = (status === 'expiring' || status === 'expired') && onClick
  const badge = {
    archived: ['Archived', 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'],
    paused: ['Paused', 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'],
    expired: ['Expired', 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'],
    expiring: ['Expiring soon', 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'],
    active: ['Active', 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'],
    inactive: ['Inactive', 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'],
  }[status]
  const [label, classes] = badge
  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={`badge ${classes} hover:opacity-75 transition-opacity cursor-pointer`} title="Add access time">
        {label}
      </button>
    )
  }
  return <span className={`badge ${classes}`}>{label}</span>
}

function TagChip({ tag }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400">
      {tag}
    </span>
  )
}

// Two ways to add access time: a number of weeks on top of whatever's there (the common case —
// mirrors the old "+4w" button but lets the coach pick how many), or an exact new expiry date
// for when a specific date matters more than a round number of weeks.
function ExtendAccessModal({ client, onClose, onAddWeeks, onSetExactDate, busy }) {
  const [mode, setMode] = useState('weeks')
  const [weeks, setWeeks] = useState(4)
  const [exactDate, setExactDate] = useState(
    client.access_expires_at ? new Date(client.access_expires_at).toISOString().split('T')[0] : ''
  )
  const currentExpiry = client.access_expires_at
    ? new Date(client.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Extend access — {client.profiles?.full_name || 'this client'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Currently expires {currentExpiry}.</p>
        </div>

        <div className="flex gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setMode('weeks')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'weeks' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Add weeks
          </button>
          <button
            type="button"
            onClick={() => setMode('date')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'date' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Set exact date
          </button>
        </div>

        {mode === 'weeks' ? (
          <div>
            <label className="label">Additional weeks</label>
            <input
              className="input"
              type="number"
              min={1}
              onFocus={e => e.target.select()}
              value={weeks}
              onChange={e => setWeeks(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="label">New expiry date</label>
            <input
              className="input"
              type="date"
              value={exactDate}
              onChange={e => setExactDate(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            type="button"
            disabled={busy || (mode === 'weeks' ? !weeks || parseInt(weeks) < 1 : !exactDate)}
            onClick={() => mode === 'weeks' ? onAddWeeks(parseInt(weeks)) : onSetExactDate(exactDate)}
            className="btn-primary flex-1"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('All')
  // Deep-linkable from the dashboard's Expiring Soon / Expired stat cards (?status=expiring / ?status=expired).
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All')
  const [showModal, setShowModal] = useState(false)
  const [duplicateData, setDuplicateData] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [alsoDeleteLogin, setAlsoDeleteLogin] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [pauseClientIds, setPauseClientIds] = useState(new Set())
  const [extendClient, setExtendClient] = useState(null)

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id, coach_id, profile_id, goal, current_calories, current_protein,
        current_carbs, current_fat, start_date, access_weeks, access_expires_at,
        is_active, is_paused, is_archived, tags, created_at,
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

  function setStatus(value) {
    setStatusFilter(value)
    setSearchParams(value === 'All' ? {} : { status: value })
  }

  async function togglePause(client) {
    setActionLoading(client.id)
    await supabase
      .from('clients')
      .update({ is_paused: !client.is_paused })
      .eq('id', client.id)
    await loadClients()
    setActionLoading(null)
  }

  // Archiving hides a client from every list/dashboard count without touching any of their
  // data (meal plans, check-ins, weight history, etc) — unlike Delete, which removes the row
  // (and everything that cascades from it) for good. Unarchiving just brings them back.
  async function toggleArchive(client) {
    setActionLoading(client.id)
    await supabase
      .from('clients')
      .update({ is_archived: !client.is_archived })
      .eq('id', client.id)
    await loadClients()
    setActionLoading(null)
  }

  // Adding weeks goes through access_weeks (the clients_set_expires DB trigger recomputes
  // access_expires_at from start_date + access_weeks automatically). Setting an exact date
  // writes access_expires_at directly instead — since that update doesn't touch start_date or
  // access_weeks, the trigger doesn't fire and doesn't overwrite it, at least until the next
  // access_weeks change recomputes it again.
  async function addWeeks(client, weeks) {
    setActionLoading(client.id)
    await supabase
      .from('clients')
      .update({ access_weeks: parseInt(client.access_weeks || 0) + weeks })
      .eq('id', client.id)
    await loadClients()
    setActionLoading(null)
    setExtendClient(null)
  }

  async function setExactExpiry(client, isoDate) {
    setActionLoading(client.id)
    await supabase
      .from('clients')
      .update({ access_expires_at: isoDate })
      .eq('id', client.id)
    await loadClients()
    setActionLoading(null)
    setExtendClient(null)
  }

  // The plain delete only removes the `clients` row (and everything that cascades from it —
  // meal plans, check-ins, weight history, etc), leaving the client's login intact so they could
  // theoretically be re-added later without a fresh signup. "Also delete their login" goes further
  // via delete-client-account (needs the service-role auth admin API, so it can't run from the
  // browser directly): deleting auth.users cascades all the way down (auth.users -> profiles ->
  // clients -> everything else), so there is no way back for this client afterwards.
  async function deleteClient(client) {
    setActionLoading(client.id)
    setDeleteError('')
    if (alsoDeleteLogin) {
      const { data, error } = await supabase.functions.invoke('delete-client-account', { body: { clientId: client.id } })
      if (error || !data?.ok) {
        setDeleteError(data?.error || error?.message || 'Could not delete — try again.')
        setActionLoading(null)
        return
      }
    } else {
      await supabase.from('clients').delete().eq('id', client.id)
    }
    await loadClients()
    setConfirmDelete(null)
    setAlsoDeleteLogin(false)
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
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
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
    // "All" means all non-archived clients — archived ones only show up when that filter is
    // picked explicitly, so archiving actually keeps them off the dashboard/list by default.
    const status = clientStatus(c)
    const matchesStatus = statusFilter === 'All' ? status !== 'archived' : status === statusFilter.toLowerCase()
    return matchesSearch && matchesTag && matchesStatus
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
          onClick={() => { setDuplicateData(null); setShowModal(true) }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search + status/tag filter */}
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
        <select
          className="input sm:w-48"
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Expiring">Expiring soon</option>
          <option value="Expired">Expired</option>
          <option value="Archived">Archived</option>
        </select>
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
                onClick={() => { setDuplicateData(null); setShowModal(true) }}
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
            {/* The Actions column has 5 buttons that don't all fit on a narrower desktop window —
                this lets the table scroll horizontally to reach them instead of clipping them off
                with no way to get to the ones further right. */}
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[52rem]">
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
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/coach/clients/${client.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
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
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge client={client} onClick={() => setExtendClient(client)} />
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
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
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
                          onClick={() => setExtendClient(client)}
                          disabled={actionLoading === client.id}
                          className="btn-secondary py-1.5 px-3 text-xs"
                          title="Add access time"
                        >
                          Extend…
                        </button>
                        <button
                          onClick={() => toggleArchive(client)}
                          disabled={actionLoading === client.id}
                          className="btn-secondary py-1.5 px-3 text-xs"
                          title={client.is_archived ? 'Bring this client back onto your dashboard' : "Hide this client from your dashboard — their data stays intact"}
                        >
                          {client.is_archived ? 'Unarchive' : 'Archive'}
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
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(client => (
              <div key={client.id} onClick={() => navigate(`/coach/clients/${client.id}`)} className="card cursor-pointer">
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
                  <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                    <StatusBadge client={client} onClick={() => setExtendClient(client)} />
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
                <div className="mt-3 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openDuplicate(client)} className="btn-secondary py-1.5 px-3 text-xs">Dupe</button>
                  <button onClick={() => togglePause(client)} disabled={actionLoading === client.id} className="btn-secondary py-1.5 px-3 text-xs">{client.is_paused ? 'Resume' : 'Pause'}</button>
                  <button onClick={() => setExtendClient(client)} disabled={actionLoading === client.id} className="btn-secondary py-1.5 px-3 text-xs">Extend…</button>
                  <button onClick={() => toggleArchive(client)} disabled={actionLoading === client.id} className="btn-secondary py-1.5 px-3 text-xs">{client.is_archived ? 'Unarchive' : 'Archive'}</button>
                  <button onClick={() => setConfirmDelete(client)} className="py-1.5 px-3 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Extend access modal */}
      {extendClient && (
        <ExtendAccessModal
          client={extendClient}
          onClose={() => setExtendClient(null)}
          onAddWeeks={weeks => addWeeks(extendClient, weeks)}
          onSetExactDate={date => setExactExpiry(extendClient, date)}
          busy={actionLoading === extendClient.id}
        />
      )}

      {/* Add/Duplicate modal */}
      {showModal && (
        <ClientModal
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
              This will remove <strong>{confirmDelete.profiles?.full_name}</strong>'s client record
              — their meal plans, check-ins, weight history and everything else tied to it goes too.
              {!alsoDeleteLogin && ' Their login account will remain, but they will no longer appear in your dashboard.'}
            </p>
            <label className="flex items-start gap-2 mt-4 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={alsoDeleteLogin}
                onChange={e => setAlsoDeleteLogin(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-red-500 focus:ring-red-500"
              />
              <span>
                Also permanently delete their login — they'll never be able to sign back in, and this can't be undone.
              </span>
            </label>
            {deleteError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{deleteError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setConfirmDelete(null); setAlsoDeleteLogin(false); setDeleteError('') }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => deleteClient(confirmDelete)}
                disabled={actionLoading === confirmDelete.id}
                className="btn-danger flex-1"
              >
                {actionLoading === confirmDelete.id ? 'Deleting…' : alsoDeleteLogin ? 'Delete permanently' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
