import type { BillItem } from '../types'
import { useState } from 'react'
import CalculatorModal from './CalculatorModal'

type Props = {
  items: BillItem[]
  onAllocate: (idx: number) => void
  onDeallocate: (idx: number, color: string) => void
  onChangePrice: (idx: number, unitPrice: number) => void
  onChangeQuantity: (idx: number, originalQuantity: number) => void
  onAddRow?: () => void
  onChangeDescription?: (idx: number, description: string) => void
  onDeleteRow?: (idx: number) => void
  onOverrideAllocation?: (idx: number, fromColor: string) => void
  disabled?: boolean
}

function ItemsTable({ items, onAllocate, onChangePrice, onChangeQuantity, onAddRow, onChangeDescription, onDeleteRow, onOverrideAllocation, disabled = false }: Props) {
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [calcValue, setCalcValue] = useState(0)
  const [calcTarget, setCalcTarget] = useState<{ type: 'price' | 'qty'; index: number } | null>(null)
  // Calculate total Food & Beverages using ORIGINAL quantities (quantity + allocated)
  const itemsTotal = items.reduce((sum, it) => {
    const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
    const originalQty = it.quantity + allocatedQty
    return sum + it.unitPrice * originalQty
  }, 0)

  const tdBase: React.CSSProperties = {
    padding: '8px',
    border: '1px solid rgba(0,0,0,0.9)',
    color: '#000000',
    verticalAlign: 'middle',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: '"Courier New", Courier, monospace',
    background: 'transparent',
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 55%, rgba(0,0,0,0.06) 100%)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -4px 8px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)'
  }

  const getButtonStyle = (item: any): React.CSSProperties => {
    const colorAllocations: Record<string, number> = item.colorAllocations || {}
    const allocationEntries = Object.entries(colorAllocations).filter(([, v]) => (v || 0) > 0)
    const allocatedQty = allocationEntries.reduce((s, [, v]) => s + (v || 0), 0)
    const remainingQty = Math.max(0, (item.quantity || 0))
    const totalQty = Math.max(1, allocatedQty + remainingQty)

    // Build proportional slices for each allocated color (conic/pie)
    type Slice = { color: string; pct: number }
    const slices: Slice[] = allocationEntries.map(([color, v]) => ({ color, pct: (v / totalQty) * 100 }))
    if (remainingQty > 0) {
      slices.push({ color: '#888', pct: (remainingQty / totalQty) * 100 })
    }

    let backgroundColor = '#0f0f0f'
    const baseGradient = 'linear-gradient(180deg, #3a3a3a 0%, #0f0f0f 100%)'
    let backgroundImage: string | undefined = baseGradient

    if (slices.length === 1) {
      backgroundColor = slices[0].color
      backgroundImage = undefined // Solid color for single allocation
    } else if (slices.length > 1) {
      let acc = 0
      const stops: string[] = []
      for (const slice of slices) {
        const startDeg = (acc / 100) * 360
        const endDeg = ((acc + slice.pct) / 100) * 360
        stops.push(`${slice.color} ${startDeg.toFixed(2)}deg ${endDeg.toFixed(2)}deg`)
        acc += slice.pct
      }
      backgroundColor = slices[0].color
      backgroundImage = `conic-gradient(from 0deg at 50% 50%, ${stops.join(', ')}), ${baseGradient}`
    }

    return {
      width: 44,
      height: 44,
      padding: 0,
      borderRadius: '50%',
      border: '2px solid rgba(0,0,0,0.9)',
      backgroundColor,
      backgroundImage,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: '#fff',
      cursor: 'pointer',
      boxShadow: '0 6px 12px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.25)',
      outline: 'none'
    }
  }

  return (
    <section style={{ padding: '12px 16px' }}>
      <div style={{ 
        width: '100%', 
        borderRadius: 12,
        border: '3px solid #000',
        borderStyle: 'outset',
        boxShadow: '0 10px 18px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.25)',
        background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
        overflow: 'hidden',
        padding: 6
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          background: 'transparent'
        }}>
          <colgroup>
            <col style={{ width: 28 }} />
            <col style={{ width: '56%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <tbody>
            {items.length > 0 ? (
              <>
              {items.map((it, idx) => {
                const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
                const originalQty = it.quantity + allocatedQty
                return (
                <tr key={idx} style={{ background: idx % 2 ? '#ffffff' : '#ADD8E6' }}>
                  <td style={{ ...tdBase, padding: 0, textAlign: 'center', verticalAlign: 'middle', background: 'transparent' }}>
                    <div style={{ width: 18, height: 18, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => onDeleteRow && onDeleteRow(idx)}
                        title="Delete this row"
                        style={{
                          width: 18,
                          height: 18,
                          minWidth: 18,
                          minHeight: 18,
                          maxWidth: 18,
                          maxHeight: 18,
                          aspectRatio: '1 / 1',
                          borderRadius: '50%',
                          border: '2px solid #7f1d1d',
                          borderStyle: 'outset',
                          background: 'linear-gradient(145deg, #f87171, #b91c1c)',
                          color: '#fff',
                          padding: 0,
                          boxSizing: 'border-box',
                          cursor: onDeleteRow ? 'pointer' : 'not-allowed',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.35)',
                          display: 'block',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          appearance: 'none',
                          WebkitAppearance: 'none'
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '60%',
                            height: 2,
                            borderRadius: 1,
                            background: '#ffffff'
                          }}
                        />
                      </button>
                    </div>
                  </td>
                  <td
                    style={{ ...tdBase, wordBreak: 'break-word' }}
                    onClick={() => {
                      const el = document.getElementById(`desc-input-${idx}`) as HTMLInputElement | null
                      el?.focus()
                    }}
                  >
                    <textarea
                      id={`desc-input-${idx}`}
                      value={it.description}
                      placeholder="Item description"
                      rows={1}
                      onChange={(e) => onChangeDescription && onChangeDescription(idx, e.target.value)}
                      onInput={(e) => { const t = e.currentTarget as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px` }}
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        padding: 0,
                        margin: 0,
                        background: 'transparent',
                        color: '#000',
                        fontWeight: 600,
                        fontFamily: '"Courier New", Courier, monospace',
                        cursor: 'text',
                        position: 'relative',
                        zIndex: 1,
                        resize: 'none',
                        overflow: 'hidden',
                        lineHeight: 1.2,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    />
                  </td>
                  <td
                    style={{ ...tdBase, whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'center' }}
                    onClick={() => { setCalcTarget({ type: 'price', index: idx }); setCalcValue(it.unitPrice); setIsCalcOpen(true) }}
                  >
                    <span style={{ fontWeight: 600, fontFamily: '"Courier New", Courier, monospace' }}>
                      {Number.isFinite(it.unitPrice) ? (+it.unitPrice).toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td
                    style={{ ...tdBase, whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'center' }}
                    onClick={() => { setCalcTarget({ type: 'qty', index: idx }); setCalcValue(originalQty); setIsCalcOpen(true) }}
                  >
                    <span style={{ fontWeight: 600, fontFamily: '"Courier New", Courier, monospace' }}>{it.quantity}</span>
                  </td>
                  <td style={{ ...tdBase, textAlign: 'center', verticalAlign: 'middle', background: 'transparent' }}>
                    <div style={{ position: 'relative', width: 44, height: 44, margin: '0 auto', transform: 'translateX(-6px)' }}>
                      <button 
                        style={{
                          ...getButtonStyle(it),
                          width: '100%',
                          height: '100%',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.6 : 1
                        }} 
                        onClick={() => !disabled && onAllocate(idx)}
                        disabled={disabled}
                      ></button>
                      <svg viewBox="-4 -4 48 48" width={44} height={44} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                        {(() => {
                          const entries = Object.entries(it.colorAllocations || {}).filter(([, v]) => (v || 0) > 0)
                          const allocated = entries.reduce((s, [, v]) => s + (v || 0), 0)
                          const remainingQty = Math.max(0, (it.quantity || 0))
                          const total = Math.max(1, allocated + remainingQty)
                          let accPct = 0
                          const r = 16 // keep labels inside the circle
                          const minPctToShow = 10 // hide tiny slivers to reduce clutter
                          const labels: any[] = []
                          entries.forEach(([color, count]) => {
                            const pct = (count / total) * 100
                            if (pct < minPctToShow) { accPct += pct; return }
                            const midDeg = (accPct + pct / 2) * 3.6
                            accPct += pct
                            const rad = (midDeg - 90) * Math.PI / 180
                            const x = 20 + r * Math.cos(rad)
                            const y = 20 + r * Math.sin(rad)
                            labels.push(
                              <g key={color} onClick={() => onOverrideAllocation && onOverrideAllocation(idx, color)} style={{ cursor: onOverrideAllocation ? 'pointer' : 'default' }}>
                                <circle cx={x} cy={y} r={5} fill="rgba(0,0,0,0.9)" />
                                <circle cx={x - 1} cy={y - 1} r={4} fill="rgba(255,255,255,0.16)" />
                                <text
                                  x={x}
                                  y={y}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  style={{ fontSize: 11, fontWeight: 400, fill: '#ffffff' }}
                                >
                                  {count}
                                </text>
                              </g>
                            )
                          })
                          // If total quantity is exactly 1 and a single slice exists, center the label
                          if (total === 1 && labels.length === 1) {
                            return (
                              <g>
                                <circle cx={20} cy={20} r={5} fill="rgba(0,0,0,0.9)" />
                                <circle cx={19} cy={19} r={4} fill="rgba(255,255,255,0.16)" />
                                <text x={20} y={20} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 400, fill: '#ffffff' }}>1</text>
                              </g>
                            )
                          }
                          return labels
                        })()}
                      </svg>
                    </div>
                  </td>
                </tr>
              )})}
              {/* Total row inside the table */}
              <tr>
                {/* Label spans delete + description columns */}
                <td colSpan={2} style={{ ...tdBase, fontWeight: 600, fontFamily: '"Courier New", Courier, monospace', fontSize: 14, background: '#d4edda' }}>Total Food & Beverages</td>
                {/* Amount spans price + quantity + allocation columns */}
                <td colSpan={3} style={{ ...tdBase, fontWeight: 600, fontFamily: '"Courier New", Courier, monospace', whiteSpace: 'nowrap', textAlign: 'center', fontSize: 14, background: '#d4edda' }}>
                  <span style={{ fontWeight: 600, fontFamily: '"Courier New", Courier, monospace' }}>{itemsTotal.toFixed(2)}</span>
                </td>
              </tr>
              {/* Add row control */}
              <tr>
                <td colSpan={5} style={{ ...tdBase, background: '#ffffff', textAlign: 'center' }}>
                  <button
                    onClick={() => onAddRow && onAddRow()}
                    disabled={!onAddRow}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '2px solid #059669',
                      borderStyle: 'outset',
                      background: 'linear-gradient(145deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: onAddRow ? 'pointer' : 'not-allowed',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
                    }}
                    title="Add a new row duplicating the last item's description, price, and quantity"
                  >
                    + Add row
                  </button>
                </td>
              </tr>
              </>
            ) : (
              <tr>
                <td colSpan={4} style={{ ...tdBase, textAlign: 'center', fontStyle: 'italic', background: '#f0f0f0' }}>
                  No items added
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CalculatorModal
        isOpen={isCalcOpen}
        currentValue={calcValue}
        onClose={() => setIsCalcOpen(false)}
        onConfirm={(val) => {
          if (!calcTarget) return
          if (calcTarget.type === 'price') {
            onChangePrice(calcTarget.index, Math.max(0, +val))
          } else {
            onChangeQuantity(calcTarget.index, Math.max(0, Math.floor(+val)))
          }
        }}
        showOperations={false}
        confirmLabel="Change"
        compact
      />
    </section>
  )
}

export default ItemsTable
