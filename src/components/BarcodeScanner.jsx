import { useEffect, useRef, useState } from 'react'

/**
 * Full-screen camera overlay for scanning a product barcode (EAN-13/UPC-A on packaging). Loads
 * the zxing decoder lazily via dynamic import — it's only needed here, so pulling it into the
 * main bundle for every visitor would be wasteful.
 */
export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const detectedRef = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        // decodeFromConstraints (rather than decodeFromVideoDevice with no device id) is what
        // lets us ask for the back camera specifically — on a phone, the default picked device
        // is often the front-facing one, which is useless for reading a barcode on packaging.
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (result) => {
            // The decode loop keeps calling back on every frame until the camera stream actually
            // stops, which doesn't happen synchronously — without this guard, a still-decoding
            // frame or two land after the first hit and re-fire the (async) lookup for it.
            if (result && !cancelled && !detectedRef.current) {
              detectedRef.current = true
              onDetected(result.getText())
            }
          },
        )
        if (cancelled) { controls.stop(); return }
        controlsRef.current = controls
      } catch {
        if (!cancelled) setError("Could not access the camera. Check your browser's camera permission and try again.")
      }
    }
    start()
    return () => { cancelled = true; controlsRef.current?.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <p className="text-white text-sm font-medium">Scan a barcode</p>
        <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-white/70 rounded-lg pointer-events-none" />
      </div>
      {error && (
        <div className="px-4 py-3 bg-red-900/80 flex-shrink-0">
          <p className="text-white text-sm">{error}</p>
        </div>
      )}
      <p className="text-white/60 text-xs text-center px-4 py-4 flex-shrink-0">Line the barcode up inside the box</p>
    </div>
  )
}
