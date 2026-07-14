import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function calcPauseStartDate() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dow = today.getDay()
  // Fri/Sat/Sun: plan for next week already sent → skip to Monday after next
  const daysToStart = dow === 5 ? 10 : dow === 6 ? 9 : dow === 0 ? 8 : 8 - dow
  const start = new Date(today)
  start.setDate(today.getDate() + daysToStart)
  const pad = n => String(n).padStart(2, '0')
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
}

function calcPause(returnDateStr) {
  const ret = new Date(returnDateStr + 'T00:00:00')
  const day = ret.getDay()
  let firstFri = new Date(ret)
  if (day === 0) firstFri.setDate(ret.getDate() + 5)
  else if (day <= 4) firstFri.setDate(ret.getDate() + (5 - day))
  else firstFri.setDate(ret.getDate() + (12 - day))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayDay = today.getDay()
  let nextFri = new Date(today)
  if (todayDay === 0) nextFri.setDate(today.getDate() + 5)
  else if (todayDay <= 5) nextFri.setDate(today.getDate() + (5 - todayDay))
  else nextFri.setDate(today.getDate() + 6)
  const weeks = Math.round((firstFri - nextFri) / (7 * 24 * 60 * 60 * 1000))
  const pad = n => String(n).padStart(2, '0')
  const fISO = `${firstFri.getFullYear()}-${pad(firstFri.getMonth() + 1)}-${pad(firstFri.getDate())}`
  return { firstCheckinDate: fISO, weeksPaused: weeks, pauseStartDate: calcPauseStartDate() }
}

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PlaceholderCard({ title, subtitle, icon, color, comingSoon }) {
  return (
    <div className={`card flex flex-col gap-3 h-full ${comingSoon ? 'opacity-60' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {comingSoon && (
        <span className="self-start badge bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          Coming soon
        </span>
      )}
    </div>
  )
}

export default function ClientDashboard() {
  const { profile, session } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newDelivery, setNewDelivery] = useState(null)
  const [activePause, setActivePause] = useState(null)
  const [showPauseForm, setShowPauseForm] = useState(false)
  const [returnDate, setReturnDate] = useState('')
  const [pauseCalc, setPauseCalc] = useState(null)
  const [pauseSaving, setPauseSaving] = useState(false)

  useEffect(() => {
    if (returnDate) setPauseCalc(calcPause(returnDate))
    else setPauseCalc(null)
  }, [returnDate])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('*, profiles!clients_coach_id_fkey(full_name)')
        .eq('profile_id', session.user.id)
        .single()
      setClientData(data)

      if (data?.id) {
        const [{ data: delivery }, { data: pause }] = await Promise.all([
          supabase.from('weekly_deliveries')
            .select('id, coach_notes, personal_week, delivered_at')
            .eq('client_id', data.id)
            .is('seen_at', null)
            .order('delivered_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from('plan_pauses')
            .select('*')
            .eq('client_id', data.id)
            .in('status', ['pending', 'approved'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])
        if (delivery) {
          setNewDelivery(delivery)
          supabase.from('weekly_deliveries')
            .update({ seen_at: new Date().toISOString() })
            .eq('id', delivery.id)
            .then(() => {})
        }
        setActivePause(pause)
      }

      setLoading(false)
    }
    load()
  }, [session.user.id])

  async function submitPause() {
    if (!returnDate || !pauseCalc || !clientData?.id) return
    setPauseSaving(true)
    const { data, error } = await supabase.from('plan_pauses').insert({
      client_id: clientData.id,
      return_date: returnDate,
      first_checkin_date: pauseCalc.firstCheckinDate,
      weeks_paused: pauseCalc.weeksPaused,
      pause_start_date: pauseCalc.pauseStartDate,
    }).select().single()
    if (!error) {
      setActivePause(data)
      setShowPauseForm(false)
      setReturnDate('')
      setPauseCalc(null)
    }
    setPauseSaving(false)
  }

  async function cancelPause() {
    if (!activePause) return
    await supabase.from('plan_pauses').update({ status: 'cancelled' }).eq('id', activePause.id)
    setActivePause(null)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const now = new Date()
  const expiry = clientData?.access_expires_at ? new Date(clientData.access_expires_at) : null
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))) : null
  const weeksLeft = daysLeft !== null ? Math.ceil(daysLeft / 7) : null
  const tomorrowISO = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        {clientData?.profiles?.full_name && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your coach: <span className="font-medium">{clientData.profiles.full_name}</span>
          </p>
        )}
      </div>

      {/* Access info */}
      {daysLeft !== null && (
        <div className={`card flex items-center gap-4 ${daysLeft <= 7 ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10' : ''}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${daysLeft <= 7 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {daysLeft === 0 ? 'Plan expired' : `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} remaining on current plan`}
            </p>
            {expiry && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {daysLeft === 0 ? 'Contact your coach to renew.' : `Expires ${expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* New plan notification */}
      {newDelivery && (
        <Link to="/client/meals">
          <div className="card border-brand-300 dark:border-brand-700 bg-gradient-to-r from-brand-50 to-pink-50 dark:from-brand-900/20 dark:to-pink-900/10 flex gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-700 dark:text-brand-300">New plan for Week {newDelivery.personal_week}!</p>
              {newDelivery.coach_notes ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{newDelivery.coach_notes}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your coach has updated your plan — tap to view.</p>
              )}
            </div>
            <svg className="w-4 h-4 text-brand-400 flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Holiday pause */}
      {activePause ? (
        <div className={`card flex gap-4 ${activePause.status === 'approved'
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10'
          : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${
            activePause.status === 'approved'
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            🌴
          </div>
          <div className="flex-1 min-w-0">
            {activePause.status === 'approved' ? (
              <>
                <p className="font-medium text-gray-900 dark:text-white">Plan pause approved</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {activePause.pause_start_date && `Starts ${fmtDate(activePause.pause_start_date)} · `}
                  Returning {fmtDate(activePause.return_date)}{activePause.weeks_paused > 0 ? ` · first check-in ${fmtDate(activePause.first_checkin_date)}` : ' — enjoy your trip'}.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-900 dark:text-white">Plan pause requested</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {activePause.pause_start_date && `Starts ${fmtDate(activePause.pause_start_date)} · `}
                  Returning {fmtDate(activePause.return_date)} — waiting for your coach to approve.
                </p>
              </>
            )}
          </div>
          <button
            onClick={cancelPause}
            className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors self-start mt-1 whitespace-nowrap"
          >
            Cancel
          </button>
        </div>
      ) : showPauseForm ? (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌴</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Request a plan pause</h3>
            </div>
            <button
              onClick={() => { setShowPauseForm(false); setReturnDate(''); setPauseCalc(null) }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div>
            <label className="label">When are you returning?</label>
            <input
              type="date"
              className="input"
              min={tomorrowISO}
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
            />
          </div>
          {pauseCalc && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-1.5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Pause starts: {fmtDate(pauseCalc.pauseStartDate)}
              </p>
              {pauseCalc.weeksPaused > 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {pauseCalc.weeksPaused} week{pauseCalc.weeksPaused !== 1 ? 's' : ''} paused · first check-in {fmtDate(pauseCalc.firstCheckinDate)}.
                </p>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Short break — your coach will be notified and your plan will be paused while you're away.
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={submitPause}
              disabled={!returnDate || !pauseCalc || pauseSaving}
              className="btn-primary"
            >
              {pauseSaving ? 'Requesting…' : 'Request pause'}
            </button>
            <button
              onClick={() => { setShowPauseForm(false); setReturnDate(''); setPauseCalc(null) }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPauseForm(true)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <span>🌴</span>
          <span>Going on holiday? Request a plan pause</span>
        </button>
      )}

      {/* Quick cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/client/profile">
          <PlaceholderCard
            title="My Profile"
            subtitle="View your goals, stats, and measurements"
            color="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/meals">
          <PlaceholderCard
            title="This Week's Meal Plan"
            subtitle="Your personalised nutrition for the week"
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/training">
          <PlaceholderCard
            title="This Week's Training"
            subtitle="Your exercise programme for the week"
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/todos">
          <PlaceholderCard
            title="My Daily Plan"
            subtitle="Track today's habits, training and tasks"
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/checkin">
          <PlaceholderCard
            title="Weekly Check-in"
            subtitle="Log your progress for your coach"
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/progress">
          <PlaceholderCard
            title="My Progress"
            subtitle="Weight trends, photos, and check-in history"
            color="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </Link>
      </div>
    </div>
  )
}
