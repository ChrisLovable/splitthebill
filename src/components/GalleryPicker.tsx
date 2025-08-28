import { useRef } from 'react'

type Props = {
  onPick: (file: File) => void
}

export default function GalleryPicker({ onPick }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="inline-block">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.currentTarget.value = ''
        }}
      />
      <button
        className="w-full py-3 rounded bg-neutral-700 border border-neutral-600 text-white"
        onClick={() => inputRef.current?.click()}
      >
        Pick from gallery
      </button>
    </div>
  )
}
