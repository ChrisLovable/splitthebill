type Props = {
  numPersons: number
  setNumPersons: (n: number) => void
  splitEvenly: boolean
  setSplitEvenly: (v: boolean) => void
}

export default function CustomerSplitControls({ numPersons, setNumPersons, splitEvenly, setSplitEvenly }: Props) {
  return (
    <div style={{ padding: '8px 16px' }}>
      <label style={{ color: '#0066FF', fontSize: 18, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span>Split bill between</span>
        <select
          value={numPersons}
          onChange={(e) => setNumPersons(parseInt(e.target.value, 10))}
          style={{ fontSize: 23, fontWeight: 700, padding: '4px 10px', lineHeight: 1.2 }}
        >
          {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      
      <label style={{ color: '#0066FF', fontSize: 17, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <input 
          type="checkbox" 
          checked={splitEvenly} 
          onChange={(e) => setSplitEvenly(e.target.checked)}
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
        <span>Split bill evenly</span>
      </label>
    </div>
  )
}

