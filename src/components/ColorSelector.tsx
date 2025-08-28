type Props = {
  colors: string[]
  activeColor: string | null
  onSelect: (c: string) => void
  onAdd: () => void
}

export default function ColorSelector({ colors, activeColor, onSelect, onAdd }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {colors.map(c => (
        <button key={c} aria-label={`color ${c}`} onClick={() => onSelect(c)} className={`w-8 h-8 rounded-full border ${activeColor === c ? 'ring-2 ring-white' : 'opacity-80'}`} style={{ backgroundColor: c }} />
      ))}
      <button className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700" onClick={onAdd}>+</button>
    </div>
  )
}

