import { useEffect, useMemo, useRef, useState } from 'react'
import Tesseract from 'tesseract.js'
import { parseItemsAndCharges } from '../utils/parse'

import type { BillItem, TipAllocation, BillCharge } from '../types'
import { DEFAULT_COLORS } from '../types'


// OpenAI GPT-4 Vision API for intelligent receipt parsing
async function runOpenAIReceiptParser(base64Image: string): Promise<{ items: BillItem[], charges: BillCharge[], netTotal: number | null }> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Add VITE_OPENAI_API_KEY to your .env file')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Parse this restaurant receipt with PERFECT accuracy. Return ONLY valid JSON without any markdown formatting.

Expected JSON structure:
{
  "items": [
    {"description": "Item name", "quantity": 1, "unitPrice": 12.34}
  ],
  "charges": [
    {"label": "Service Charge", "amount": 5.67}
  ],
  "netTotal": 123.45
}

CRITICAL ACCURACY RULES:
- Extract ALL food/drink items with their EXACT quantities and unit prices
- The receipt shows QTY, PRICE, and VALUE columns - use these EXACTLY
- unitPrice should be the PRICE column value
- quantity should be the QTY column value  
- Verify: (quantity × unitPrice) = VALUE column for each item
- The sum of all item VALUES must equal the bill total
- Include VAT, taxes, service charges in "charges" array
- netTotal should be the final "Bill Total" from the receipt
- Use South African Rand amounts but return as numbers only
- Be EXTREMELY precise - this is financial data that must balance exactly
- Double-check your math: items total + charges = netTotal
- If you see a discrepancy, re-examine the receipt carefully
- Return ONLY the JSON object, no markdown, no explanations`
          },
          {
            type: 'image_url',
            image_url: {
              url: base64Image
            }
          }
        ]
      }],
      max_tokens: 1000,
      temperature: 0.1
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    // Clean the response - remove markdown formatting
    let cleanContent = content.trim()
    
    // Remove ```json and ``` markers if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.substring(7)
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.substring(3)
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.substring(0, cleanContent.length - 3)
    }
    
    cleanContent = cleanContent.trim()
    
    console.log('Cleaned OpenAI response:', cleanContent)
    
    const parsed = JSON.parse(cleanContent)
    
    // Convert to our format
    const items: BillItem[] = parsed.items?.map((item: any) => ({
      description: String(item.description || ''),
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      unitPrice: parseFloat(item.unitPrice) || 0,
      colorAllocations: {}
    })) || []

    const charges: BillCharge[] = parsed.charges?.map((charge: any) => ({
      label: String(charge.label || ''),
      amount: parseFloat(charge.amount) || 0
    })) || []

    const netTotal = parsed.netTotal ? parseFloat(parsed.netTotal) : null

    // Validate and fix any math discrepancies
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const chargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0)
    const calculatedTotal = itemsTotal + chargesTotal
    
    console.log('=== AI PARSING VALIDATION ===')
    console.log('Items total:', itemsTotal)
    console.log('Charges total:', chargesTotal)
    console.log('Calculated total:', calculatedTotal)
    console.log('AI reported total:', netTotal)
    
    // If there's a significant discrepancy, try to fix it
    if (netTotal && Math.abs(calculatedTotal - netTotal) > 0.01) {
      console.log('⚠️ Math mismatch detected! Attempting to fix...')
      
      // Try to find items with wrong prices by checking if any item's value matches the difference
      const difference = netTotal - calculatedTotal
      console.log('Difference to resolve:', difference)
      
      // Look for items that might have wrong prices
      items.forEach(item => {
        const itemValue = item.quantity * item.unitPrice
        // If this item's value is close to the difference, it might be the culprit
        if (Math.abs(itemValue - Math.abs(difference)) < 5) {
          console.log(`Potential price issue with ${item.description}: current value ${itemValue}, difference ${difference}`)
        }
      })
      
      // Try to automatically fix common parsing errors
      if (Math.abs(difference) > 0.01) {
        console.log('🔧 Attempting automatic price correction...')
        
        // Strategy 1: Look for items with quantities > 1 that might have wrong unit prices
        const itemsWithQuantities = items.filter(item => item.quantity > 1)
        if (itemsWithQuantities.length > 0) {
          console.log('🔍 Found items with quantities > 1, checking for price errors...')
          
          // Try adjusting the unit price of the first item with quantity > 1
          const firstMultiItem = itemsWithQuantities[0]
          const currentValue = firstMultiItem.quantity * firstMultiItem.unitPrice
          const targetValue = currentValue - difference
          const correctedUnitPrice = targetValue / firstMultiItem.quantity
          
          if (correctedUnitPrice > 0 && correctedUnitPrice < 1000) {
            console.log(`✅ Auto-correcting ${firstMultiItem.description}: unit price ${firstMultiItem.unitPrice} → ${correctedUnitPrice.toFixed(2)}`)
            firstMultiItem.unitPrice = correctedUnitPrice
            
            // Recalculate totals to verify the fix
            const newItemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
            const newCalculatedTotal = newItemsTotal + chargesTotal
            console.log(`✅ After correction: items total ${newItemsTotal}, calculated total ${newCalculatedTotal}, target ${netTotal}`)
            
            if (Math.abs(newCalculatedTotal - netTotal) < 0.01) {
              console.log('🎯 Auto-correction successful!')
            }
          }
        }
        
        // Strategy 2: Look for items that might have wrong quantities
        items.forEach(item => {
          const itemValue = item.quantity * item.unitPrice
          if (Math.abs(itemValue - Math.abs(difference)) < 5) {
            console.log(`🔍 Potential quantity issue with ${item.description}: current value ${itemValue}, difference ${difference}`)
          }
        })
        
        // Strategy 3: Check if any item has a completely wrong unit price
        console.log('🔍 Checking for completely wrong unit prices...')
        items.forEach(item => {
          const itemValue = item.quantity * item.unitPrice
          // If an item's value is close to the difference, it might be the culprit
          if (Math.abs(itemValue - Math.abs(difference)) < 10) {
            console.log(`⚠️ Suspicious item: ${item.description} - value ${itemValue}, difference ${difference}`)
            console.log(`   Current: ${item.quantity} × ${item.unitPrice} = ${itemValue}`)
          }
        })
      }
      
      console.log('Returning original parsed data - manual review recommended')
    }

    return { items, charges, netTotal }
  } catch (error) {
    console.error('Raw OpenAI response:', content)
    console.error('Cleaning attempt failed:', error)
    throw new Error(`Failed to parse OpenAI response: ${error}`)
  }
}

export function useBillState() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ocrImageRef = useRef<string | null>(null)
  const hasUserEditsRef = useRef<boolean>(false)

  const [billImage, setBillImage] = useState<string | null>(() => localStorage.getItem('billImage') || null)
  const [billText, setBillText] = useState<string>(() => localStorage.getItem('billText') || '')
  const [items, setItems] = useState<BillItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('items') || '[]') } catch { return [] }
  })
  const [tipAllocations, setTipAllocations] = useState<TipAllocation>(() => {
    try { return JSON.parse(localStorage.getItem('tipAllocations') || '{}') } catch { return {} }
  })
  const [userColors, setUserColors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('userColors') || 'null') || DEFAULT_COLORS } catch { return DEFAULT_COLORS }
  })
  const [activeColor, setActiveColor] = useState<string | null>(() => localStorage.getItem('activeColor') || DEFAULT_COLORS[0])
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [ocrProgress, setOcrProgress] = useState<number>(0)
  const [charges, setCharges] = useState<BillCharge[]>([])
  const [netTotal, setNetTotal] = useState<number | null>(null)
  const [numPersons, setNumPersons] = useState<number>(5)
  const [splitChargesEvenly, setSplitChargesEvenly] = useState<boolean>(true)
  const [selectedChargeColor, setSelectedChargeColor] = useState<string | null>(null)
  const [tipInput, setTipInput] = useState<number>(0)
  const [splitTipEvenly, setSplitTipEvenly] = useState<boolean>(true)
  const [selectedTipColor, setSelectedTipColor] = useState<string | null>(null)
  const [splitEvenly, setSplitEvenly] = useState<boolean>(false)
  const [showBillTotalPopup, setShowBillTotalPopup] = useState<boolean>(false)


  // Do not auto-change charge/tip split preferences when toggling splitEvenly
  useEffect(() => {
    // intentionally left blank to preserve user selections for tip/service splitting
  }, [splitEvenly])

  useEffect(() => {
    return () => {
      if (videoRef.current && (videoRef.current.srcObject as MediaStream | null)) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setIsCapturing(true)
      
      // Enhanced camera constraints for mobile
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      }
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera not available on this device')
        setIsCapturing(false)
        return
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Camera error:', error)
      alert('Unable to access camera. Please allow camera permissions.')
      setIsCapturing(false)
    }
  }

  const cancelCamera = () => {
    const v = videoRef.current
    if (v && v.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      v.srcObject = null
    }
    setIsCapturing(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) {
      console.error('Video not available')
      return
    }
    
    const video = videoRef.current
    
    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    
    const canvas = canvasRef.current
    
    // Ensure video has loaded and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready')
      alert('Camera not ready. Please wait a moment and try again.')
      return
    }
    
    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        console.error('Cannot get canvas context')
        return
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      setBillImage(dataUrl)
      cancelCamera()
      
      console.log('Photo captured successfully')
    } catch (error) {
      console.error('Error capturing photo:', error)
      alert('Failed to capture photo. Please try again.')
    }
  }



  const runOCR = async (force?: boolean) => {
    console.log('=== HYBRID OCR STARTING ===')
    console.log('billImage exists:', !!billImage)
    if (!billImage) {
      console.log('No billImage, OCR aborted')
      return
    }
    // Check if this is a new image
    const isNewImage = ocrImageRef.current !== billImage
    
    // Prevent re-running OCR for the same image (unless forced)
    if (!force && ocrImageRef.current === billImage) {
      console.log('OCR already performed for this image. Skipping.')
      return
    }
    
    // If this is a new image, reset all state completely
    if (isNewImage) {
      console.log('🆕 New image detected - resetting all state')
      setItems([])
      setCharges([])
      setNetTotal(null)
      setTipAllocations({})
      setTipInput(0)
      setShowBillTotalPopup(false)
      hasUserEditsRef.current = false
    }
    
    ocrImageRef.current = billImage
    
    console.log('🔄 Step 1: Starting Tesseract OCR...')
    setBillText('')
    setOcrProgress(0)
    // For a forced rerun OR new image, reset all state
    if (force || !hasUserEditsRef.current) {
      setTipAllocations({})
      setTipInput(0)
      // Clear any existing allocations when processing new image
      setItems(prev => prev.map(item => ({ ...item, colorAllocations: {} })))
    }
    
    try {
      // Step 1: Use Tesseract OCR first (faster, cheaper)
      setOcrProgress(20)
      console.log('Running Tesseract OCR...')
      
      const { data } = await Tesseract.recognize(billImage, 'eng', {
        logger: (m) => {
          console.log('Tesseract logger:', m)
          if (m.status === 'recognizing text' && m.progress != null) {
            const progress = Math.round(m.progress * 50) // Tesseract gets first 50%
            setOcrProgress(20 + progress)
          }
        }
      })
      
      const tesseractText = data.text
      console.log('Tesseract completed! Text length:', tesseractText.length)
      console.log('Tesseract text preview:', tesseractText.substring(0, 200))
      
      setBillText(tesseractText)
      setOcrProgress(70)
      
      // Parse Tesseract results
      const { items: tesseractItems, charges: tesseractCharges, netTotal: tesseractNet } = parseItemsAndCharges(tesseractText)
      
      console.log('=== TESSERACT PARSING DEBUG ===')
      console.log('Tesseract items:', tesseractItems)
      console.log('Tesseract charges:', tesseractCharges)
      console.log('Tesseract net total:', tesseractNet)
      
      // Validate Tesseract results
      const itemsTotal = tesseractItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      const chargesTotal = tesseractCharges.reduce((sum, charge) => sum + charge.amount, 0)
      const calculatedTotal = itemsTotal + chargesTotal
      const tesseractDifference = tesseractNet ? Math.abs(tesseractNet - calculatedTotal) : 999
      
      console.log(`Tesseract validation: items ${itemsTotal}, charges ${chargesTotal}, calculated ${calculatedTotal}, bill ${tesseractNet}, difference ${tesseractDifference}`)
      
      // If Tesseract is accurate enough (difference < R5), use it
      if (tesseractDifference < 5 && tesseractItems.length > 0) {
        console.log('✅ Tesseract results are accurate enough! Using Tesseract data.')
        // Always replace items completely for new image
        setItems(tesseractItems)
        setCharges(tesseractCharges)
        setNetTotal(tesseractNet)
        setOcrProgress(100)
        
        if (tesseractNet) {
          setTimeout(() => {
            setShowBillTotalPopup(true)
          }, 800)
        }
        console.log('=== TESSERACT OCR COMPLETED SUCCESSFULLY ===')
        return
      }
      
      // Step 2: Tesseract had issues, fall back to OpenAI
      console.log('⚠️ Tesseract results have issues. Falling back to OpenAI GPT-4 Vision...')
      setOcrProgress(75)
      console.log('Calling OpenAI API...')
      
      const { items: openaiItems, charges: openaiCharges, netTotal: openaiNet } = await runOpenAIReceiptParser(billImage)
      
      setOcrProgress(90)
      console.log('=== OPENAI PARSING DEBUG ===')
      console.log('OpenAI items:', openaiItems)
      console.log('OpenAI charges:', openaiCharges)
      console.log('OpenAI net total:', openaiNet)
      
      // Use OpenAI results
      if (force || !hasUserEditsRef.current) {
        setItems(openaiItems)
        setCharges(openaiCharges)
        setNetTotal(openaiNet)
      } else {
        console.log('User has edits; not overwriting items/charges with OpenAI results')
      }
      
      setOcrProgress(100)
      if (openaiItems.length > 0) {
        console.log('OpenAI parsing completed with', openaiItems.length, 'items')
        console.log('Bill total found:', openaiNet)
        setTimeout(() => {
          setShowBillTotalPopup(true)
        }, 800)
      }
      
      console.log('=== HYBRID OCR COMPLETED (OpenAI fallback) ===')
      
    } catch (error) {
      console.error('OCR Error:', error)
      setOcrProgress(0)
    }
  }

  const addColor = () => {
    const randomHex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`
    setUserColors(prev => [...prev, randomHex])
    setActiveColor(randomHex)
  }

  const allocateOne = (index: number) => {
    if (activeColor == null) return
    
    console.log('=== ALLOCATE ONE DEBUG ===')
    console.log('Allocating 1 quantity from item at index:', index, 'to color:', activeColor)
    hasUserEditsRef.current = true
    
    setItems(prev => {
      console.log('Previous items state:', prev)
      const newItems = [...prev]
      const item = { ...newItems[index] }
      
      console.log('Item before allocation:', item)
      
      // Only allocate if there's remaining quantity
      if (item.quantity <= 0) {
        console.log('No remaining quantity to allocate')
        return prev // Return unchanged state
      }
      
      // Ensure colorAllocations exists
      if (!item.colorAllocations) {
        item.colorAllocations = {}
      }
      
      // Allocate exactly 1 quantity to the active color
      item.quantity = item.quantity - 1
      item.colorAllocations = { 
        ...item.colorAllocations, 
        [activeColor]: (item.colorAllocations[activeColor] || 0) + 1 
      }
      
      console.log('Item after allocation:', item)
      console.log('Allocated 1 to color:', activeColor)
      console.log('Remaining quantity:', item.quantity)
      console.log('Color allocations:', item.colorAllocations)
      
      newItems[index] = item
      console.log('New items state:', newItems)
      console.log('=== END ALLOCATE ONE DEBUG ===')
      return newItems
    })
  }

  const deallocateOne = (index: number, color: string) => {
    hasUserEditsRef.current = true
    setItems(prev => prev.map((it, i) => {
      if (i !== index) return it
      const current = it.colorAllocations[color] || 0
      if (current <= 0) return it
      const nextAlloc = { ...it.colorAllocations, [color]: current - 1 }
      if (nextAlloc[color] === 0) delete nextAlloc[color]
      return { ...it, quantity: it.quantity + 1, colorAllocations: nextAlloc }
    }))
  }

  const incrementTip = (amount: number) => {
    if (!activeColor) return
    hasUserEditsRef.current = true
    setTipAllocations(prev => ({ ...prev, [activeColor]: +(((prev[activeColor] || 0) + amount).toFixed(2)) }))
  }

  const changeChargesTotal = (nextTotal: number) => {
    setCharges(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      const currentTotal = safePrev.reduce((s, c) => s + c.amount, 0)
      const targetTotal = Math.max(0, +(+nextTotal).toFixed(2))

      // If there are no existing charges, set a single Service Charge entry
      if (safePrev.length === 0) return [{ label: 'Service Charge', amount: targetTotal }]

      const delta = +(targetTotal - currentTotal).toFixed(2)
      if (Math.abs(delta) < 0.0001) return safePrev

      // Prefer adjusting an existing Service Charge-like line
      const idx = safePrev.findIndex(c => /service\s*charge|chg/i.test(c.label))
      if (idx >= 0) {
        const updated = [...safePrev]
        updated[idx] = { ...updated[idx], amount: +((updated[idx].amount + delta)).toFixed(2) }
        return updated
      }

      // Otherwise adjust the last entry
      if (safePrev.length > 0) {
        const updated = [...safePrev]
        const last = updated[updated.length - 1]
        updated[updated.length - 1] = { ...last, amount: +((last.amount + delta)).toFixed(2) }
        return updated
      }

      return safePrev
    })
  }

  const changeItemPrice = (index: number, unitPrice: number) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, unitPrice: +unitPrice } : it))
  }

  const changeItemOriginalQuantity = (index: number, originalQuantity: number) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== index) return it
      const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
      const nextRemaining = Math.max(0, Math.floor(originalQuantity) - allocatedQty)
      return { ...it, quantity: nextRemaining }
    }))
  }

  const addNewItem = (description: string, quantity: number, unitPrice: number) => {
    hasUserEditsRef.current = true
    const newItem = {
      description: description.trim(),
      quantity: Math.max(1, Math.floor(quantity)),
      unitPrice: Math.max(0, +unitPrice.toFixed(2)),
      colorAllocations: {}
    }
    setItems(prev => [...prev, newItem])
  }

  const removeItem = (index: number) => {
    hasUserEditsRef.current = true
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const validateAndFixReceipt = () => {
    if (!netTotal) return
    
    console.log('🔍 Validating receipt data...')
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const chargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0)
    const calculatedTotal = itemsTotal + chargesTotal
    const difference = netTotal - calculatedTotal
    
    console.log(`📊 Receipt Validation:`)
    console.log(`   Items total: R${itemsTotal.toFixed(2)}`)
    console.log(`   Charges total: R${chargesTotal.toFixed(2)}`)
    console.log(`   Calculated total: R${calculatedTotal.toFixed(2)}`)
    console.log(`   Bill total: R${netTotal.toFixed(2)}`)
    console.log(`   Difference: R${difference.toFixed(2)}`)
    
    if (Math.abs(difference) > 0.01) {
      console.log('⚠️ Mismatch detected! Attempting to fix...')
      
              // Try to find the item with the wrong price
        items.forEach(item => {
          const itemValue = item.quantity * item.unitPrice
          if (Math.abs(itemValue - Math.abs(difference)) < 10) {
            console.log(`🔍 Potential issue with ${item.description}: value ${itemValue}, difference ${difference}`)
          }
        })
    } else {
      console.log('✅ Receipt data is balanced!')
    }
  }

  const undoAllocations = () => {
    hasUserEditsRef.current = true
    // Reset item allocations back to original quantities and clear color allocations
    setItems(prev => prev.map(it => {
      const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0)
      const originalQty = it.quantity + allocatedQty
      return { ...it, quantity: originalQty, colorAllocations: {} }
    }))
    // Clear manual tip allocations
    setTipAllocations({})
  }

  const totalsByColor = useMemo(() => {
    const totals: Record<string, number> = {}
    const visibleColors = userColors.slice(0, Math.max(1, numPersons))
    for (const color of visibleColors) totals[color] = 0

    console.log('=== ALLOCATION DEBUG ===')
    console.log('Split evenly:', splitEvenly)
    console.log('Split charges evenly:', splitChargesEvenly)  
    console.log('Split tip evenly:', splitTipEvenly)
    console.log('Selected charge color:', selectedChargeColor)
    console.log('Selected tip color:', selectedTipColor)
    console.log('Items being processed:', items.length)

    // Normal allocation logic - start with what's already allocated
    for (const it of items) {
      for (const [color, qty] of Object.entries(it.colorAllocations || {})) {
        if (visibleColors.includes(color)) {
          totals[color] = +(((totals[color] || 0) + qty * it.unitPrice).toFixed(2))
        }
      }
    }
    
    const isService = (label: string) => /service\s*(charge|chg)|\bserc\b/i.test(label)
    const serviceChargeTotal = charges.filter(c => isService(c.label)).reduce((s, c) => s + c.amount, 0)
    if (serviceChargeTotal !== 0) {
      if (splitChargesEvenly && visibleColors.length > 0) {
        const per = serviceChargeTotal / visibleColors.length
        for (const color of visibleColors) {
          totals[color] = +(((totals[color] || 0) + per).toFixed(2))
        }
      } else if (selectedChargeColor && visibleColors.includes(selectedChargeColor)) {
        totals[selectedChargeColor] = +(((totals[selectedChargeColor] || 0) + serviceChargeTotal).toFixed(2))
      }
    }
    
    for (const [color, tip] of Object.entries(tipAllocations)) {
      if (visibleColors.includes(color)) {
        totals[color] = +(((totals[color] || 0) + tip).toFixed(2))
      }
    }
    
    // Distribute tip input
    if (tipInput && tipInput > 0) {
      if (splitTipEvenly && visibleColors.length > 0) {
        const per = tipInput / visibleColors.length
        for (const color of visibleColors) {
          totals[color] = +(((totals[color] || 0) + per).toFixed(2))
        }
      } else if (!splitTipEvenly && selectedTipColor && visibleColors.includes(selectedTipColor)) {
        totals[selectedTipColor] = +(((totals[selectedTipColor] || 0) + tipInput).toFixed(2))
      }
    }

    // If split evenly is enabled, calculate remaining amount and divide it equally
    console.log('Checking splitEvenly logic - splitEvenly:', splitEvenly, 'visibleColors.length:', visibleColors.length)
    if (splitEvenly && visibleColors.length > 0) {
      console.log('SPLIT EVENLY LOGIC IS RUNNING - THIS MIGHT BE THE PROBLEM!')
      // Calculate remaining unallocated amount
      let remainingAmount = 0
      
      // Unallocated items only (since charges and tips are already handled above when splitEvenly is true)
      for (const item of items) {
        const unallocatedQty = item.quantity
        remainingAmount += unallocatedQty * item.unitPrice
        console.log('Item unallocated qty:', unallocatedQty, 'price:', item.unitPrice, 'subtotal:', unallocatedQty * item.unitPrice)
      }
      
      console.log('Total remaining amount to split:', remainingAmount)
      
      // Note: charges and tips are already allocated evenly above due to splitChargesEvenly=true and splitTipEvenly=true
      // So we only need to handle remaining unallocated items
      
      // Split the remaining amount evenly among all visible colors
      if (remainingAmount > 0) {
        const remainingPerPerson = remainingAmount / visibleColors.length
        console.log('Adding', remainingPerPerson, 'to each color due to split evenly')
        for (const color of visibleColors) {
          totals[color] = +(((totals[color] || 0) + remainingPerPerson).toFixed(2))
        }
      }
    } else {
      console.log('Split evenly logic NOT running')
    }

    console.log('Final totals:', totals)
    console.log('=== END ALLOCATION DEBUG ===')

    return totals
  }, [items, tipAllocations, userColors, numPersons, splitChargesEvenly, charges, selectedChargeColor, tipInput, splitTipEvenly, selectedTipColor, splitEvenly])

  const subtotal = useMemo(() => {
    if (netTotal != null && netTotal > 0) return netTotal
    return Object.values(items).reduce((sum, it) => {
      const allocated = Object.values(it.colorAllocations).reduce((a, b) => a + b, 0)
      return sum + allocated * it.unitPrice
    }, 0)
  }, [items, netTotal])

  const tipTotal = useMemo(() => {
    return Object.values(tipAllocations).reduce((a, b) => a + b, 0)
  }, [tipAllocations])

  const grandTotal = useMemo(() => +(subtotal + tipTotal + tipInput).toFixed(2), [subtotal, tipTotal, tipInput])

  useEffect(() => { if (billImage) localStorage.setItem('billImage', billImage) }, [billImage])
  useEffect(() => { localStorage.setItem('billText', billText) }, [billText])
  useEffect(() => { localStorage.setItem('items', JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem('tipAllocations', JSON.stringify(tipAllocations)) }, [tipAllocations])
  useEffect(() => { localStorage.setItem('userColors', JSON.stringify(userColors)) }, [userColors])
  useEffect(() => { if (activeColor) localStorage.setItem('activeColor', activeColor) }, [activeColor])
  useEffect(() => { localStorage.setItem('numPersons', String(numPersons)) }, [numPersons])
  useEffect(() => { localStorage.setItem('splitChargesEvenly', JSON.stringify(splitChargesEvenly)) }, [splitChargesEvenly])
  useEffect(() => { localStorage.setItem('splitTipEvenly', JSON.stringify(splitTipEvenly)) }, [splitTipEvenly])

  const handleFileSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        setBillImage(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const resetAll = () => {
    setBillImage(null)
    setBillText('')
    setItems([])
    setTipAllocations({})
    setUserColors(DEFAULT_COLORS)
    setActiveColor(DEFAULT_COLORS[0])
  }

  return {
    videoRef,
    canvasRef,
    billImage,
    billText,
    items,
    tipAllocations,
    userColors,
    activeColor,
    isCapturing,
    ocrProgress,
    setActiveColor,
    startCamera,
    cancelCamera,
    capturePhoto,
    runOCR,
    addColor,
    allocateOne,
    deallocateOne,
    incrementTip,
    changeChargesTotal,
    changeItemPrice,
    changeItemOriginalQuantity,
    addNewItem,
    removeItem,
    validateAndFixReceipt,
    undoAllocations,
    totalsByColor,
    subtotal,
    tipTotal,
    grandTotal,
    charges,
    netTotal,
    numPersons,
    setNumPersons,
    splitChargesEvenly,
    setSplitChargesEvenly,
    selectedChargeColor,
    setSelectedChargeColor,
    splitTipEvenly,
    setSplitTipEvenly,
    selectedTipColor,
    setSelectedTipColor,
    tipInput,
    setTipInput,
    splitEvenly,
    setSplitEvenly,
    handleFileSelect,
    resetAll,
    showBillTotalPopup,
    setShowBillTotalPopup,
  }
}
