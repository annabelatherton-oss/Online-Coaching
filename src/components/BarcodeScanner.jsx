import { useEffect, useRef, useState } from 'react'

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

/**
 * Full-screen camera overlay for scanning a product barcode (EAN-13/UPC-A on packaging). Prefers
 * the browser's native BarcodeDetector API when available (Chrome/Android/Edge) — it reads
 * directly off the live video frame and is both faster and far more reliable than a pure-JS
 * decoder — falling back to the zxing decoder (loaded lazily; only needed on browsers without
 * native support, mainly Safari/iOS). Either way, a manual entry field is always available too,
 * since a damaged label, bad lighting or an unsupported barcode format can make scanning genuinely
 * not work no matter which decoder is behind it.
 */
export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const rafRef = useRef(null)
  const detectedRef = useRef(false)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')

  function fire(code) {
    if (detectedRef.current) return
    detectedRef.current = true
    onDetected(code)
  }

  useEffect(() => {
    let cancelled = false
    let stream = null

    async function startNative() {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS })
      const tick = async () => {
        if (cancelled) return
        try {
          const results = await detector.detect(videoRef.current)
          if (results.length > 0) { fire(results[0].rawValue); return }
        } catch {
          // A frame occasionally fails to decode (video not ready yet, etc.) — just try again
          // next frame rather than treating one bad frame as a fatal scanner failure.
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    async function startZxing() {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      // decodeFromConstraints (rather than decodeFromVideoDevice with no device id) is what lets
      // us ask for the back camera specifically — on a phone, the default picked device is often
      // the front-facing one, which is useless for reading a barcode on packaging.
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (result) => { if (result) fire(result.getText()) },
      )
      if (cancelled) { controls.stop(); return }
      controlsRef.current = controls
    }

    async function start() {
      try {
        if ('BarcodeDetector' in window) {
          await startNative()
        } else {
          await startZxing()
        }
      } catch {
        if (!cancelled) setError("Could not access the camera. Check your browser's camera permission, or type the barcode number below instead.")
      }
    }
    start()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      controlsRef.current?.stop()
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  function submitManual(e) {
    e.preventDefault()
    const code = manualCode.trim()
    if (code) fire(code)
  }

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
      <form onSubmit={submitManual} className="flex items-center gap-2 px-4 py-3 flex-shrink-0 bg-black/60">
        <input
          type="text"
          inputMode="numeric"
          value={manualCode}
          onChange={e => setManualCode(e.target.value)}
          placeholder="Or type the barcode number"
          className="flex-1 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm px-3 py-2 focus:outline-none focus:border-white/50"
        />
        <button type="submit" disabled={!manualCode.trim()} className="text-sm font-medium text-white bg-white/20 hover:bg-white/30 disabled:opacity-40 rounded-lg px-3 py-2">
          Go
        </button>
      </form>
      <p className="text-white/60 text-xs text-center px-4 pb-4 flex-shrink-0">Line the barcode up inside the box</p>
    </div>
  )
}
