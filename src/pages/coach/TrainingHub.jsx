import { useState } from 'react'
import CoachTrainingList from './CoachTrainingList'
import WorkoutLibrary from './WorkoutLibrary'

const TABS = ['Programmes', 'Workouts']

export default function TrainingHub() {
  const [tab, setTab] = useState('Programmes')
  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 -mb-2">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Programmes' ? <CoachTrainingList /> : <WorkoutLibrary />}
    </div>
  )
}
