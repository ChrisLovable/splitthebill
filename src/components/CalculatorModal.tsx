import { useState, useEffect } from 'react'

type Props = {
  isOpen: boolean
  currentValue: number
  onClose: () => void
  onConfirm: (value: number) => void
  remainingAmount?: number
  showOperations?: boolean
  confirmLabel?: string
  compact?: boolean
}

export default function CalculatorModal({ isOpen, currentValue, onClose, onConfirm, remainingAmount = 0, showOperations = true, confirmLabel = 'Add tip', compact = false }: Props) {
  const [display, setDisplay] = useState(currentValue > 0 ? currentValue.toFixed(2) : '0')
  const [hasDecimal, setHasDecimal] = useState(currentValue > 0 ? true : false)
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForValue, setWaitingForValue] = useState(false)

  // Reset display when modal opens with new value
  useEffect(() => {
    if (isOpen) {
      const initialValue = currentValue > 0 ? currentValue.toFixed(2) : '0'
      setDisplay(initialValue)
      setHasDecimal(initialValue.includes('.'))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForValue(false)
    }
  }, [isOpen, currentValue])

  if (!isOpen) return null

  const handleNumber = (num: string) => {
    if (waitingForValue || display === '0') {
      setDisplay(num)
      setWaitingForValue(false)
    } else {
      setDisplay(prev => prev + num)
    }
  }

  const handleDecimal = () => {
    if (waitingForValue) {
      setDisplay('0.')
      setHasDecimal(true)
      setWaitingForValue(false)
    } else if (!hasDecimal && !display.includes('.')) {
      setDisplay(prev => prev + '.')
      setHasDecimal(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setHasDecimal(false)
    setPreviousValue(null)
    setOperation(null)
    setWaitingForValue(false)
  }



  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+': return prev + current
      case '-': return prev - current
      case '×': return prev * current
      case '÷': return current !== 0 ? prev / current : prev
      default: return current
    }
  }

  const handleOperation = (op: string) => {
    const current = parseFloat(display) || 0
    
    if (previousValue !== null && operation && !waitingForValue) {
      const result = calculate(previousValue, current, operation)
      setDisplay(result.toString())
      setPreviousValue(result)
    } else {
      setPreviousValue(current)
    }
    
    setOperation(op)
    setWaitingForValue(true)
    setHasDecimal(false)
  }

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display) || 0
      const result = calculate(previousValue, current, operation)
      setDisplay(result.toString())
      setPreviousValue(null)
      setOperation(null)
      setWaitingForValue(false)
      setHasDecimal(result.toString().includes('.'))
    }
  }

  const handlePercentage = (percentage: number) => {
    const tipAmount = (remainingAmount * percentage) / 100
    setDisplay(tipAmount.toFixed(2))
    setHasDecimal(true)
    setPreviousValue(null)
    setOperation(null)
    setWaitingForValue(false)
  }

  const handleConfirm = () => {
    const value = parseFloat(display) || 0
    console.log('Calculator confirming tip amount:', value)
    onConfirm(value)
    onClose()
  }

  const buttonStyle: React.CSSProperties = {
    width: compact ? '40px' : '45px',
    height: compact ? '40px' : '45px',
    border: '2px solid #000',
    borderStyle: 'outset',
    background: 'linear-gradient(145deg, #B8E0F0, #8FC8E8)',
    color: '#000',
    fontSize: compact ? '16px' : '18px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.6), inset 0 -1px 3px rgba(0,0,0,0.2)',
    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
    transition: 'all 0.1s ease'
  }

  const actionButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(145deg, #0080FF, #0066DD)',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    fontSize: '14px',
    width: compact ? '80px' : buttonStyle.width
  }

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(145deg, #0080FF, #0066DD)',
    color: '#fff',
    fontSize: '16px', // Reduced font size for Cancel
    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
  }

  const operationButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(145deg, #FF8800, #E67300)',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    fontSize: '20px'
  }

  const equalsButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(145deg, #00CC66, #00AA55)',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    fontSize: '20px'
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #888888, #666666)',
        borderRadius: '16px',
        padding: compact ? '12px' : '16px',
        border: '3px solid #000',
        borderStyle: 'outset',
        boxShadow: '0 8px 16px rgba(0,0,0,0.5), inset 0 1px 4px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.1)',
        width: compact ? '240px' : '300px',
        boxSizing: 'border-box'
      }}>
        {/* Display */}
        <div style={{
          background: 'linear-gradient(145deg, #000000, #1a1a1a)',
          color: '#00FF00',
          padding: compact ? '10px' : '16px',
          fontSize: compact ? '26px' : '32px',
          fontWeight: 'bold',
          fontFamily: "'Digital-7', 'DS-Digital','Digital-7 Mono','Segment7Standard','Orbitron','VT323','Share Tech Mono','Courier New',monospace",
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '1px',
          textAlign: 'right',
          borderRadius: '12px',
          marginBottom: compact ? '12px' : '20px',
          border: '3px solid #333',
          borderStyle: 'inset',
          boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,255,255,0.1)',
          textShadow: '0 0 8px #00FF00, 0 0 12px #00FF00'
        }}>
{display}
        </div>

        {showOperations && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', maxWidth: '280px', width: '100%' }}>
              <button style={operationButtonStyle} onClick={() => handleOperation('+')}>+</button>
              <button style={operationButtonStyle} onClick={() => handleOperation('-')}>-</button>
              <button style={operationButtonStyle} onClick={() => handleOperation('×')}>×</button>
              <button style={operationButtonStyle} onClick={() => handleOperation('÷')}>÷</button>
              <button style={equalsButtonStyle} onClick={handleEquals}>=</button>
            </div>
          </div>
        )}

        {showOperations && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', maxWidth: '240px', width: '100%' }}>
              <button style={{...operationButtonStyle, fontSize: '10px', background: 'linear-gradient(145deg, #00AA44, #008833)'}} onClick={() => handlePercentage(5)}>5%</button>
              <button style={{...operationButtonStyle, fontSize: '10px', background: 'linear-gradient(145deg, #00AA44, #008833)'}} onClick={() => handlePercentage(10)}>10%</button>
              <button style={{...operationButtonStyle, fontSize: '10px', background: 'linear-gradient(145deg, #00AA44, #008833)'}} onClick={() => handlePercentage(15)}>15%</button>
              <button style={{...operationButtonStyle, fontSize: '10px', background: 'linear-gradient(145deg, #00AA44, #008833)'}} onClick={() => handlePercentage(20)}>20%</button>
            </div>
          </div>
        )}

        {showOperations ? (
          <>
            {/* Standard 3x4 keypad */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', width: '100%' }}>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('7')}>7</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('8')}>8</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('9')}>9</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('4')}>4</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('5')}>5</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('6')}>6</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('1')}>1</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('2')}>2</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('3')}>3</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px', width: '100%' }}>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('0')}>0</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={handleDecimal}>.</button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Compact keypad: 5 numbers per row, dot centered below */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', width: '100%' }}>
                {/* Row 1 */}
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('1')}>1</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('2')}>2</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('3')}>3</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('4')}>4</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('5')}>5</button>
                {/* Row 2 */}
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('6')}>6</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('7')}>7</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('8')}>8</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('9')}>9</button>
                <button style={{...buttonStyle, width: '100%'}} onClick={() => handleNumber('0')}>0</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', width: '100%' }}>
                <div></div>
                <div></div>
                <button style={{...buttonStyle, width: '100%'}} onClick={handleDecimal}>.</button>
                <div></div>
                <div></div>
              </div>
            </div>
          </>
        )}



        {/* Action Buttons - Aligned with Numbers */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', width: '100%' }}>
            <button style={{...cancelButtonStyle, fontSize: '12px', width: '100%' }} onClick={onClose}>Back</button>
            <button style={{...actionButtonStyle, fontSize: '12px', width: '100%' }} onClick={handleClear}>Clear</button>
            <button style={{...actionButtonStyle, fontSize: '12px', width: '100%' }} onClick={handleConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
