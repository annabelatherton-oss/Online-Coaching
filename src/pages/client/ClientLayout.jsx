import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, useNavigationType } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import DarkModeToggle from '../../components/DarkModeToggle'
import HelpBox from '../../components/HelpBox'
import { supabase } from '../../lib/supabase'
import { registerPushNotifications } from '../../lib/pushNotifications'
import ClientAppTour, { shouldAutoShowTour } from '../../components/ClientAppTour'
import ClientDayAvailabilityPrompt, { shouldAutoShowDayAvailabilityPrompt } from '../../components/ClientDayAvailabilityPrompt'
import ClientHomeScreenPrompt, { shouldAutoShowHomeScreenPrompt } from '../../components/ClientHomeScreenPrompt'
import ClientNotificationsPrompt, { shouldAutoShowNotificationsPrompt } from '../../components/ClientNotificationsPrompt'

const HELP_TOPICS = [
  {
    q: 'Add this app to your Home Screen',
    a: 'iPhone (Safari): tap the Share icon, then "Add to Home Screen".\n\nAndroid (Chrome): tap the ⋮ menu, then "Install app" or "Add to Home screen".\n\nDo this and open the app from that icon — it’s the only way to get reminders and updates from your coach as notifications.',
  },
  {
    q: 'Turn on notifications',
    a: 'You should be asked to enable notifications the first time you open the app (after adding it to your Home Screen). If you said "Not now" or dismissed it:\n\niPhone: Settings app → Notifications → find this app in the list → turn on "Allow Notifications".\n\nAndroid: Settings → Apps → find this app → Notifications → turn them on. Or, in Chrome, open the site, tap the padlock/info icon next to the address bar → Permissions → Notifications → Allow.\n\nIf you don’t see the app listed anywhere, make sure you’ve added it to your Home Screen and opened it from that icon at least once first.',
  },
  {
    q: 'Swap a meal',
    a: 'Open a meal in My Meal Plan and tap Swap to pick another option with similar calories and macros.',
  },
  {
    q: 'Eating the same meals every day',
    a: 'If you’d rather have the same meals every day instead of the rotating plan, set that up in the Everyday Meals section on My Meal Plan — breakfast, lunch, pre-workout, dinner and evening snack all apply as soon as you pick them.',
  },
  {
    q: 'Mark days you can’t train',
    a: 'On My Profile, mark each day as unavailable, or note what you’re doing instead (e.g. a sports club) — your coach uses this to plan your training around it.',
  },
  {
    q: 'Weekly check-in',
    a: 'Log your weight, photos and how the week went from Check-in — do this every Friday so your coach can review your progress.',
  },
  {
    q: 'Message your coach',
    a: 'Head to Messages any time — questions, swaps, or just letting them know life got in the way.',
  },
]

const navItems = [
  {
    label: 'Dashboard',
    to: '/client',
    end: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'My Profile',
    to: '/client/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'My Meal Plan',
    to: '/client/meals',
    tourKey: 'nav-meals',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Shopping List',
    to: '/client/shopping-list',
    tourKey: 'nav-shopping',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m-10 0a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    label: 'My Training',
    to: '/client/training',
    tourKey: 'nav-training',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'My Progress',
    to: '/client/progress',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Check-in',
    to: '/client/checkin',
    tourKey: 'nav-checkin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'My Daily Plan',
    to: '/client/todos',
    tourKey: 'nav-todos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    to: '/client/messages',
    tourKey: 'nav-messages',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
]

function AddToHomeScreenBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('hideAddToHomeScreenBanner') === 'true'
    setShow(isIOS && !isStandalone && !dismissed)
  }, [])

  if (!show) return null

  function dismiss() {
    localStorage.setItem('hideAddToHomeScreenBanner', 'true')
    setShow(false)
  }

  return (
    <div className="mb-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-4 py-3 flex items-start gap-3">
      <span className="text-xl flex-shrink-0">📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Get check-in reminders on your phone</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
          iPhones only send reminders to apps added to your Home Screen. Tap the <strong>Share</strong> icon in Safari, then <strong>"Add to Home Screen"</strong>, to make sure you don't miss your Friday check-in.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  )
}

