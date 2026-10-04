import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function LiftTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const { weight_kg, reps } = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{weight_kg} kg</p>
      <p className="text-gray-500 dark:text-gray-400 text-xs">× {reps} reps</p>
    </div>
  )
}

// One small chart per lift, plotting weight (kg) across every week it's ever been logged — the
// x-axis carries on counting from a lift's very first entry even if the coach later requests
// different lifts for a while, so a lift's progression never resets or disappears once it's
// requested again, or just stays put showing exactly where it was left.
function LiftChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="h-[120px] flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">Log another week to see the trend</p>
      </div>
    )
  }
  const chartData = history.map(h => ({ week: `Wk ${h.personalWeek}`, weight_kg: h.weight_kg, reps: h.reps }))
  const weights = chartData.map(d => d.weight_kg)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const padding = Math.max((maxWeight - minWeight) * 0.2, 1)
  const yMin = Math.floor((minWeight - padding) * 2) / 2
  const yMax = Math.ceil((maxWeight + padding) * 2) / 2

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<LiftTooltip />} />
        <Line type="monotone" dataKey="weight_kg" stroke="#f472b6" strokeWidth={2} dot={{ r: 3, fill: '#f472b6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Shared "Strength Progress" card — start vs. now vs. increase, plus the week-by-week weight
// trend, for every lift that's been logged across check-ins — shown on both the client's own
// Progress page and the coach's view of that client, so both see the exact same numbers the
// exact same way.
//
// configuredLiftNames (coach view only) says which lifts are currently set up to be requested —
// passing it is what tells "nothing logged yet" apart from "nothing configured at all", which
// otherwise both look identical (the whole card just isn't there), leaving a coach with no way
// to tell whether it's working or not.
export default function StrengthProgress({ liftProgress, configuredLiftNames }) {
  if (liftProgress.length === 0) {
    if (!configuredLiftNames || configuredLiftNames.length === 0) return null
    return (
      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Strength Progress</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Tracking {configuredLiftNames.join(', ')} — nothing to show yet until the client submits a check-in with those weights logged.
        </p>
      </div>
    )
  }
  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white">Strength Progress</h2>
      <div className="space-y-5">
        {liftProgress.map(({ name, first, latest, kgIncrease, pctIncrease, history }) => (
          <div key={name} className="space-y-1.5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</p>
            <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <span className="flex items-baseline gap-1 tabular-nums whitespace-nowrap" title={`Starting point — Week ${first.personalWeek}`}>
                <span className="text-[10px] text-gray-400">Wk{first.personalWeek}</span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{first.weight_kg}kg×{first.reps}</span>
              </span>
              <span className="text-gray-300 dark:text-gray-600">→</span>
              <span className="flex items-baseline gap-1 tabular-nums whitespace-nowrap" title={`Most recent — Week ${latest.personalWeek}`}>
                <span className="text-[10px] text-gray-400">Wk{latest.personalWeek}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{latest.weight_kg}kg×{latest.reps}</span>
              </span>
              <span
                className={`ml-auto text-xs sm:text-sm font-bold tabular-nums px-2 py-0.5 rounded-full whitespace-nowrap ${kgIncrease > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : kgIncrease < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                title="Total increase since the starting point"
              >
                {kgIncrease > 0 ? '+' : ''}{kgIncrease}kg{pctIncrease !== null ? ` (${pctIncrease > 0 ? '+' : ''}${pctIncrease}%)` : ''}
              </span>
            </div>
            <LiftChart history={history} />
          </div>
        ))}
      </div>
    </div>
  )
}
