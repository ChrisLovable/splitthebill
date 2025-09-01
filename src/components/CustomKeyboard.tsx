import React, { useState } from 'react'

type Props = {
  isOpen: boolean
  currentValue: string
  onClose: () => void
  onConfirm: (value: string) => void
  placeholder?: string
}

export default function CustomKeyboard({ isOpen, currentValue, onClose, onConfirm, placeholder = "Enter text" }: Props) {
  const [display, setDisplay] = useState(currentValue)

  // Update display when keyboard opens with new value
  React.useEffect(() => {
    if (isOpen) {
      setDisplay(currentValue)
    }
  }, [isOpen, currentValue])

  if (!isOpen) return null

  const handleKey = (key: string) => {
    if (key === 'SPACE') {
      setDisplay(prev => prev + ' ')
    } else if (key === 'BACKSPACE') {
      setDisplay(prev => prev.slice(0, -1))
    } else if (key === 'CLEAR') {
      setDisplay('')
    } else {
      setDisplay(prev => prev + key)
    }
  }

  const handleConfirm = () => {
    onConfirm(display)
    onClose()
  }

  const keyStyle: React.CSSProperties = {
    padding: '12px 8px',
    border: '2px solid #000',
    borderStyle: 'outset',
    background: 'linear-gradient(145deg, #f0f0f0, #d0d0d0)',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6)',
    transition: 'all 0.1s ease',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const actionKeyStyle: React.CSSProperties = {
    ...keyStyle,
    background: 'linear-gradient(145deg, #4a90e2, #357abd)',
    color: '#fff',
    fontSize: '14px'
  }

  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #e8e8e8, #d0d0d0)',
        borderRadius: '16px',
        padding: '20px',
        border: '4px solid #000',
        borderStyle: 'outset',
        boxShadow: '0 12px 24px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.4)',
        width: '95%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Display */}
        <div style={{
          background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          border: '3px solid #000',
          borderStyle: 'inset',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          color: '#000',
          minHeight: '50px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          wordWrap: 'break-word'
        }}>
          {display || placeholder}
        </div>

        {/* Keyboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${row.length}, 1fr)`, 
              gap: '6px',
              justifyContent: 'center'
            }}>
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  style={keyStyle}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(1px)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25), inset 0 1px 2px rgba(0,0,0,0.2)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6)'
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}

          {/* Action row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px', marginTop: '8px' }}>
            <button onClick={() => handleKey('SPACE')} style={keyStyle}>SPACE</button>
            <button onClick={() => handleKey('BACKSPACE')} style={actionKeyStyle}>⌫</button>
            <button onClick={() => handleKey('CLEAR')} style={actionKeyStyle}>CLR</button>
          </div>

          {/* Bottom action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={onClose}
              style={{
                ...actionKeyStyle,
                background: 'linear-gradient(145deg, #666, #555)',
                fontSize: '16px',
                padding: '16px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              style={{
                ...actionKeyStyle,
                background: 'linear-gradient(145deg, #00cc66, #00aa55)',
                fontSize: '16px',
                padding: '16px'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
