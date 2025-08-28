type Props = {
  incrementTip: (amount: number) => void
  tipAllocations: Record<string, number>
}

export default function TipAllocation({ incrementTip, tipAllocations }: Props) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Tip</h2>
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700" onClick={() => incrementTip(1)}>+$1</button>
        <button className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700" onClick={() => incrementTip(5)}>+$5</button>
        <button className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700" onClick={() => incrementTip(0.5)}>+$0.50</button>
      </div>
      {Object.keys(tipAllocations).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(tipAllocations).map(([color, amt]) => (
            <div key={color} className="flex items-center gap-2 px-2 py-1 rounded bg-neutral-800 border border-neutral-700">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm">${amt.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

