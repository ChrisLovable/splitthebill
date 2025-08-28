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

function App() {
  const state = useBillState()

  const visibleColors = state.userColors.slice(0, Math.max(1, state.numPersons))

  return (
    <PhoneFrame>
      {/* Header Image - Small Round Button */}
      <div className="w-full" style={{ textAlign: 'center', padding: '8px 0' }}>
        <button style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.8)',
          overflow: 'hidden',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img 
            src="/atoffice.jpg" 
            alt="At Office" 
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            onError={(e) => {
              console.error('Image failed to load from /atoffice.jpg:', e)
              console.log('Trying alternative path...')
              e.currentTarget.src = './atoffice.jpg'
            }}
            onLoad={() => console.log('Small round image loaded successfully from:', '/atoffice.jpg')}
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
