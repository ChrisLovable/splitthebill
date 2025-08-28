import type { BillItem } from '../types'

type Props = {
  items: BillItem[]
  onAllocate: (idx: number) => void
  onDeallocate: (idx: number, color: string) => void
  disabled?: boolean
}

export default function ItemsTable({ items, onAllocate, disabled = false }: Props) {
  if (items.length === 0) return null



  const tdBase: React.CSSProperties = {
    padding: '8px',
    border: '1px solid #000',
    color: '#000000',
    verticalAlign: 'top',
    fontSize: 12
  }

  const getButtonStyle = (item: any): React.CSSProperties => {
    const allocatedColors = Object.keys(item.colorAllocations || {}).filter(c => (item.colorAllocations[c] || 0) > 0)
    
    let background = '#888' // Default grey
    let backgroundImage = 'none'
    
    if (allocatedColors.length === 1) {
      // Single color - use that color
      background = allocatedColors[0]
    } else if (allocatedColors.length >= 2) {
      // Multiple colors - create a multi-stop gradient
      const segments = allocatedColors.length
      const segmentSize = 100 / segments
      
      // Create linear gradient stops
      const gradientStops = allocatedColors.map((color, idx) => {
        const start = idx * segmentSize
        const end = (idx + 1) * segmentSize
        return `${color} ${start}% ${end}%`
      }).join(', ')
      
      // Use multiple background approaches for compatibility
      background = allocatedColors[0] // fallback
      backgroundImage = `linear-gradient(45deg, ${gradientStops})`
      
      // For 3+ colors, also try conic gradient as overlay
      if (allocatedColors.length >= 3) {
        const conicStops = allocatedColors.map((color, idx) => {
          const angle = (360 / segments) * idx
          const nextAngle = (360 / segments) * (idx + 1)
          return `${color} ${angle}deg ${nextAngle}deg`
        }).join(', ')
        
        backgroundImage = `conic-gradient(${conicStops}), ${backgroundImage}`
      }
    }
    
    return {
      width: 40,
      height: 40,
      padding: 0,
      borderRadius: '50%',
      border: 'none',
      background,
      backgroundImage,
      color: '#fff',
      cursor: 'pointer',
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)'
    }
  }

  return (
    <section style={{ padding: '12px 16px' }}>
      <div style={{ width: '100%' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          tableLayout: 'fixed'
        }}>
          <colgroup>
            <col style={{ width: '55%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} style={{ background: idx % 2 ? '#ffffff' : '#ADD8E6' }}>
                <td style={{ ...tdBase, wordBreak: 'break-word' }}>
                  <div style={{ fontWeight: 600 }}>{it.description}</div>
                </td>
                <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>R{it.unitPrice.toFixed(2)}</td>
                <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>{it.quantity}</td>
                <td style={{ ...tdBase, textAlign: 'center', background: '#000', border: 'none' }}>
                  <button 
                    style={{
                      ...getButtonStyle(it),
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.6 : 1
                    }} 
                    onClick={() => !disabled && onAllocate(idx)}
                    disabled={disabled}
                  ></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
