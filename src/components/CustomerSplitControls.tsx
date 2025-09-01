type Props = {
  numPersons: number
  setNumPersons: (n: number) => void
  splitEvenly: boolean
  setSplitEvenly: (v: boolean) => void
}

export default function CustomerSplitControls({ numPersons, setNumPersons, splitEvenly, setSplitEvenly }: Props) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 16,
        flexWrap: 'wrap'
      }}>
        <span style={{ 
          color: '#0066FF', 
          fontSize: 18, 
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          Split bill between
        </span>
        
        <div style={{ position: 'relative' }}>
          <select
            value={numPersons}
            onChange={(e) => setNumPersons(parseInt(e.target.value, 10))}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              fontSize: 18,
              fontWeight: 900,
              padding: '10px 28px 10px 12px',
              borderRadius: 20,
              border: '3px solid #000',
              borderStyle: 'outset',
              background: 'linear-gradient(145deg, #f0f0f0, #d0d0d0)',
              color: '#000',
              cursor: 'pointer',
              width: 65,
              textAlign: 'center',
              boxShadow: '0 6px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease',
              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 3px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.6)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <div style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: 12,
            fontWeight: 900,
            color: '#444'
          }}>
            ▼
          </div>
        </div>
        
        <span style={{ 
          color: '#0066FF', 
          fontSize: 18, 
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          people
        </span>
      </div>
      
      <label style={{ color: '#0066FF', fontSize: 17, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input 
          type="checkbox" 
          checked={splitEvenly} 
          onChange={(e) => setSplitEvenly(e.target.checked)}
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid #000',
            borderStyle: 'inset',
            borderRadius: '6px',
            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.5)',
            cursor: 'pointer'
          }}
        />
        <span>Split total food & beverages evenly</span>
      </label>
    </div>
  )
}

