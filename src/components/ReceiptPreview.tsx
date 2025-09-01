import { useEffect, useRef, useState } from 'react'

type Props = {
  image: string | null
  onRunOCR: (force?: boolean) => void
  ocrProgress: number
}

export default function ReceiptPreview({ image, onRunOCR, ocrProgress }: Props) {
  // Run OCR only once per unique image to avoid resets from re-renders/StrictMode
  const lastProcessedImageRef = useRef<string | null>(null)
  const isProcessingRef = useRef(false)
  const [showOcrDone, setShowOcrDone] = useState(false)
  const prevProgressRef = useRef<number>(0)

  useEffect(() => {
    console.log('ReceiptPreview useEffect triggered')
    console.log('Image exists:', !!image)
    if (!image) {
      console.log('No image, not calling OCR')
      lastProcessedImageRef.current = null
      return
    }

    if (lastProcessedImageRef.current === image) {
      console.log('Same image already processed, skipping OCR')
      return
    }

    if (isProcessingRef.current) {
      console.log('OCR already in progress, skipping duplicate call')
      return
    }

    console.log('Calling onRunOCR once for new image')
    isProcessingRef.current = true
    Promise.resolve()
      .then(() => onRunOCR())
      .finally(() => {
        isProcessingRef.current = false
        lastProcessedImageRef.current = image
      })
  }, [image])

  // Show a brief confirmation when OCR completes
  useEffect(() => {
    if (ocrProgress === 100 && prevProgressRef.current !== 100) {
      setShowOcrDone(true)
      const t = setTimeout(() => setShowOcrDone(false), 2000)
      return () => clearTimeout(t)
    }
    prevProgressRef.current = ocrProgress
  }, [ocrProgress])

  // Show waiting cursor during OCR
  useEffect(() => {
    const isBusy = ocrProgress > 0 && ocrProgress < 100
    if (isBusy) {
      const prev = document.body.style.cursor
      document.body.style.cursor = 'progress'
      return () => { document.body.style.cursor = prev }
    } else {
      document.body.style.cursor = ''
    }
  }, [ocrProgress])

  if (!image) return null
  
  return (
    <div className="px-4 pt-3 space-y-2">
      <img src={image} alt="Captured bill" className="w-full rounded" />
      {showOcrDone && (
        <div style={{
          position: 'relative',
          marginTop: 6,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            padding: '6px 10px',
            borderRadius: 10,
            background: 'linear-gradient(145deg, #10b981, #059669)',
            color: '#fff',
            fontWeight: 700,
            border: '2px solid #000',
            borderStyle: 'outset',
            boxShadow: '0 4px 8px rgba(0,0,0,0.35)'
          }}>OCR completed</div>
        </div>
      )}
      <div className="flex justify-center">
        <button
          onClick={() => onRunOCR(true)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '2px solid #000',
            borderStyle: 'outset',
            background: 'linear-gradient(145deg, #10b981, #059669)',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)'
          }}
        >
          Rerun OCR
        </button>
      </div>
      {ocrProgress > 0 && ocrProgress < 100 && (
        <div className="w-full bg-neutral-800 rounded h-2 overflow-hidden">
          <div className="h-2 bg-blue-500" style={{ width: `${ocrProgress}%` }} />
        </div>
      )}
      {ocrProgress > 0 && ocrProgress < 100 && (
        <p className="text-center text-white text-sm">Processing receipt... {ocrProgress}%</p>
      )}
      {ocrProgress === 100 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg">
            <span className="text-lg">✓</span>
            <span className="text-sm font-medium">Parsing completed!</span>
          </div>
        </div>
      )}
    </div>
  )
}
