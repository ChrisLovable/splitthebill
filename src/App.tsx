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

const headerImage = "/public/spur.jpg"

function App() {
  const state = useBillState()

  const visibleColors = state.userColors.slice(0, Math.max(1, state.numPersons))

  const pretty = (s: string | null) => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : ''

  return (
    <PhoneFrame>
      {/* Header image */}
      <div style={{ width: '100%', padding: '12px 16px 8px 16px', textAlign: 'center' }}>
        <div 
          style={{ 
            width: '200px', 
            height: '200px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            backgroundColor: '#111827',
            margin: '0 auto',
            border: '6px solid #ef4444',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.35)',
            position: 'relative'
          }}
        >
          {/* Soft halo blur layer (inner) */}
          <div style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)',
            filter: 'blur(10px)',
            zIndex: 0,
            pointerEvents: 'none'
          }} />
          {/* Colored glow layer (outer) */}
          <div style={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(239,68,68,0.45), rgba(239,68,68,0) 70%)',
            filter: 'blur(14px)',
            zIndex: 0,
            pointerEvents: 'none'
          }} />

          <img 
            src={headerImage} 
            alt="Spur" 
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              position: 'relative',
              zIndex: 1
            }}
          />
        </div>
      </div>

      <div className="px-4 pt-2 space-y-2">
        <CameraCapture
          isCapturing={state.isCapturing}
          videoRef={state.videoRef as React.RefObject<HTMLVideoElement>}
          onOpen={state.startCamera}
          onCapture={state.capturePhoto}
          onCancel={state.cancelCamera}
          onFileSelect={state.handleFileSelect}
        />

      </div>

      <ReceiptPreview image={state.billImage} onRunOCR={state.runOCR} ocrProgress={state.ocrProgress} />

      {/* Engine failure modal with continue prompt */}
      {state.enginePrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            maxWidth: 420, width: '92%', borderRadius: 14,
            background: 'linear-gradient(145deg, #111827, #0b1220)', color: '#fff',
            border: '3px solid #ef4444', borderStyle: 'outset', boxShadow: '0 10px 24px rgba(0,0,0,0.6)', padding: 20
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Parsing failed with {pretty(state.enginePrompt.engine)}</div>
            <div style={{ fontSize: 14, opacity: 0.95, whiteSpace: 'pre-line' }}>
              Items total: R{state.enginePrompt.itemsSum.toFixed(2)}{"\n"}
              Bill total: {state.enginePrompt.billTotal != null ? `R${state.enginePrompt.billTotal.toFixed(2)}` : 'not detected'}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={state.cancelEngines} style={{
                padding: '10px 14px', borderRadius: 10, border: '2px solid #000', borderStyle: 'outset',
                background: 'linear-gradient(145deg, #4b5563, #374151)', color: '#fff', fontWeight: 700
              }}>Cancel</button>
              <button onClick={state.proceedToNextEngine} disabled={!state.enginePrompt.nextEngine} style={{
                padding: '10px 14px', borderRadius: 10, border: '2px solid #000', borderStyle: 'outset',
                background: state.enginePrompt.nextEngine ? 'linear-gradient(145deg, #10b981, #059669)' : '#555',
                color: '#fff', fontWeight: 700, cursor: state.enginePrompt.nextEngine ? 'pointer' : 'not-allowed'
              }}>
                {state.enginePrompt.nextEngine ? `Use ${pretty(state.enginePrompt.nextEngine)}` : 'No other engines'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        console.log('Popup render check:')
        console.log('showBillTotalPopup:', state.showBillTotalPopup)
        console.log('netTotal:', state.netTotal)
        console.log('Should show popup:', state.showBillTotalPopup && state.netTotal)
        return state.showBillTotalPopup && state.netTotal
      })() && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            padding: '40px',
            borderRadius: 20,
            background: (() => {
              const itemsTotal = state.items.reduce((sum, it) => {
                const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
                const originalQty = it.quantity + allocatedQty
                return sum + it.unitPrice * originalQty
              }, 0)
              const tolerance = 5 // Allow R5 difference for rounding
                              const matches = Math.abs((state.netTotal || 0) - itemsTotal) <= tolerance
              return matches 
                ? 'linear-gradient(145deg, #059669, #047857)' 
                : 'linear-gradient(145deg, #dc2626, #b91c1c)'
            })(),
            color: '#fff',
            border: '6px solid #000',
            borderStyle: 'outset',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 4px 8px rgba(255,255,255,0.4)',
            textAlign: 'center',
            fontWeight: 'bold',
            width: '90%',
            maxWidth: '400px',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: 28, marginBottom: 20, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              BILL TOTAL = R{(state.netTotal || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 'normal', marginBottom: 24, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
              {(() => {
                const itemsTotal = state.items.reduce((sum, it) => {
                  const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
                  const originalQty = it.quantity + allocatedQty
                  return sum + it.unitPrice * originalQty
                }, 0)
                const tolerance = 5
                const matches = Math.abs((state.netTotal || 0) - itemsTotal) <= tolerance
                return matches 
                  ? `✅ PARSING CONFIRMED!\nBill total matches items total.\nSafe to proceed with allocation.` 
                  : `⚠️ MISMATCH DETECTED!\nItems total: R${itemsTotal.toFixed(2)}\nBill total: R${(state.netTotal || 0).toFixed(2)}\nPlease check the parsing before proceeding.`
              })()}
            </div>
            <button
              onClick={() => state.setShowBillTotalPopup(false)}
              style={{
                padding: '16px 32px',
                borderRadius: 12,
                background: 'linear-gradient(145deg, #374151, #1f2937)',
                color: '#fff',
                border: '3px solid #000',
                borderStyle: 'outset',
                fontWeight: 'bold',
                fontSize: 18,
                cursor: 'pointer',
                boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
                alignSelf: 'center'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <ChargesTable
        charges={state.charges}
        splitChargesEvenly={state.splitChargesEvenly}
        setSplitChargesEvenly={state.setSplitChargesEvenly}
        selectedChargeColor={state.selectedChargeColor}
        setSelectedChargeColor={state.setSelectedChargeColor}
        activeColor={state.activeColor}
        onChangeChargesTotal={state.changeChargesTotal}
      />

      <TipTable
        tipAmount={state.tipInput}
        setTipAmount={state.setTipInput}
        splitTipEvenly={state.splitTipEvenly}
        setSplitTipEvenly={state.setSplitTipEvenly}
        selectedTipColor={state.selectedTipColor}
        setSelectedTipColor={state.setSelectedTipColor}
        activeColor={state.activeColor}
        percentBase={(() => {
          const itemsTotal = state.items.reduce((sum, it) => {
            const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
            const originalQty = it.quantity + allocatedQty
            return sum + originalQty * it.unitPrice
          }, 0)
          // Percentages should be applied to Food & Beverages only
          return +itemsTotal.toFixed(2)
        })()}
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

      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={state.undoAllocations}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: 'linear-gradient(145deg, #4b5563, #374151)',
            color: '#ffffff',
            border: '3px solid #000',
            borderStyle: 'outset',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.35)',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(1px)';
            e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.35), inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -1px 3px rgba(0,0,0,0.35)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.35)';
          }}
        >
          Undo allocations
        </button>
      </div>

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
        onChangePrice={state.changeItemPrice}
        onChangeQuantity={state.changeItemOriginalQuantity}
        onAddRow={state.addEmptyItem}
        onChangeDescription={state.changeItemDescription}
        onDeleteRow={state.deleteItem}
        onOverrideAllocation={state.overrideAllocation}
        disabled={state.splitEvenly}
      />

      {/* Hidden canvas for photo capture */}
      <canvas ref={state.canvasRef} style={{ display: 'none' }}></canvas>
    </PhoneFrame>
  )
}

export default App
