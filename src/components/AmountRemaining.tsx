import type { BillItem, BillCharge, TipAllocation } from '../types'

type Props = {
  items: BillItem[]
  charges: BillCharge[]
  tipInput: number
  tipAllocations: TipAllocation
  splitChargesEvenly: boolean
  selectedChargeColor: string | null
  splitTipEvenly: boolean
  selectedTipColor: string | null
  splitEvenly: boolean
}

export default function AmountRemaining({ items, charges, tipInput, tipAllocations, splitChargesEvenly, selectedChargeColor, splitTipEvenly, selectedTipColor, splitEvenly }: Props) {
  // Calculate remaining amount: TOTAL EVERYTHING - WHAT'S ALLOCATED
  const displayAmount = (() => {
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
    totalEverything += tipInput || 0
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
    if (tipInput > 0 && (splitTipEvenly || selectedTipColor)) {
      allocatedAmount += tipInput
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
  })()

  return (
    <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
      <button style={{
        width: '220px',
        height: '60px',
        background: '#888',
        color: '#fff',
        border: '3px solid #000',
        borderStyle: 'outset',
        borderRadius: '12px',
        fontSize: '20px',
        fontWeight: 'bold',
        boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -6px 12px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>Amount Remaining</span>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>R{displayAmount.toFixed(2)}</span>
      </button>
    </div>
  )
}
