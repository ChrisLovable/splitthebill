type Props = {
  totalsByColor: Record<string, number>
}

export default function TotalsSummary({ totalsByColor }: Props) {
  if (Object.keys(totalsByColor).length === 0) return null
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Totals</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(totalsByColor).map(([color, total]) => (
          <div key={color} className="p-3 rounded border border-neutral-800 bg-neutral-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
              <span className="text-sm">{color}</span>
            </div>
            <div className="font-semibold">${total.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