export default function ClientLayout() {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const mainRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [showDayPrompt, setShowDayPrompt] = useState(false)
  const [showHomeScreenPrompt, setShowHomeScreenPrompt] = useState(false)
  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(false)
  const [clientRow, setClientRow] = useState(null)

  // First-ever visit walks a client through a fixed chain, one popup at a time: app tour →
  // training-availability → add to Home Screen → enable notifications. Each step's onClose calls
  // this to show whichever comes next (or nothing, once every step has already been seen). Reads
  // localStorage directly through each shouldAutoShow* check rather than component state, so it
  // gives the right answer regardless of render timing.
  function advanceOnboarding() {
    if (shouldAutoShowTour()) return
    if (shouldAutoShowDayAvailabilityPrompt()) { setShowDayPrompt(true); return }
    if (shouldAutoShowHomeScreenPrompt()) { setShowHomeScreenPrompt(true); return }
    if (shouldAutoShowNotificationsPrompt()) { setShowNotificationsPrompt(true); return }
  }

  useEffect(() => {
    if (shouldAutoShowTour()) setShowTour(true)
  }, [])

  // Fetches this client's own row (needed for the prompts above) and, for a returning client who
  // already decided on notifications one way or the other, silently keeps their push subscription
  // in sync — a brand-new client with notifications still undecided is deliberately left alone
  // here so the browser's native permission dialog never appears before ClientNotificationsPrompt
  // has had a chance to explain what it's for.
  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('clients')
      .select('id, coach_id, day_preferences')
      .eq('profile_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.id) return
        if (typeof Notification !== 'undefined' && Notification.permission !== 'default') {
          registerPushNotifications({ clientId: data.id })
        }
        setClientRow(data)
        advanceOnboarding()
      })
  }, [session?.user?.id])

  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    const key = `scroll:${location.pathname}`
    const save = () => sessionStorage.setItem(key, String(main.scrollTop))
    main.addEventListener('scroll', save, { passive: true })
    return () => main.removeEventListener('scroll', save)
  }, [location.pathname])

  // Restore scroll position only when arriving via the browser/in-app back (or forward) button
  // (navigationType === 'POP') — opening a page fresh, e.g. tapping a sidebar link, should
  // always start at the top like a normal page would. Content loads async so poll until
  // scrollTop actually reaches the target (the page is tall enough).
  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    if (navigationType !== 'POP') {
      main.scrollTop = 0
      return
    }
    const target = parseInt(sessionStorage.getItem(`scroll:${location.pathname}`) || '0', 10)
    if (!target) return
    let attempts = 0
    const try_ = () => {
      if (!mainRef.current) return
      mainRef.current.scrollTop = target
      if (mainRef.current.scrollTop < target - 5 && attempts < 30) {
        attempts++
        setTimeout(try_, 100)
      }
    }
    const t = setTimeout(try_, 50)
    return () => clearTimeout(t)
  }, [location.pathname, navigationType])

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col w-64 h-full bg-white border-r border-pink-100 text-gray-700">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-1 border-b border-pink-100">
        <img src="/logo.svg" alt="Annabel Atherton Personal Training" className="h-20 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          item.disabled ? (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 cursor-not-allowed select-none"
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              data-tour={item.tourKey}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-pink-100 text-brand-600 font-medium'
                    : 'text-gray-500 hover:bg-pink-50 hover:text-gray-800'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          )
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-pink-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-brand-700">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {profile?.full_name || 'Client'}
            </p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-pink-50 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-pink-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTour(true)}
              title="Take the app tour"
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
            <HelpBox topics={HELP_TOPICS} />
            <DarkModeToggle />
            <div className="text-sm text-gray-600 dark:text-gray-400 pl-2 border-l border-gray-200 dark:border-gray-700 ml-1">
              {profile?.full_name?.split(' ')[0] || 'Client'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AddToHomeScreenBanner />
          <Outlet />
        </main>
      </div>

      {showTour && (
        <ClientAppTour
          onClose={() => {
            setShowTour(false)
            if (clientRow) advanceOnboarding()
          }}
          setSidebarOpen={setSidebarOpen}
        />
      )}
      {showDayPrompt && clientRow && (
        <ClientDayAvailabilityPrompt
          clientId={clientRow.id}
          coachId={clientRow.coach_id}
          dayPreferences={clientRow.day_preferences}
          onClose={() => { setShowDayPrompt(false); advanceOnboarding() }}
        />
      )}
      {showHomeScreenPrompt && (
        <ClientHomeScreenPrompt onClose={() => { setShowHomeScreenPrompt(false); advanceOnboarding() }} />
      )}
      {showNotificationsPrompt && clientRow && (
        <ClientNotificationsPrompt clientId={clientRow.id} onClose={() => setShowNotificationsPrompt(false)} />
      )}
    </div>
  )
}
