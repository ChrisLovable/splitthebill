type Props = {
  subtotal: number
  tipTotal: number
  grandTotal: number
}

export default function BottomSummary({ subtotal, tipTotal, grandTotal }: Props) {
  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="h-10 rounded border border-cyan-700 bg-cyan-900 text-white text-sm flex items-center justify-center">Food &amp; Beverages</div>
        <div className="h-10 rounded border border-cyan-700 bg-cyan-900 text-white text-sm flex items-center justify-center">Tip</div>
        <div className="h-10 rounded border border-cyan-700 bg-cyan-900 text-white text-sm flex items-center justify-center">Total</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1 text-white text-sm">
        <div className="text-center">${subtotal.toFixed(2)}</div>
        <div className="text-center">${tipTotal.toFixed(2)}</div>
        <div className="text-center font-semibold">${grandTotal.toFixed(2)}</div>
      </div>
    </div>
  )
}

