import type { RefObject } from 'react'
import { useRef } from 'react'

type Props = {
  isCapturing: boolean
  isScanning?: boolean
  videoRef: RefObject<HTMLVideoElement>
  onOpen: () => void
  onCapture: () => void
  onCancel: () => void
  onFileSelect: (file: File) => void
  onStartScanning?: () => void
  onStopScanning?: () => void
}

export default function CameraCapture({ isCapturing, isScanning, videoRef, onOpen, onCapture, onCancel, onFileSelect, onStartScanning, onStopScanning }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <section className="space-y-2">
      {!isCapturing && (
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={onOpen} 
            onTouchStart={() => {}} 
            className="btn-3d relative font-bold touch-manipulation" 
            style={{ 
              width: 130, 
              height: 60, 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              background: '#00FF00',
              color: '#000',
              border: '2px solid #000',
              borderStyle: 'outset',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 255, 0, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)',
              textAlign: 'center',
              lineHeight: 1.2,
              wordWrap: 'break-word',
              alignSelf: 'flex-start',
              marginLeft: '10px'
            }}
          >
            <span className="shine" aria-hidden />
            Open Camera
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-3d relative font-bold touch-manipulation" 
            style={{ 
              width: 130, 
              height: 60, 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              background: '#00FF00',
              color: '#000',
              border: '2px solid #000',
              borderStyle: 'outset',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 255, 0, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)',
              textAlign: 'center',
              lineHeight: 1.2,
              wordWrap: 'break-word',
              alignSelf: 'center'
            }}
          >
            <span className="shine" aria-hidden />
            Select from Gallery
          </button>

          <button 
            onClick={() => {
              if (onStartScanning) {
                onStartScanning()
              } else {
                onOpen()
              }
            }}
            className="btn-3d relative font-bold touch-manipulation" 
            style={{ 
              width: 130, 
              height: 60, 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              background: '#00FF00',
              color: '#000',
              border: '2px solid #000',
              borderStyle: 'outset',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 255, 0, 0.4), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)',
              textAlign: 'center',
              lineHeight: 1.2,
              wordWrap: 'break-word',
              alignSelf: 'flex-end',
              marginRight: '10px'
            }}
          >
            <span className="shine" aria-hidden />
            Scan (Long bills)
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onFileSelect(file)
                e.target.value = '' // Reset input
              }
            }}
          />
        </div>
      )}
      {isCapturing && (
        <div className="space-y-2">
          <video ref={videoRef} className="w-full rounded" playsInline muted autoPlay></video>
          
          {/* Scanning indicator */}
          {isScanning && (
            <div style={{
              background: 'linear-gradient(145deg, #ff6b35, #f7931e)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              textAlign: 'center',
              fontWeight: 'bold',
              border: '2px solid #000',
              borderStyle: 'outset',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              animation: 'pulse 2s infinite'
            }}>
              🔍 Scanning continuously... Hold steady over receipt
            </div>
          )}
          
          <div className="flex gap-2">
            {!isScanning ? (
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
            ) : (
              <button 
                className="flex-1 font-bold touch-manipulation" 
                onClick={onStopScanning}
                style={{
                  minHeight: '35px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #dc2626',
                  borderStyle: 'outset',
                  background: 'linear-gradient(145deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(239, 68, 68, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                ⏹️ Stop Scanning
              </button>
            )}
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
