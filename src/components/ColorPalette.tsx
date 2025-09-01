import Card from './Card'

// Custom animation styles
const animationStyles = `
  @keyframes activeButtonPulse {
    0% { 
      transform: scale(1.02) translateY(0px);
      filter: brightness(1) saturate(1);
      text-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.6);
    }
    25% { 
      transform: scale(1.05) translateY(-2px);
      filter: brightness(1.2) saturate(1.3);
      text-shadow: 0 0 12px rgba(255,255,255,1), 0 0 24px rgba(255,255,255,0.8);
    }
    50% { 
      transform: scale(1.08) translateY(-4px);
      filter: brightness(1.4) saturate(1.5);
      text-shadow: 0 0 16px rgba(255,255,255,1), 0 0 32px rgba(255,255,255,0.9);
    }
    75% { 
      transform: scale(1.05) translateY(-2px);
      filter: brightness(1.2) saturate(1.3);
      text-shadow: 0 0 12px rgba(255,255,255,1), 0 0 24px rgba(255,255,255,0.8);
    }
    100% { 
      transform: scale(1.02) translateY(0px);
      filter: brightness(1) saturate(1);
      text-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.6);
    }
  }
  
  @keyframes badgeBounce {
    0%, 100% { transform: scale(1.1) rotate(0deg); }
    25% { transform: scale(1.2) rotate(-5deg); }
    50% { transform: scale(1.3) rotate(0deg); }
    75% { transform: scale(1.2) rotate(5deg); }
  }
`

type Props = {
  colors: string[]
  activeColor: string | null
  totals: Record<string, number>
  onSelect: (c: string) => void
  onAdd: () => void
}



export default function ColorPalette({ colors, activeColor, totals, onSelect }: Props) {
  return (
    <>
      {/* Inject custom animations */}
      <style>{animationStyles}</style>
      {/* Oval color total pills with allocation functionality */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, padding: '8px 12px' }}>
        {colors.map((c, i) => (
          <div
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
              border: activeColor === c ? '4px solid #ffffff' : '2px solid rgba(0,0,0,0.3)',
              borderRadius: 20,
              boxShadow: activeColor === c 
                ? `0 0 20px ${c}FF, 0 0 40px ${c}CC, 0 0 60px ${c}99, inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.4)`
                : 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)',
              animation: activeColor === c ? 'activeButtonPulse 3s ease-in-out infinite' : 'none',
              transform: activeColor === c ? 'scale(1.02)' : 'scale(1)',
              transition: activeColor === c ? 'none' : 'all 0.2s ease',
              zIndex: 1,
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log(`[ColorPalette] CLICK EVENT FIRED for color ${c} (index ${i})`)
              console.log(`[ColorPalette] Event target:`, e.target)
              console.log(`[ColorPalette] Current active: ${activeColor}`)
              console.log(`[ColorPalette] Available colors:`, colors)
              onSelect(c)
              console.log(`[ColorPalette] Called onSelect with:`, c)
            }}
          >
            <span style={{ 
              fontWeight: 800, 
              color: '#ffffff', 
              textAlign: 'right', 
              width: '100%', 
              pointerEvents: 'none',
              animation: activeColor === c ? 'none' : 'none',
              textShadow: activeColor === c ? '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.6)' : 'none'
            }}>R{(totals[c] || 0).toFixed(2)}</span>
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
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                animation: activeColor === c ? 'badgeBounce 1.5s ease-in-out infinite' : 'none',
                transform: activeColor === c ? 'scale(1.1)' : 'scale(1)',
                transition: activeColor === c ? 'none' : 'transform 0.2s ease'
              }}
            >
              {(i + 1).toString()}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
