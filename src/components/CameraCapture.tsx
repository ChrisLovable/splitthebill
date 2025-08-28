import { RefObject } from 'react'

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
          <button onClick={onOpen} className="btn-3d relative text-[12px] font-extrabold uppercase" style={{ width: 100, height: 50 }}>
            <span className="shine" aria-hidden />
            OPEN CAMERA
          </button>
        </div>
      )}
      {isCapturing && (
        <div className="space-y-2">
          <video ref={videoRef} className="w-full rounded" playsInline muted></video>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded bg-emerald-600 text-white" onClick={onCapture}>Capture</button>
            <button className="flex-1 py-2 rounded bg-neutral-700 text-white" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}
