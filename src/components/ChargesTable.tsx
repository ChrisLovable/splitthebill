import type { BillCharge } from '../types'
import { useState } from 'react'
import CalculatorModal from './CalculatorModal'

type Props = {
  charges: BillCharge[]
  splitChargesEvenly: boolean
  setSplitChargesEvenly: (v: boolean) => void
  selectedChargeColor: string | null
  setSelectedChargeColor: (c: string | null) => void
  activeColor: string | null
  // handler to change the overall charges total via calculator
  onChangeChargesTotal?: (total: number) => void
}

export default function ChargesTable({ charges, splitChargesEvenly, setSplitChargesEvenly, selectedChargeColor, setSelectedChargeColor, activeColor, onChangeChargesTotal }: Props) {
  // Only treat service charges as allocatable/displayed here
  const isService = (label: string) => /service\s*(charge|chg)|\bserc\b/i.test(label)
  const serviceChargeTotal = charges.filter(c => isService(c.label)).reduce((sum, charge) => sum + charge.amount, 0)
  if (serviceChargeTotal === 0) return null

  const td: React.CSSProperties = { 
    padding: 8, 
    border: '1px solid #000', 
    color: '#000', 
    fontSize: 16,
    fontWeight: 'bold'
  }

  const handleAllocate = () => {
    if (splitChargesEvenly) return
    if (selectedChargeColor) return // already allocated explicitly
    if (activeColor) setSelectedChargeColor(activeColor)
  }

  const [isCalcOpen, setIsCalcOpen] = useState(false)
  return (
    <section style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
        <label style={{ color: '#0066FF', fontSize: 17, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input 
            type="checkbox" 
            checked={splitChargesEvenly} 
            onChange={(e) => setSplitChargesEvenly(e.target.checked)}
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
          <span>Split service charges evenly</span>
        </label>
        {/* Removed color dropdown per request */}
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
            <td style={td}>Service charges</td>
            <td style={{ ...td, cursor: onChangeChargesTotal ? 'pointer' : 'default' }} onClick={() => {
              if (onChangeChargesTotal) setIsCalcOpen(true)
            }}>R{serviceChargeTotal.toFixed(2)}</td>
            <td style={{ ...td, textAlign: 'center', verticalAlign: 'middle', background: '#000', border: 'none' }}>
              <button
                onClick={handleAllocate}
                disabled={splitChargesEvenly || (!!selectedChargeColor)}
                style={{ 
                  width: 40, 
                  height: 40, 
                  padding: 0, 
                  borderRadius: '50%', 
                  border: '3px solid #000', 
                  borderStyle: 'outset',
                  background: '#888', 
                  color: '#fff', 
                  cursor: splitChargesEvenly || (!!selectedChargeColor) ? 'not-allowed' : 'pointer',
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)'
                }}
                title={splitChargesEvenly ? 'Disable even split to allocate to a color' : selectedChargeColor ? `Allocated to ${selectedChargeColor}` : activeColor ? `Allocate to active color ${activeColor}` : 'Select a color to allocate'}
              >

              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {onChangeChargesTotal && (
        <CalculatorModal
          isOpen={isCalcOpen}
          currentValue={serviceChargeTotal}
          onClose={() => setIsCalcOpen(false)}
          onConfirm={(val) => onChangeChargesTotal(val)}
          showOperations={false}
          confirmLabel="Change"
          compact
        />
      )}
    </section>
  )
}
