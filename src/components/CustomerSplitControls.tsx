import { useState } from 'react'

type Props = {
  numPersons: number
  setNumPersons: (n: number) => void
  splitEvenly: boolean
  setSplitEvenly: (v: boolean) => void
}

export default function CustomerSplitControls({ numPersons, setNumPersons, splitEvenly, setSplitEvenly }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const buttonStyle: React.CSSProperties = {
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
    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
    position: 'relative'
  }

  const optionStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 900,
    textAlign: 'center',
    border: '2px solid #000',
    borderStyle: 'outset',
    background: 'linear-gradient(145deg, #ffffff, #e0e0e0)',
    color: '#000',
    textShadow: '0 1px 2px rgba(255,255,255,0.9)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.9), inset 0 -1px 2px rgba(0,0,0,0.2)',
    margin: '1px 0',
    borderRadius: 8
  }

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
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={buttonStyle}
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
            {numPersons}
          </button>
          
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

          {/* Custom dropdown menu */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'linear-gradient(145deg, #f8f8f8, #e8e8e8)',
              border: '3px solid #000',
              borderStyle: 'outset',
              borderRadius: 12,
              boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
              maxHeight: 200,
              overflowY: 'auto',
              marginTop: 4
            }}>
              {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                <div
                  key={n}
                  onClick={() => {
                    setNumPersons(n)
                    setIsOpen(false)
                  }}
                  style={{
                    ...optionStyle,
                    ...(n === numPersons ? {
                      background: 'linear-gradient(145deg, #0066FF, #0052CC)',
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    } : {})
                  }}
                  onMouseEnter={(e) => {
                    if (n !== numPersons) {
                      e.currentTarget.style.background = 'linear-gradient(145deg, #e6f3ff, #cce7ff)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (n !== numPersons) {
                      e.currentTarget.style.background = 'linear-gradient(145deg, #ffffff, #e0e0e0)'
                    }
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          )}
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

      {/* Click outside to close dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

