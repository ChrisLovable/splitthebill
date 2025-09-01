import type { BillItem, BillCharge, TipAllocation } from '../types'
import { useMemo } from 'react'

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
  console.log('[AmountRemaining] RENDER')
  console.log('[AmountRemaining] component rendered with tipInput:', tipInput)
  console.log('[AmountRemaining] Items:', items)
  console.log('[AmountRemaining] Charges:', charges) 
  console.log('[AmountRemaining] TipAllocations:', tipAllocations)
  console.log('[AmountRemaining] splitChargesEvenly:', splitChargesEvenly)
  console.log('[AmountRemaining] selectedChargeColor:', selectedChargeColor)
  console.log('[AmountRemaining] splitTipEvenly:', splitTipEvenly)
  console.log('[AmountRemaining] selectedTipColor:', selectedTipColor)
  console.log('[AmountRemaining] splitEvenly:', splitEvenly)
  
  const totals = useMemo(() => {
    console.log('[AmountRemaining] === AMOUNT REMAINING DEBUG ===')
    console.log('[AmountRemaining] tipInput:', tipInput)
    console.log('[AmountRemaining] splitTipEvenly:', splitTipEvenly)
    console.log('[AmountRemaining] selectedTipColor:', selectedTipColor)
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
    
    // ONLY SERVICE CHARGES (exclude VAT, taxes, etc.)
    const isService = (label: string) => /service\s*(charge|chg)|\bserc\b/i.test(label)
    const serviceChargeTotal = charges.filter(c => isService(c.label)).reduce((s, c) => s + c.amount, 0)
    totalEverything += serviceChargeTotal
    
    // ALL TIP (both input and manual allocations)
    const manualTipTotal = Object.values(tipAllocations).reduce((a, b) => a + b, 0)
    totalEverything += tipInput || 0
    
    // STEP 2: Calculate what's been allocated to colors
    let allocatedAmount = 0
    
    // Allocated items
    for (const item of items) {
      const allocatedQty = Object.values(item.colorAllocations || {}).reduce((a, b) => a + b, 0)
      allocatedAmount += allocatedQty * item.unitPrice
    }
    
    // Allocated charges (if split evenly or assigned to a color)
    if (serviceChargeTotal > 0 && (splitChargesEvenly || selectedChargeColor)) {
      allocatedAmount += serviceChargeTotal
    }
    
    // Allocated tip input (if split evenly or assigned to a color)
    if (tipInput > 0 && (splitTipEvenly || selectedTipColor)) {
      allocatedAmount += tipInput
    }
    
    // Allocated manual tips (always allocated)
    allocatedAmount += manualTipTotal
    
    // STEP 3: REMAINING = TOTAL - ALLOCATED
    const remaining = totalEverything - allocatedAmount
    
    console.log('[AmountRemaining] Total everything:', totalEverything)
    console.log('[AmountRemaining] Allocated amount:', allocatedAmount)
    console.log('[AmountRemaining] Remaining:', remaining)
    console.log('[AmountRemaining] === END AMOUNT REMAINING DEBUG ===')
    
    // If split evenly is enabled, remaining becomes 0 (everything gets allocated)
    if (splitEvenly) {
      return { total: +totalEverything.toFixed(2), remaining: 0 }
    }

    return { total: +totalEverything.toFixed(2), remaining: +remaining.toFixed(2) }
  }, [items, charges, tipInput, tipAllocations, splitChargesEvenly, selectedChargeColor, splitTipEvenly, selectedTipColor, splitEvenly])

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
        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>AMOUNT REMAINING</span>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>R{totals.remaining.toFixed(2)}</span>
      </button>
    </div>
  )
}
