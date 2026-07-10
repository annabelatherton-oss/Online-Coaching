import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const HARDCODED_SUBTITLES = {
  'Block 1': 'Hypertrophy / Foundations',
  'Block 2': 'Strength & Hypertrophy',
  'Block 3': 'Hypertrophy Variation',
}

const DAY_ORDER = ['5 Day', '4 Day', '3 Day']

function getDayVariant(name) {
  for (const d of DAY_ORDER) {
    if (name.startsWith(d)) return d
  }
  return null
}

export default function CoachTrainingList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [blockForm, setBlockForm] = useState(null)
  const [addingBlock, setAddingBlock] = useState(false)

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

  // Derive blocks from DB programme names + hardcoded defaults
  const blockKeySet = new Set(Object.keys(HARDCODED_SUBTITLES))
  programs.forEach(p => {
    const match = p.name.match(/Block\s+(\d+)/i)
    if (match) blockKeySet.add(`Block ${parseInt(match[1])}`)
  })
  const blocks = [...blockKeySet]
    .sort((a, b) => (parseInt(a.match(/\d+/)?.[0]) || 99) - (parseInt(b.match(/\d+/)?.[0]) || 99))
    .map(key => ({ key, label: key, subtitle: HARDCODED_SUBTITLES[key] || '' }))

  function getBlockKey(name) {
    for (const b of blocks) {
      if (name.includes(b.key)) return b.key
    }
    return null
  }

  const blockMap = {}
  blocks.forEach(b => { blockMap[b.key] = {} })
  programs.forEach(p => {
    const block = getBlockKey(p.name)
    const day = getDayVariant(p.name)
    if (block && day) blockMap[block][day] = p
  })

  function openAddBlockForm() {
    const nums = blocks.map(b => parseInt(b.key.match(/\d+/)?.[0])).filter(Boolean)
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    setBlockForm({ label: `Block ${next}`, subtitle: '', weeks: 12 })
  }

  async function confirmAddBlock() {
    const trimmedLabel = blockForm.label.trim()
    if (!trimmedLabel) return
    setAddingBlock(true)
    const inserts = DAY_ORDER.map(day => ({
      coach_id: profile.id,
      name: `${day} – ${trimmedLabel}`,
      weeks_total: parseInt(blockForm.weeks) || 12,
      current_week: 1,
      top_lifts: [],
    }))
    const { data, error } = await supabase.from('training_programs').insert(inserts).select('*')
    if (!error && data) setPrograms(prev => [...prev, ...data])
    setBlockForm(null)
    setAddingBlock(false)
  }

  // Day variant view
  if (selectedBlock) {
    const block = blocks.find(b => b.key === selectedBlock)
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
            {block.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{block.subtitle}</p>}
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
        {blocks.map((block, bi) => (
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
              {block.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{block.subtitle}</p>}
            </div>
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}

        {blockForm ? (
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add training block</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Block name</label>
                <input
                  className="input w-full py-1.5 text-sm"
                  placeholder="e.g. Block 4"
                  value={blockForm.label}
                  onChange={e => setBlockForm(f => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Weeks</label>
                <input
                  className="input w-full py-1.5 text-sm"
                  type="number"
                  min={1}
                  placeholder="12"
                  value={blockForm.weeks}
                  onChange={e => setBlockForm(f => ({ ...f, weeks: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Description (optional)</label>
              <input
                className="input w-full py-1.5 text-sm"
                placeholder="e.g. Peaking Phase"
                value={blockForm.subtitle}
                onChange={e => setBlockForm(f => ({ ...f, subtitle: e.target.value }))}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Creates 5 Day, 4 Day, and 3 Day programmes for this block.</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={confirmAddBlock}
                disabled={addingBlock || !blockForm.label.trim()}
                className="btn-primary py-1.5 px-4 text-sm"
              >
                {addingBlock ? 'Creating…' : 'Create block'}
              </button>
              <button
                type="button"
                onClick={() => setBlockForm(null)}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openAddBlockForm}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-colors"
          >
            + Add training block
          </button>
        )}
      </div>
    </div>
  )
}
