import type { RefObject } from 'react'

type Props = {
  isCapturing: boolean
  videoRef: RefObject<HTMLVideoElement>
  onOpen: () => void
  onCapture: () => void
  onCancel: () => void
}

export default function CameraCapture({ isCapturing, videoRef, onOpen, onCapture, onCancel }: Props) {
  return (
    <section className="space-y-2">
      {!isCapturing && (
        <div className="flex items-center justify-center">
          <button 
            onClick={onOpen} 
            onTouchStart={() => {}} 
            className="btn-3d relative text-[12px] font-extrabold uppercase touch-manipulation" 
            style={{ width: 100, height: 50, cursor: 'pointer' }}
          >
            <span className="shine" aria-hidden />
            OPEN CAMERA
          </button>
        </div>
      )}
      {isCapturing && (
        <div className="space-y-2">
          <video ref={videoRef} className="w-full rounded" playsInline muted autoPlay></video>
          <div className="flex gap-2">
            <button 
              className="flex-1 font-bold touch-manipulation" 
              onClick={onCapture}
              style={{
                minHeight: '35px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid #059669',
                borderStyle: 'outset',
                background: 'linear-gradient(145deg, #10b981, #059669)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(1px)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(0,0,0,0.2)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)'
              }}
            >
              📸 Capture
            </button>
            <button 
              className="flex-1 font-bold touch-manipulation" 
              onClick={onCancel}
              style={{
                minHeight: '35px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid #6b7280',
                borderStyle: 'outset',
                background: 'linear-gradient(145deg, #9ca3af, #6b7280)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(107, 114, 128, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(1px)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(107, 114, 128, 0.4), inset 0 1px 2px rgba(0,0,0,0.2)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(107, 114, 128, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(107, 114, 128, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
