import type { BillItem } from '../types'
import { useState } from 'react'
import CalculatorModal from './CalculatorModal'

type Props = {
  items: BillItem[]
  onAllocate: (idx: number) => void
  onDeallocate: (idx: number, color: string) => void
  onChangePrice: (idx: number, unitPrice: number) => void
  onChangeQuantity: (idx: number, originalQuantity: number) => void
  onAddItem: (description: string, quantity: number, unitPrice: number) => void
  onRemoveItem: (idx: number) => void
  disabled?: boolean
}

function ItemsTable({ items, onAllocate, onChangePrice, onChangeQuantity, onAddItem, onRemoveItem, disabled = false }: Props) {
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [calcValue, setCalcValue] = useState(0)
  const [calcTarget, setCalcTarget] = useState<{ type: 'price' | 'qty'; index: number } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemQty, setNewItemQty] = useState(1)
  const [newItemPrice, setNewItemPrice] = useState(0)
  // Calculate total Food & Beverages using ORIGINAL quantities (quantity + allocated)
  const itemsTotal = items.reduce((sum, it) => {
    const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
    const originalQty = it.quantity + allocatedQty
    return sum + it.unitPrice * originalQty
  }, 0)

  const tdBase: React.CSSProperties = {
    padding: '8px',
    border: '1px solid #000',
    color: '#000000',
    verticalAlign: 'top',
    fontSize: 12
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

    let background = '#0f0f0f'
    const baseGradient = 'linear-gradient(180deg, #3a3a3a 0%, #0f0f0f 100%)'
    let backgroundImage = baseGradient

    if (slices.length === 1) {
      background = slices[0].color
    } else if (slices.length > 1) {
      let acc = 0
      const stops: string[] = []
      for (const slice of slices) {
        const startDeg = (acc / 100) * 360
        const endDeg = ((acc + slice.pct) / 100) * 360
        stops.push(`${slice.color} ${startDeg.toFixed(2)}deg ${endDeg.toFixed(2)}deg`)
        acc += slice.pct
      }
      background = slices[0].color
      backgroundImage = `conic-gradient(${stops.join(', ')}), ${baseGradient}`
    }

    return {
      width: 44,
      height: 44,
      padding: 0,
      borderRadius: '50%',
      border: '2px solid rgba(0,0,0,0.9)',
      background,
      backgroundImage,
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
            <col style={{ width: '55%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <tbody>
            {items.length > 0 ? (
              <>
              {items.map((it, idx) => {
                const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
                const originalQty = it.quantity + allocatedQty
                return (
                <tr key={idx} style={{ background: idx % 2 ? '#ffffff' : '#ADD8E6' }}>
                  <td style={{ ...tdBase, wordBreak: 'break-word' }}>
                    <div style={{ fontWeight: 600 }}>{it.description}</div>
                  </td>
                  <td style={{ ...tdBase, whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => { setCalcTarget({ type: 'price', index: idx }); setCalcValue(it.unitPrice); setIsCalcOpen(true) }}>
                    R{Number.isFinite(it.unitPrice) ? (+it.unitPrice).toFixed(2) : '0.00'}
                  </td>
                  <td style={{ ...tdBase, whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => { setCalcTarget({ type: 'qty', index: idx }); setCalcValue(originalQty); setIsCalcOpen(true) }}>
                    {it.quantity}
                  </td>
                  <td style={{ ...tdBase, textAlign: 'center', background: 'transparent', border: 'none' }}>
                    <div style={{ position: 'relative', width: 44, height: 44, margin: '0 auto' }}>
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
                              <g key={color}>
                                <circle cx={x} cy={y} r={5} fill="rgba(0,0,0,0.9)" stroke="#ffffff" strokeWidth={0.6} />
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
                                <circle cx={20} cy={20} r={5} fill="rgba(0,0,0,0.9)" stroke="#ffffff" strokeWidth={0.6} />
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
              {/* Add new item row */}
              {showAddForm && (
                <tr style={{ background: '#e6f3ff' }}>
                  <td style={{ ...tdBase }}>
                    <input
                      type="text"
                      placeholder="Item description"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: 4 }}
                    />
                  </td>
                  <td style={{ ...tdBase, cursor: 'pointer' }} onClick={() => { setCalcValue(newItemPrice); setIsCalcOpen(true); setCalcTarget({ type: 'price', index: -1 }) }}>
                    R{newItemPrice.toFixed(2)}
                  </td>
                  <td style={{ ...tdBase, cursor: 'pointer' }} onClick={() => { setCalcValue(newItemQty); setIsCalcOpen(true); setCalcTarget({ type: 'qty', index: -1 }) }}>
                    {newItemQty}
                  </td>
                  <td style={{ ...tdBase, textAlign: 'center', background: 'transparent', border: 'none' }}>
                    <div style={{ position: 'relative', width: 44, height: 44, margin: '0 auto' }}>
                      <button 
                        onClick={() => {
                          if (newItemDesc.trim()) {
                            onAddItem(newItemDesc, newItemQty, newItemPrice)
                            setNewItemDesc('')
                            setNewItemQty(1)
                            setNewItemPrice(0)
                            setShowAddForm(false)
                          }
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          padding: 0,
                          borderRadius: '50%',
                          border: '2px solid rgba(0,0,0,0.9)',
                          background: 'linear-gradient(180deg, #3a3a3a 0%, #0f0f0f 100%)',
                          color: '#fff',
                          cursor: 'pointer',
                          boxShadow: '0 6px 12px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.25)',
                          outline: 'none'
                        }}
                      >
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Total row inside the table */}
              <tr>
                <td style={{ ...tdBase, fontWeight: 700, fontSize: 16, background: '#f0f0f0' }}>Total Food & Beverages</td>
                {/* Amount cell spans the next two columns (unit price + quantity) */}
                <td colSpan={2} style={{ ...tdBase, fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right', fontSize: 16, background: '#f0f0f0' }}>R{itemsTotal.toFixed(2)}</td>
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
      
      {/* Add Item Button */}
      <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: '2px solid #000',
            borderStyle: 'outset',
            fontWeight: 'bold',
            cursor: showAddForm ? 'not-allowed' : 'pointer',
            opacity: showAddForm ? 0.6 : 1,
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          + Add Missing Item
        </button>
      </div>
      <CalculatorModal
        isOpen={isCalcOpen}
        currentValue={calcValue}
        onClose={() => setIsCalcOpen(false)}
        onConfirm={(val) => {
          if (!calcTarget) return
          if (calcTarget.index === -1) {
            // New item being added
            if (calcTarget.type === 'price') {
              setNewItemPrice(Math.max(0, +val))
            } else {
              setNewItemQty(Math.max(1, Math.floor(+val)))
            }
          } else {
            // Existing item being edited
            if (calcTarget.type === 'price') {
              onChangePrice(calcTarget.index, Math.max(0, +val))
            } else {
              onChangeQuantity(calcTarget.index, Math.max(0, Math.floor(+val)))
            }
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
