import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const BLOCKS = [
  { key: 'Block 1', label: 'Block 1', subtitle: 'Hypertrophy / Foundations' },
  { key: 'Block 2', label: 'Block 2', subtitle: 'Strength & Hypertrophy' },
  { key: 'Block 3', label: 'Block 3', subtitle: 'Hypertrophy Variation' },
]

const DAY_ORDER = ['5 Day', '4 Day', '3 Day']

function getDayVariant(name) {
  for (const d of DAY_ORDER) {
    if (name.startsWith(d)) return d
  }
  return null
}

function getBlock(name) {
  for (const b of BLOCKS) {
    if (name.includes(b.key)) return b.key
  }
  return null
}

export default function CoachTrainingList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .eq('coach_id', profile.id)
      .order('created_at', { ascending: true })
    setPrograms(data || [])
    setLoading(false)
    if (error) console.error('load error:', error)
  }

  useEffect(() => { load() }, [])

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const blockMap = {}
  BLOCKS.forEach(b => { blockMap[b.key] = {} })
  programs.forEach(p => {
    const block = getBlock(p.name)
    const day = getDayVariant(p.name)
    if (block && day) blockMap[block][day] = p
  })

  // Day variant view
  if (selectedBlock) {
    const block = BLOCKS.find(b => b.key === selectedBlock)
    const variants = blockMap[selectedBlock]
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedBlock(null)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{block.label}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{block.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {DAY_ORDER.map(day => {
            const prog = variants[day]
            if (!prog) return (
              <div key={day} className="card text-center py-10 text-sm text-gray-400 dark:text-gray-600 border-dashed border-gray-200 dark:border-gray-700">
                {day}<br /><span className="text-xs">not set up</span>
              </div>
            )
            return (
              <button
                key={day}
                onClick={() => navigate(`/coach/training/${prog.id}`)}
                className="card text-left hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group"
              >
                <p className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-1">
                  {day}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{prog.weeks_total} weeks</p>
                <p className="text-sm text-brand-500 dark:text-brand-400 mt-4 font-medium">Edit →</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Block list view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Programmes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a block to view its training day variations</p>
      </div>

      <div className="space-y-4">
        {BLOCKS.map((block, bi) => (
          <button
            key={block.key}
            onClick={() => setSelectedBlock(block.key)}
            className="w-full card text-left flex items-center gap-4 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400 font-bold">
              B{bi + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 text-lg">
                {block.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{block.subtitle}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
