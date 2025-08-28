import CameraCapture from './components/CameraCapture'
import ItemsTable from './components/ItemsTable'
import PhoneFrame from './components/PhoneFrame'
import ColorPalette from './components/ColorPalette'
import ReceiptPreview from './components/ReceiptPreview'

import ChargesTable from './components/ChargesTable'
import TipTable from './components/TipTable'
import CustomerSplitControls from './components/CustomerSplitControls'
import AmountRemaining from './components/AmountRemaining'

import { useBillState } from './hooks/useBillState'

// Try the path you suggested
const atOfficeImage = "/imageatoffice.jpg"

function App() {
  const state = useBillState()

  const visibleColors = state.userColors.slice(0, Math.max(1, state.numPersons))

  return (
    <PhoneFrame>
      {/* Header Image - Round Button */}
      <div style={{ width: '100%', padding: '8px 16px 4px 16px', textAlign: 'center' }}>
        <button 
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            backgroundColor: '#111827',
            margin: '0 auto',
            border: '3px solid #22d3ee',
            cursor: 'pointer',
            padding: 0,
            boxShadow: '0 4px 12px rgba(34, 211, 238, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(34, 211, 238, 0.5)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 211, 238, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 211, 238, 0.3)'
          }}
          onClick={() => {
            console.log('Header image button clicked!')
            // Add any click functionality here
          }}
        >
          <img 
            src={atOfficeImage} 
            alt="At Office Header" 
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(1.1) contrast(1.1) saturate(1.1)',
              borderRadius: '50%'
            }}
            onLoad={(e) => {
              console.log('Image loaded successfully!')
              console.log('Src:', e.currentTarget.src)
            }}
            onError={(e) => {
              console.log('Image failed to load!')
              console.log('Failed src:', e.currentTarget.src)
            }}
          />
        </button>
      </div>

      <div className="px-4 pt-2 space-y-2">
        <CameraCapture
          isCapturing={state.isCapturing}
          videoRef={state.videoRef as React.RefObject<HTMLVideoElement>}
          onOpen={state.startCamera}
          onCapture={state.capturePhoto}
          onCancel={state.cancelCamera}
        />

      </div>

      <ReceiptPreview image={state.billImage} onRunOCR={state.runOCR} ocrProgress={state.ocrProgress} />

      <ChargesTable
        charges={state.charges}
        splitChargesEvenly={state.splitChargesEvenly}
        setSplitChargesEvenly={state.setSplitChargesEvenly}
        colors={visibleColors}
        selectedChargeColor={state.selectedChargeColor}
        setSelectedChargeColor={state.setSelectedChargeColor}
        activeColor={state.activeColor}
      />

      <TipTable
        tipAmount={state.tipInput}
        setTipAmount={state.setTipInput}
        splitTipEvenly={state.splitTipEvenly}
        setSplitTipEvenly={state.setSplitTipEvenly}
        selectedTipColor={state.selectedTipColor}
        setSelectedTipColor={state.setSelectedTipColor}
        activeColor={state.activeColor}
      />

      <CustomerSplitControls 
        numPersons={state.numPersons} 
        setNumPersons={state.setNumPersons}
        splitEvenly={state.splitEvenly}
        setSplitEvenly={state.setSplitEvenly}
      />

      <ColorPalette 
        colors={visibleColors} 
        activeColor={state.activeColor} 
        totals={state.totalsByColor} 
        onSelect={state.setActiveColor} 
        onAdd={state.addColor}
      />

      <AmountRemaining 
        items={state.items}
        charges={state.charges}
        tipInput={state.tipInput}
        tipAllocations={state.tipAllocations}
        splitChargesEvenly={state.splitChargesEvenly}
        selectedChargeColor={state.selectedChargeColor}
        splitTipEvenly={state.splitTipEvenly}
        selectedTipColor={state.selectedTipColor}
        splitEvenly={state.splitEvenly}
      />

      <ItemsTable 
        items={state.items} 
        onAllocate={state.allocateOne} 
        onDeallocate={state.deallocateOne}
        disabled={state.splitEvenly}
      />

      {/* Hidden canvas for photo capture */}
      <canvas ref={state.canvasRef} style={{ display: 'none' }}></canvas>
    </PhoneFrame>
  )
}

export default App
