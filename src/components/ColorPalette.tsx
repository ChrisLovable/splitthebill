import Card from './Card'

type Props = {
  colors: string[]
  activeColor: string | null
  totals: Record<string, number>
  onSelect: (c: string) => void
  onAdd: () => void
  onAllocateToColor?: (color: string) => void
}



export default function ColorPalette({ colors, activeColor, totals, onSelect, onAllocateToColor }: Props) {
  return (
    <>
      {/* Oval color total pills with allocation functionality */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, padding: '8px 12px' }}>
        {colors.map((c, i) => (
          <Card 
            key={`tile-${c}`} 
            style={{ 
              background: c, 
              color: '#ffffff', 
              height: 40, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end', 
              padding: '0 12px', 
              paddingLeft: 32, 
              position: 'relative',
              cursor: 'pointer',
              border: activeColor === c ? '3px solid #fff' : '2px solid rgba(0,0,0,0.3)',
              boxShadow: activeColor === c 
                ? `0 0 15px ${c}AA, 0 0 25px ${c}77, inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.4)`
                : 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)',
              transform: activeColor === c ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              onSelect(c)
              if (onAllocateToColor) onAllocateToColor(c)
            }}
          >
            <span style={{ fontWeight: 800, color: '#ffffff', textAlign: 'right', width: '100%' }}>R{(totals[c] || 0).toFixed(2)}</span>
            {/* Number label near the left inside the pill with round black border */}
            <span
              style={{
                position: 'absolute',
                left: 8,
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid #000',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                color: '#000',
                fontWeight: 400,
                fontSize: 14,
                background: 'rgba(255,255,255,0.9)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {(i + 1).toString()}
            </span>
          </Card>
        ))}
      </div>
    </>
  )
}
