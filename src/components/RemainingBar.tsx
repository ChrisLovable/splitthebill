type Props = {
  subtotal: number
  tipInput: number
  setTipInput: (n: number) => void
  total: number
}

export default function RemainingBar({ subtotal, tipInput, setTipInput, total }: Props) {
  const container: React.CSSProperties = {
    position: 'sticky',
    bottom: 0,
    background: '#0b3942',
    borderTop: '2px solid #082b33',
    padding: 8,
    color: '#fff',
    zIndex: 50
  }
  const cell: React.CSSProperties = {
    flex: 1,
    padding: 8,
    border: '1px solid #0e4a54',
    background: '#103641',
    textAlign: 'center',
    fontSize: 12
  }

  return (
    <div style={container}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={cell}>Remaining: ${subtotal.toFixed(2)}</div>
        <div style={cell}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Tip:
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={isNaN(tipInput) ? '' : tipInput}
              onChange={(e) => setTipInput(parseFloat(e.target.value || '0'))}
              style={{ width: 90 }}
            />
          </label>
        </div>
        <div style={cell}>Total: ${total.toFixed(2)}</div>
      </div>
    </div>
  )
}

