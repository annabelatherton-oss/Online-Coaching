import { daysUntil, formatCountdown, formatTargetDate } from '../lib/targetDate'

// Highlights a client's target date wherever it's relevant. Renders nothing if there's no
// date set, or if it's already passed by more than a day (stops nagging after the fact).
export default function TargetDateBanner({ targetDate, targetEventName, className = '' }) {
  if (!targetDate) return null
  const days = daysUntil(targetDate)
  if (days == null || days < -1) return null

  const urgent = days <= 14
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        urgent
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          : 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
      } ${className}`}
    >
      <span className="text-lg leading-none">🎯</span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${urgent ? 'text-amber-800 dark:text-amber-300' : 'text-brand-800 dark:text-brand-300'}`}>
          {formatCountdown(days)}{targetEventName ? ` until ${targetEventName}` : ''}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatTargetDate(targetDate)}</p>
      </div>
    </div>
  )
}
