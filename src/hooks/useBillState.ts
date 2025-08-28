import { useEffect, useMemo, useRef, useState } from 'react'
import Tesseract from 'tesseract.js'
import type { BillItem, TipAllocation, BillCharge } from '../types'
import { DEFAULT_COLORS } from '../types'
import { parseItemsAndCharges } from '../utils/parse'

export function useBillState() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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

  // When split evenly is enabled, ensure charges and tip are set to split evenly
  useEffect(() => {
    if (splitEvenly) {
      setSplitChargesEvenly(true)
      setSplitTipEvenly(true)
      setSelectedChargeColor(null)
      setSelectedTipColor(null)
    }
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



  const runOCR = async () => {
    if (!billImage) return
    setBillText('')
    setOcrProgress(0)
    setTipAllocations({})
    const { data } = await Tesseract.recognize(billImage, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && m.progress != null) {
          setOcrProgress(Math.round(m.progress * 100))
        }
      }
    })
    setBillText(data.text)
    const { items: parsedItems, charges: parsedCharges, netTotal: parsedNet } = parseItemsAndCharges(data.text)
    setItems(parsedItems)
    setCharges(parsedCharges)
    setNetTotal(parsedNet)
  }

  const addColor = () => {
    const randomHex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`
    setUserColors(prev => [...prev, randomHex])
    setActiveColor(randomHex)
  }

  const allocateOne = (index: number) => {
    if (activeColor == null) return
    
    setItems(prev => {
      const newItems = [...prev]
      const item = { ...newItems[index] }
      
      // Ensure colorAllocations exists
      if (!item.colorAllocations) {
        item.colorAllocations = {}
      }
      
      const currentAllocations = { ...item.colorAllocations }
      const totalAllocated = Object.values(currentAllocations).reduce((sum, qty) => sum + qty, 0)
      const originalQuantity = item.quantity + totalAllocated
      
      // Simply allocate the entire original quantity to the active color
      item.quantity = 0
      item.colorAllocations = { [activeColor]: originalQuantity }
      
      newItems[index] = item
      return newItems
    })
  }

  const deallocateOne = (index: number, color: string) => {
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
    setTipAllocations(prev => ({ ...prev, [activeColor]: +(((prev[activeColor] || 0) + amount).toFixed(2)) }))
  }

  const totalsByColor = useMemo(() => {
    const totals: Record<string, number> = {}
    const visibleColors = userColors.slice(0, Math.max(1, numPersons))
    for (const color of visibleColors) totals[color] = 0

    // Normal allocation logic - start with what's already allocated
    for (const it of items) {
      for (const [color, qty] of Object.entries(it.colorAllocations || {})) {
        if (visibleColors.includes(color)) {
          totals[color] = +(((totals[color] || 0) + qty * it.unitPrice).toFixed(2))
        }
      }
    }
    
    const totalCharges = charges.reduce((s, c) => s + c.amount, 0)
    if (totalCharges !== 0) {
      if (splitChargesEvenly && visibleColors.length > 0) {
        const per = totalCharges / visibleColors.length
        for (const color of visibleColors) {
          totals[color] = +(((totals[color] || 0) + per).toFixed(2))
        }
      } else if (selectedChargeColor && visibleColors.includes(selectedChargeColor)) {
        totals[selectedChargeColor] = +(((totals[selectedChargeColor] || 0) + totalCharges).toFixed(2))
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
    if (splitEvenly && visibleColors.length > 0) {
      // Calculate remaining unallocated amount
      let remainingAmount = 0
      
      // Unallocated items
      for (const item of items) {
        const unallocatedQty = item.quantity
        remainingAmount += unallocatedQty * item.unitPrice
      }
      
      // Unallocated charges
      if (totalCharges > 0 && !splitChargesEvenly && !selectedChargeColor) {
        remainingAmount += totalCharges
      }
      
      // Unallocated tip
      if (tipInput > 0 && !splitTipEvenly && !selectedTipColor) {
        remainingAmount += tipInput
      }
      
      // Split the remaining amount evenly among all visible colors
      if (remainingAmount > 0) {
        const remainingPerPerson = remainingAmount / visibleColors.length
        for (const color of visibleColors) {
          totals[color] = +(((totals[color] || 0) + remainingPerPerson).toFixed(2))
        }
      }
    }

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
    resetAll,
  }
}
