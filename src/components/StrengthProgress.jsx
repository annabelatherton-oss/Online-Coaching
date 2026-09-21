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
export default function StrengthProgress({ liftProgress }) {
  if (liftProgress.length === 0) return null
  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white">Strength Progress</h2>
      <div className="space-y-5">
        {liftProgress.map(({ name, first, latest, kgIncrease, pctIncrease, history }) => (
          <div key={name} className="space-y-1.5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">Start · Wk {first.personalWeek}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{first.weight_kg} kg</p>
                <p className="text-xs text-gray-400 tabular-nums">× {first.reps} reps</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">Now · Wk {latest.personalWeek}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{latest.weight_kg} kg</p>
                <p className="text-xs text-gray-400 tabular-nums">× {latest.reps} reps</p>
              </div>
              <div className={`p-2.5 rounded-xl ${kgIncrease > 0 ? 'bg-green-50 dark:bg-green-900/20' : kgIncrease < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">Increase</p>
                <p className={`text-sm font-bold tabular-nums ${kgIncrease > 0 ? 'text-green-600 dark:text-green-400' : kgIncrease < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                  {kgIncrease > 0 ? '+' : ''}{kgIncrease} kg
                </p>
                {pctIncrease !== null && (
                  <p className={`text-xs font-semibold tabular-nums ${kgIncrease > 0 ? 'text-green-500 dark:text-green-400' : kgIncrease < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {pctIncrease > 0 ? '+' : ''}{pctIncrease}%
                  </p>
                )}
              </div>
            </div>
            <LiftChart history={history} />
          </div>
        ))}
      </div>
    </div>
  )
}
