type Props = {
  subtotal: number
  tipTotal: number
  grandTotal: number
}

export default function SummaryHeader({ subtotal, tipTotal, grandTotal }: Props) {
  const cell = "flex-1 h-10 flex items-center justify-center text-sm font-semibold border border-cyan-700 bg-cyan-900 text-white rounded"
  return (
    <div className="px-4 pt-4 space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Bill Splitter PWA</h1>
        <span className="text-[10px] text-cyan-300">Phone View</span>
      </div>
      <div className="flex gap-2">
        <div className={cell}>Food &amp; Beverages: ${subtotal.toFixed(2)}</div>
        <div className={cell}>Tip: ${tipTotal.toFixed(2)}</div>
        <div className={cell}>Total: ${grandTotal.toFixed(2)}</div>
      </div>
    </div>
  )
}
