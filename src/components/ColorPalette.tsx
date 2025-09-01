import Card from './Card'

type Props = {
  colors: string[]
  activeColor: string | null
  totals: Record<string, number>
  onSelect: (c: string) => void
  onAdd: () => void
}

function getTextColor(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.5 ? '#111' : '#fff'
}

export default function ColorPalette({ colors, activeColor, totals, onSelect }: Props) {
  return (
    <>
      {/* Color buttons in rows of 5 */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px' }}>
        {Array.from({ length: Math.ceil(colors.length / 5) }, (_, rowIndex) => (
          <div 
            key={rowIndex}
            style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              maxWidth: '100%'
            }}
          >
            {colors.slice(rowIndex * 5, (rowIndex + 1) * 5).map((c, idxInRow) => {
              const idx = rowIndex * 5 + idxInRow
              const numberLabel = (idx + 1).toString()
              const isActive = activeColor === c
              return (
                <button
                  key={c}
                  aria-label={`color ${c}`}
                  onClick={() => onSelect(c)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 9999,
                    background: c,
                    position: 'relative',
                    border: '2px solid rgba(255,255,255,0.75)',
                    boxShadow: isActive
                      ? `0 0 15px ${c}AA, 0 0 30px ${c}88, inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -5px 10px rgba(0,0,0,0.6)`
                      : 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.55)',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    flex: '0 0 auto',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Number label */}
                  <span style={{
                    position: 'relative',
                    zIndex: 1,
                    color: '#000',
                    fontWeight: 400,
                    fontSize: 16,
                    textShadow: '0 1px 0 rgba(255,255,255,0.6)'
                  }}>{numberLabel}</span>

                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      inset: -5,
                      borderRadius: 'inherit',
                      boxShadow: `0 0 20px ${c}99, 0 0 35px ${c}66`,
                      pointerEvents: 'none'
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
        {colors.map((c, i) => (
          <Card key={`tile-${c}`} style={{ background: c, color: '#ffffff', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10px', paddingLeft: 28, position: 'relative' }}>
            <span style={{ fontWeight: 800, color: '#ffffff', textAlign: 'right', width: '100%' }}>R{(totals[c] || 0).toFixed(2)}</span>
            {/* Number label near the left inside the pill with round black border */}
            <span
              style={{
                position: 'absolute',
                left: 8,
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid #000',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                color: '#000',
                fontWeight: 400,
                fontSize: 14,
                background: 'transparent'
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
