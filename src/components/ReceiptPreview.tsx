import { useEffect } from 'react'

type Props = {
  image: string | null
  onRunOCR: () => void
  ocrProgress: number
}

export default function ReceiptPreview({ image, onRunOCR, ocrProgress }: Props) {
  // Auto-run OCR when image is captured
  useEffect(() => {
    if (image) {
      onRunOCR()
    }
  }, [image, onRunOCR])

  if (!image) return null
  
  return (
    <div className="px-4 pt-3 space-y-2">
      <img src={image} alt="Captured bill" className="w-full rounded" />
      {ocrProgress > 0 && ocrProgress < 100 && (
        <div className="w-full bg-neutral-800 rounded h-2 overflow-hidden">
          <div className="h-2 bg-blue-500" style={{ width: `${ocrProgress}%` }} />
        </div>
      )}
      {ocrProgress > 0 && ocrProgress < 100 && (
        <p className="text-center text-white text-sm">Processing receipt... {ocrProgress}%</p>
      )}
    </div>
  )
}
