// Shared thumbnail for exercise illustrations and videos.
// size: 'sm' = 40px  |  'md' = 48px
export default function ExerciseThumb({ illustrationUrl, videoUrl, size = 'md' }) {
  const dims  = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'
  const iSize = size === 'sm' ? 'w-4 h-4'   : 'w-5 h-5'

  if (illustrationUrl || videoUrl) {
    return (
      <div className={`${dims} rounded-lg flex-shrink-0 relative overflow-hidden bg-gray-100 dark:bg-gray-800`}>
        {illustrationUrl && (
          <img src={illustrationUrl} alt="" className="w-full h-full object-cover" />
        )}
        {videoUrl && (
          <div className={`absolute inset-0 flex items-center justify-center ${illustrationUrl ? 'bg-black/30' : 'bg-gray-600 dark:bg-gray-700'}`}>
            <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-gray-800 ml-px" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Placeholder — barbell outline
  return (
    <div className={`${dims} rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
      <svg className={`${iSize} text-gray-300 dark:text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M6.5 8.5v7M17.5 8.5v7M3 10.5h3.5v3H3m17.5-3H17v3h3.5M6.5 12h11" />
      </svg>
    </div>
  )
}
