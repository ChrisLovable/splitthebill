import CameraCapture from './components/CameraCapture'
import ItemsTable from './components/ItemsTable'
import PhoneFrame from './components/PhoneFrame'
import ColorPalette from './components/ColorPalette'
import ReceiptPreview from './components/ReceiptPreview'
import GalleryPicker from './components/GalleryPicker'
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
      {/* Top summary removed per request */}

      <div className="px-4 pt-2 space-y-2">
        <CameraCapture
          isCapturing={state.isCapturing}
          videoRef={state.videoRef as React.RefObject<HTMLVideoElement>}
          onOpen={state.startCamera}
          onCapture={state.capturePhoto}
          onCancel={state.cancelCamera}
        />
        <GalleryPicker onPick={(file) => state.loadImageFromFile(file)} />
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

      {/* Remaining bar removed per request */}
    </PhoneFrame>
  )
}

export default App
