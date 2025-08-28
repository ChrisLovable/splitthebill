import CalculatorModal from './CalculatorModal'
import { useState, useMemo } from 'react'
import type { BillItem, BillCharge, TipAllocation } from '../types'

type Props = {
  tipAmount: number
  setTipAmount: (n: number) => void
  splitTipEvenly: boolean
  setSplitTipEvenly: (v: boolean) => void
  selectedTipColor: string | null
  setSelectedTipColor: (c: string | null) => void
  activeColor: string | null
  // Additional props needed to calculate remaining amount
  items: BillItem[]
  charges: BillCharge[]
  tipAllocations: TipAllocation
  splitChargesEvenly: boolean
  selectedChargeColor: string | null
  splitEvenly: boolean
}

export default function TipTable({ tipAmount, setTipAmount, splitTipEvenly, setSplitTipEvenly, selectedTipColor, setSelectedTipColor, activeColor, items, charges, tipAllocations, splitChargesEvenly, selectedChargeColor, splitEvenly }: Props) {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  
  // Calculate remaining amount (same logic as AmountRemaining component)
  const remainingAmount = useMemo(() => {
    // STEP 1: Calculate TOTAL of everything (TIP + SERVICE + ITEMS)
    let totalEverything = 0
    
    // ALL ITEMS (original quantities)
    let itemsTotal = 0
    for (const item of items) {
      const allocatedQty = Object.values(item.colorAllocations || {}).reduce((a, b) => a + b, 0)
      const originalQty = item.quantity + allocatedQty  // item.quantity is remaining, so add back allocated
      itemsTotal += originalQty * item.unitPrice
    }
    totalEverything += itemsTotal
    
    // ALL SERVICE CHARGES
    const totalCharges = charges.reduce((s, c) => s + c.amount, 0)
    totalEverything += totalCharges
    
    // ALL TIP (both input and manual allocations)
    totalEverything += tipAmount || 0
    const manualTipTotal = Object.values(tipAllocations).reduce((a, b) => a + b, 0)
    totalEverything += manualTipTotal
    
    // STEP 2: Calculate what's been allocated to colors
    let allocatedAmount = 0
    
    // Allocated items
    for (const item of items) {
      const allocatedQty = Object.values(item.colorAllocations || {}).reduce((a, b) => a + b, 0)
      allocatedAmount += allocatedQty * item.unitPrice
    }
    
    // Allocated charges (if split evenly or assigned to a color)
    if (totalCharges > 0 && (splitChargesEvenly || selectedChargeColor)) {
      allocatedAmount += totalCharges
    }
    
    // Allocated tip input (if split evenly or assigned to a color)
    if (tipAmount > 0 && (splitTipEvenly || selectedTipColor)) {
      allocatedAmount += tipAmount
    }
    
    // Allocated manual tips (always allocated)
    allocatedAmount += manualTipTotal
    
    // STEP 3: REMAINING = TOTAL - ALLOCATED
    const remaining = totalEverything - allocatedAmount
    
    // If split evenly is enabled, remaining becomes 0 (everything gets allocated)
    if (splitEvenly) {
      return 0
    }
    
    return +remaining.toFixed(2)
  }, [items, charges, tipAmount, tipAllocations, splitChargesEvenly, selectedChargeColor, splitTipEvenly, selectedTipColor, splitEvenly])
  
  console.log('TipTable rendered with tipAmount:', tipAmount, 'remainingAmount:', remainingAmount)
  const td: React.CSSProperties = { 
    padding: 8, 
    border: '1px solid #000', 
    color: '#000', 
    fontSize: 16,
    fontWeight: 'bold'
  }

  const handleAllocate = () => {
    if (splitTipEvenly) return
    if (selectedTipColor) return
    if (activeColor) setSelectedTipColor(activeColor)
  }

  const bigInputStyle: React.CSSProperties = {
    width: '100px',
    padding: '12px 16px',
    border: '3px solid #000',
    borderStyle: 'inset',
    background: '#ffffff',
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    borderRadius: 8,
    boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.5)',
    textAlign: 'center',
    // Remove number input spinner and scroll
    MozAppearance: 'textfield' as any,
    WebkitAppearance: 'none'
  }

  return (
    <section style={{ padding: '12px 16px' }}>
      {/* Big Tip Amount Input Above Table */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 16, gap: 8 }}>
        <label style={{ color: '#0066FF', fontSize: 18, fontWeight: 'bold' }}>Tip Amount</label>
        <input
          type="text"
          value={tipAmount ? `R${tipAmount.toFixed(2).replace(',', '.')}` : 'R0.00'}
          onClick={() => setIsCalculatorOpen(true)}
          onFocus={() => setIsCalculatorOpen(true)}
          readOnly
          placeholder="R0.00"
          style={{...bigInputStyle, cursor: 'pointer'}}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
        <label style={{ color: '#0066FF', fontSize: 17, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input 
            type="checkbox" 
            checked={splitTipEvenly} 
            onChange={(e) => setSplitTipEvenly(e.target.checked)}
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid #000',
              borderStyle: 'inset',
              borderRadius: '4px',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.5)',
              cursor: 'pointer'
            }}
          />
          <span>Split tip evenly</span>
        </label>
      </div>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        tableLayout: 'fixed'
      }}>
        <colgroup>
          <col style={{ width: '55%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <tbody>
          <tr style={{ background: '#ffffff' }}>
            <td style={td}>Tip</td>
            <td style={td}>R{Number(tipAmount || 0).toFixed(2)}</td>
            <td style={{ ...td, textAlign: 'center', verticalAlign: 'middle', background: '#000', border: 'none' }}>
              <button
                onClick={handleAllocate}
                disabled={splitTipEvenly || (!!selectedTipColor) || !(tipAmount > 0)}
                style={{ 
                  width: 40, 
                  height: 40, 
                  padding: 0, 
                  borderRadius: '50%', 
                  border: '3px solid #000', 
                  borderStyle: 'outset',
                  background: '#888', 
                  color: '#fff', 
                  cursor: splitTipEvenly || (!!selectedTipColor) ? 'not-allowed' : 'pointer',
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)'
                }}
                title={splitTipEvenly ? 'Disable even split to allocate to a color' : selectedTipColor ? `Allocated to ${selectedTipColor}` : activeColor ? `Allocate to active color ${activeColor}` : 'Select a color to allocate'}
              >

              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <CalculatorModal
        isOpen={isCalculatorOpen}
        currentValue={tipAmount}
        onClose={() => setIsCalculatorOpen(false)}
        onConfirm={(value) => setTipAmount(value)}
        remainingAmount={remainingAmount}
      />
    </section>
  )
}

