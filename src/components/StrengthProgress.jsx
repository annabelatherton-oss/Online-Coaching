// Shared "Strength Progress" card — start vs. now vs. increase for every lift that's been
// logged across check-ins — shown on both the client's own Progress page and the coach's view
// of that client, so both see the exact same numbers the exact same way.
export default function StrengthProgress({ liftProgress }) {
  if (liftProgress.length === 0) return null
  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white">Strength Progress</h2>
      <div className="space-y-3">
        {liftProgress.map(({ name, first, latest, kgIncrease, pctIncrease }) => (
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
          </div>
        ))}
      </div>
    </div>
  )
}
