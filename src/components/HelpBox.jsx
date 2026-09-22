import { useState } from 'react'

// A simple "?" reference panel for common how-to questions — unlike ClientAppTour (a guided
// walkthrough shown once, spotlighting real UI), this is just a static FAQ list either role can
// reopen any time. topics: [{ q, a }] — a itself may include \n\n for paragraph breaks.
export default function HelpBox({ topics }) {
  const [open, setOpen] = useState(false)
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Help"
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-3 divide-y divide-gray-100 dark:divide-gray-800">
              {topics.map((t, i) => (
                <div key={i} className="py-1">
                  <button
                    onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                    className="w-full flex items-center justify-between gap-3 text-left px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.q}</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openIdx === i && (
                    <div className="px-2 pb-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {t.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
