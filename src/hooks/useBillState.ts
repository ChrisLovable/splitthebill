import Tesseract from 'tesseract.js'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { parseItemsAndCharges } from '../utils/parse'
import type { BillItem, BillCharge, TipAllocation } from '../types'
import { DEFAULT_COLORS } from '../types'

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

  // Prompt state for engine failures
  type EngineName = 'tesseract' | 'veryfi' | 'openai' | 'mindee'
  const [enginePrompt, setEnginePrompt] = useState<null | { engine: EngineName; itemsSum: number; billTotal: number | null; nextEngine: EngineName | null }>(null)
  const engineIndexRef = useRef<number>(0)

  // OCR mode and API settings from env
  const ocrMode = (((import.meta as any).env?.VITE_OCR_MODE as string | undefined) || 'auto').toLowerCase()
  const ocrOnly = (((import.meta as any).env?.VITE_OCR_ONLY as string | undefined) || '').toLowerCase()
  const ocrFirst = (((import.meta as any).env?.VITE_OCR_FIRST as string | undefined) || '').toLowerCase() as EngineName | ''
  // Veryfi (hardcoded for testing per request)
  const veryfiClientId = 'vrfNVLAahBk1YnNna8BtubLRTUBjzVJJVhTTvIL'
  const veryfiUsername = 'chrisdevries.personal'
  const veryfiApiKey = 'b21db4e417060b1ff31d3d2c369d8ad6'
  const veryfiEndpoint = '/veryfi/api/v8/partner/documents'
  // OpenAI
  const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY as string | undefined
  const openaiModel = ((import.meta as any).env?.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini'
  const openaiEndpoint = ((import.meta as any).env?.VITE_OPENAI_ENDPOINT as string | undefined) || 'https://api.openai.com/v1/chat/completions'
  // Mindee
  const mindeeKey = (import.meta as any).env?.VITE_MINDEE_API_KEY as string | undefined
  const mindeeModelId = (import.meta as any).env?.VITE_MINDEE_MODEL_ID as string | undefined
  const mindeeOwner = (import.meta as any).env?.VITE_MINDEE_PRODUCT_OWNER as string | undefined
  const mindeeModelName = (import.meta as any).env?.VITE_MINDEE_MODEL_NAME as string | undefined
  const mindeeVersion = ((import.meta as any).env?.VITE_MINDEE_MODEL_VERSION as string | undefined) || 'v1'
  const mindeeEndpointFromEnv = (import.meta as any).env?.VITE_MINDEE_ENDPOINT as string | undefined

  function getMindeeUrl(): string {
    if (mindeeModelId) {
      return `https://api.mindee.net/v1/products/${mindeeModelId}/predict`
    }
    if (mindeeOwner && mindeeModelName) {
      return `https://api.mindee.net/v1/products/${mindeeOwner}/${mindeeModelName}/${mindeeVersion}/predict`
    }
    return ''
  }

  function logMindeeEnvStatus(stage: string, url: string) {
    console.info('[Mindee][env]', stage, {
      hasApiKey: !!mindeeKey,
      modelId: !!mindeeModelId ? 'set' : 'missing',
      owner: !!mindeeOwner ? 'set' : 'missing',
      modelName: !!mindeeModelName ? 'set' : 'missing',
      version: mindeeVersion || 'n/a',
      endpointOverride: !!mindeeEndpointFromEnv ? 'set' : 'none',
      chosenUrl: url || 'none'
    })
    if (!url) {
      console.warn('[Mindee] Missing env vars: need either VITE_MINDEE_MODEL_ID or VITE_MINDEE_PRODUCT_OWNER + VITE_MINDEE_MODEL_NAME')
    }
  }

  // Prefer explicit endpoint override, otherwise computed URL
  const mindeeEndpoint = mindeeEndpointFromEnv || getMindeeUrl()
  logMindeeEnvStatus('init', mindeeEndpoint)

  const enginesOrder: EngineName[] = useMemo(() => {
    const list: EngineName[] = ['veryfi']
    console.log('[OCR] engine order (forced Veryfi test):', list)
    return list
  }, [])

  const evaluateParse = (parsedItems: BillItem[], parsedNet: number | null) => {
    const itemsSum = +(parsedItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0).toFixed(2))
    const hasNet = parsedNet != null && Number.isFinite(parsedNet)
    const tolerance = hasNet ? Math.max(2, (parsedNet as number) * 0.05) : 0
    const ok = hasNet && Math.abs(itemsSum - (parsedNet as number)) <= tolerance
    console.log('[OCR] evaluateParse:', { itemsSum, parsedNet, tolerance, ok })
    return { ok, itemsSum }
  }

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',')
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(parts[1])
    let n = bstr.length
    const u8 = new Uint8Array(n)
    while (n--) u8[n] = bstr.charCodeAt(n)
    return new Blob([u8], { type: mime })
  }

  const callMindee = useCallback(async (imageDataUrl: string) => {
    try {
      const tryUrls: string[] = []
      if (mindeeEndpoint) tryUrls.push(mindeeEndpoint)
      if (!mindeeKey || tryUrls.length === 0) { console.warn('[Mindee] missing envs', { hasKey: !!mindeeKey, tryUrls }); return null }

      const blob = imageDataUrl.startsWith('data:') ? dataUrlToBlob(imageDataUrl) : undefined
      const form = new FormData(); if (blob) form.append('document', blob, 'receipt.jpg')

      for (const url of tryUrls) {
        console.log('[Mindee] attempt ->', url)
        const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Token ${mindeeKey}` }, body: form })
        console.log('[Mindee] status:', res.status)
        const text = await res.text()
        if (!res.ok) { console.error('[Mindee] error body:', text); continue }
        let data: any
        try { data = JSON.parse(text) } catch { console.error('[Mindee] non-JSON body'); return null }
        console.log('[Mindee] raw response:', data)
        const doc = data?.document
        const inference = doc?.inference || data?.inference
        const prediction = inference?.prediction
        let lines = prediction?.line_items || prediction?.items || []
        if (!Array.isArray(lines) || lines.length === 0) {
          const pages = inference?.pages || []
          if (Array.isArray(pages) && pages.length > 0) {
            // Some products return pages[].predictions
            lines = pages.flatMap((p: any) => p?.predictions || [])
          }
        }

        const val = (v: any): any => (v && typeof v === 'object' && 'value' in v) ? v.value : v
        const num = (v: any): number => {
          const x = val(v)
          if (typeof x === 'number') return x
          if (typeof x === 'string') {
            const n = parseFloat(x.replace(/[,R\s]/g, ''))
            return Number.isFinite(n) ? n : 0
          }
          return 0
        }
        const str = (v: any): string => {
          const x = val(v)
          if (typeof x === 'string') return x
          if (typeof x === 'number') return String(x)
          if (v && typeof v === 'object') return v?.content || v?.raw || ''
          return ''
        }

        const mdItems: BillItem[] = Array.isArray(lines) ? lines.map((li: any) => {
          const desc = str(li?.description) || str(li?.product) || str(li?.text) || 'Item'
          const qty = Math.max(1, Math.round(num(li?.quantity ?? li?.qty)))
          const priceField = li?.unit_price ?? li?.price
          const totalField = li?.total
          let up = num(priceField)
          const tot = num(totalField)
          if (up <= 0 && qty > 0 && tot > 0) up = +(tot / qty).toFixed(2)
          return { description: desc.trim(), quantity: qty, unitPrice: +(+up || 0).toFixed(2), colorAllocations: {} }
        }).filter((it: BillItem) => it.unitPrice > 0) : []

        let mdNet: number | null = null
        const predTotal = num(prediction?.total)
        if (predTotal > 0) mdNet = +predTotal.toFixed(2)
        if (mdNet == null || mdNet === 0) {
          const sum = lines.reduce((s: number, li: any) => s + num(li?.total), 0)
          if (sum > 0) mdNet = +sum.toFixed(2)
        }
        if (mdNet == null || mdNet === 0) {
          const computed = mdItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
          if (computed > 0) mdNet = +computed.toFixed(2)
        }

        const mdCharges: BillCharge[] = []
        if (mdItems.length === 0) console.warn('[Mindee] no items parsed, check mapping fields in response')
        return { items: mdItems, charges: mdCharges, netTotal: mdNet }
      }
      return null
    } catch (e) { console.error('[Mindee] exception:', e); return null }
  }, [mindeeKey, mindeeEndpoint])

  const callVeryfi = useCallback(async (imageDataUrl: string) => {
    try {
      console.log('[Veryfi] endpoint:', veryfiEndpoint)
      if (!veryfiClientId || !veryfiUsername || !veryfiApiKey) { console.warn('[Veryfi] missing envs'); return null }
      const base64 = imageDataUrl.startsWith('data:') ? imageDataUrl.split(',')[1] : imageDataUrl
      const body = { file_name: 'receipt.jpg', file_data: base64 }
      const res = await fetch(veryfiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Client-Id': veryfiClientId, 'Authorization': `apikey ${veryfiUsername}:${veryfiApiKey}` }, body: JSON.stringify(body) })
      console.log('[Veryfi] status:', res.status)
      if (!res.ok) { console.error('[Veryfi] error body:', await res.text()); return null }
      const data = await res.json()
      const viItems: BillItem[] = Array.isArray(data?.line_items) ? data.line_items.map((li: any) => { const qty = Math.max(1, Math.round(li?.quantity ?? 1)); const unitPrice = Number.isFinite(li?.price) ? +li.price : (li?.total && qty ? +(li.total / qty) : 0); return { description: String(li?.description || li?.category || 'Item').trim(), quantity: qty, unitPrice: +(+unitPrice).toFixed(2), colorAllocations: {} } }).filter((it: BillItem) => it.unitPrice > 0) : []
      const viCharges: BillCharge[] = []
      const addCharge = (label: string, amount: number | undefined) => { if (amount != null && Number.isFinite(amount) && Math.abs(amount) > 0) viCharges.push({ label, amount: +(+amount).toFixed(2) }) }
      addCharge('Tax', data?.tax); addCharge('Tip', data?.tip); if (data?.discount) viCharges.push({ label: 'Discount', amount: -Math.abs(+data.discount) })
      const viNet: number | null = Number.isFinite(data?.total) ? +(+data.total).toFixed(2) : null
      return { items: viItems, charges: viCharges, netTotal: viNet }
    } catch (err) { console.error('[Veryfi] exception:', err); return null }
  }, [veryfiClientId, veryfiUsername, veryfiApiKey, veryfiEndpoint])

  const callOpenAI = useCallback(async (imageDataUrl: string) => {
    try {
      console.log('[OpenAI] endpoint:', openaiEndpoint)
      if (!openaiKey) { console.warn('[OpenAI] key missing'); return null }
      const body = { model: openaiModel, temperature: 0, messages: [{ role: 'system', content: 'You are a receipt parser. Return pure JSON: { items:[{description, quantity, unitPrice}], charges:[{label, amount}], netTotal } with numbers as decimals.' }, { role: 'user', content: [{ type: 'text', text: 'Parse this receipt image and return JSON only.' }, { type: 'image_url', image_url: { url: imageDataUrl } }] }] }
      const res = await fetch(openaiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` }, body: JSON.stringify(body) })
      console.log('[OpenAI] status:', res.status)
      if (!res.ok) { console.error('[OpenAI] error body:', await res.text()); return null }
      const data = await res.json(); const text = data?.choices?.[0]?.message?.content || ''; if (!text) return null
      let jsonStr = text; const match = text.match(/```json[\s\S]*?```/i) || text.match(/\{[\s\S]*\}/); if (match) jsonStr = match[0].replace(/```json|```/g, '')
      let parsed: any; try { parsed = JSON.parse(jsonStr) } catch { console.error('[OpenAI] JSON parse error from model output'); return null }
      const aiItems: BillItem[] = Array.isArray(parsed?.items) ? parsed.items.map((it: any) => ({ description: String(it?.description || 'Item').trim(), quantity: Math.max(1, Math.round(it?.quantity ?? 1)), unitPrice: +(+it?.unitPrice || 0).toFixed(2), colorAllocations: {} })).filter((it: BillItem) => it.unitPrice > 0) : []
      const aiCharges: BillCharge[] = Array.isArray(parsed?.charges) ? parsed.charges.map((c: any) => ({ label: String(c?.label || 'Charge'), amount: +(+c?.amount || 0).toFixed(2) })) : []
      const aiNet: number | null = parsed?.netTotal != null ? +(+parsed.netTotal).toFixed(2) : null
      return { items: aiItems, charges: aiCharges, netTotal: aiNet }
    } catch (e) { console.error('[OpenAI] exception:', e); return null }
  }, [openaiKey, openaiModel, openaiEndpoint])

  // Do not auto-change charge/tip split preferences when toggling splitEvenly
  useEffect(() => { }, [splitEvenly])

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
      const constraints = { video: { facingMode: 'environment', width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 } } }
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
    if (!videoRef.current) { console.error('Video not available'); return }
    const video = videoRef.current
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) { console.error('Video not ready'); alert('Camera not ready. Please wait a moment and try again.'); return }
    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d'); if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      setBillImage(dataUrl)
      cancelCamera()
    } catch (error) { console.error('Error capturing photo:', error); alert('Failed to capture photo. Please try again.') }
  }

  // Exposed actions for the engine prompt
  const proceedToNextEngine = async () => {
    const nextIdx = engineIndexRef.current + 1
    setEnginePrompt(null)
    if (!billImage) return
    if (nextIdx >= enginesOrder.length) return
    engineIndexRef.current = nextIdx
    await runCurrentEngine(billImage)
  }
  const cancelEngines = () => { setEnginePrompt(null); setOcrProgress(0) }

  const runCurrentEngine = async (image: string) => {
    const engine = enginesOrder[engineIndexRef.current]
    if (engine === 'veryfi') {
      setOcrProgress(10)
      const vi = await callVeryfi(image)
      if (!vi) { setEnginePrompt({ engine, itemsSum: 0, billTotal: 0, nextEngine: enginesOrder[engineIndexRef.current + 1] || null }); return }
      const { ok, itemsSum } = evaluateParse(vi.items, vi.netTotal)
      if (ok) { setItems(vi.items); setCharges(vi.charges); setNetTotal(vi.netTotal); setBillText(''); setOcrProgress(100); if (vi.netTotal) setTimeout(() => setShowBillTotalPopup(true), 500) }
      else { setEnginePrompt({ engine, itemsSum, billTotal: vi.netTotal, nextEngine: enginesOrder[engineIndexRef.current + 1] || null }) }
      return
    }
    if (engine === 'openai') {
      setOcrProgress(10)
      const ai = await callOpenAI(image)
      if (!ai) { setEnginePrompt({ engine, itemsSum: 0, billTotal: 0, nextEngine: enginesOrder[engineIndexRef.current + 1] || null }); return }
      const { ok, itemsSum } = evaluateParse(ai.items, ai.netTotal)
      if (ok) { setItems(ai.items); setCharges(ai.charges); setNetTotal(ai.netTotal); setBillText(''); setOcrProgress(100); if (ai.netTotal) setTimeout(() => setShowBillTotalPopup(true), 500) }
      else { setEnginePrompt({ engine, itemsSum, billTotal: ai.netTotal, nextEngine: enginesOrder[engineIndexRef.current + 1] || null }) }
      return
    }
    if (engine === 'mindee') {
      setOcrProgress(10)
      const md = await callMindee(image)
      if (!md) { setEnginePrompt({ engine, itemsSum: 0, billTotal: 0, nextEngine: enginesOrder[engineIndexRef.current + 1] || null }); return }
      const { ok, itemsSum } = evaluateParse(md.items, md.netTotal)
      if (ok) { setItems(md.items); setCharges(md.charges); setNetTotal(md.netTotal); setBillText(''); setOcrProgress(100); if (md.netTotal) setTimeout(() => setShowBillTotalPopup(true), 500) }
      else { setEnginePrompt({ engine, itemsSum, billTotal: md.netTotal, nextEngine: enginesOrder[engineIndexRef.current + 1] || null }) }
      return
    }
    // Tesseract path
    setOcrProgress(0)
    const { data } = await Tesseract.recognize(image, 'eng', { logger: (m) => { if (m.status === 'recognizing text' && m.progress != null) setOcrProgress(Math.round(m.progress * 100)) } })
    setBillText(data.text)
    const { items: parsedItems, charges: parsedCharges, netTotal: parsedNet } = parseItemsAndCharges(data.text)
    const { ok, itemsSum } = evaluateParse(parsedItems, parsedNet)
    if (ok) { setItems(parsedItems); setCharges(parsedCharges); setNetTotal(parsedNet); setOcrProgress(100); if (parsedNet) setTimeout(() => setShowBillTotalPopup(true), 500) }
    else { setEnginePrompt({ engine, itemsSum, billTotal: parsedNet, nextEngine: enginesOrder[engineIndexRef.current + 1] || null }) }
  }

  const runOCR = async (force?: boolean) => {
    if (!billImage) { return }
    if (!force && ocrImageRef.current === billImage) { return }
    ocrImageRef.current = billImage
    setEnginePrompt(null)
    engineIndexRef.current = 0
    setBillText('')
    setOcrProgress(0)
    if (force) { setTipAllocations({}); setTipInput(0) }
    try { await runCurrentEngine(billImage) } catch (error) { console.error('OCR Error:', error); setOcrProgress(0) }
  }

  const addColor = () => { const randomHex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`; setUserColors(prev => [...prev, randomHex]); setActiveColor(randomHex) }

  const allocateOne = (index: number) => {
    if (activeColor == null) return
    hasUserEditsRef.current = true
    setItems(prev => {
      const newItems = [...prev]; const item = { ...newItems[index] }
      if (item.quantity <= 0) return prev
      if (!item.colorAllocations) item.colorAllocations = {}
      item.quantity = item.quantity - 1
      item.colorAllocations = { ...item.colorAllocations, [activeColor]: (item.colorAllocations[activeColor] || 0) + 1 }
      newItems[index] = item
      return newItems
    })
  }

  // Override: click on a colored allocation label to move one unit to active color
  const overrideAllocation = (index: number, fromColor: string) => {
    if (!activeColor) return
    if (activeColor === fromColor) return
    hasUserEditsRef.current = true
    setItems(prev => prev.map((it, i) => {
      if (i !== index) return it
      const current = (it.colorAllocations || {})[fromColor] || 0
      if (current <= 0) return it
      const nextAlloc = { ...(it.colorAllocations || {}) }
      nextAlloc[fromColor] = current - 1
      if (nextAlloc[fromColor] === 0) delete nextAlloc[fromColor]
      nextAlloc[activeColor] = (nextAlloc[activeColor] || 0) + 1
      return { ...it, colorAllocations: nextAlloc }
    }))
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

  const incrementTip = (amount: number) => { if (!activeColor) return; hasUserEditsRef.current = true; setTipAllocations(prev => ({ ...prev, [activeColor]: +(((prev[activeColor] || 0) + amount).toFixed(2)) })) }

  const changeChargesTotal = (nextTotal: number) => {
    setCharges(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      const currentTotal = safePrev.reduce((s, c) => s + c.amount, 0)
      const targetTotal = Math.max(0, +(+nextTotal).toFixed(2))
      if (safePrev.length === 0) return [{ label: 'Service Charge', amount: targetTotal }]
      const delta = +(targetTotal - currentTotal).toFixed(2)
      if (Math.abs(delta) < 0.0001) return safePrev
      const idx = safePrev.findIndex(c => /service\s*charge|chg/i.test(c.label))
      if (idx >= 0) { const updated = [...safePrev]; updated[idx] = { ...updated[idx], amount: +((updated[idx].amount + delta)).toFixed(2) }; return updated }
      if (safePrev.length > 0) { const updated = [...safePrev]; const last = updated[updated.length - 1]; updated[updated.length - 1] = { ...last, amount: +((last.amount + delta)).toFixed(2) }; return updated }
      return safePrev
    })
  }

  const changeItemPrice = (index: number, unitPrice: number) => { setItems(prev => prev.map((it, i) => i === index ? { ...it, unitPrice: +unitPrice } : it)) }

  const changeItemOriginalQuantity = (index: number, originalQuantity: number) => {
    setItems(prev => prev.map((it, i) => { if (i !== index) return it; const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0); const nextRemaining = Math.max(0, Math.floor(originalQuantity) - allocatedQty); return { ...it, quantity: nextRemaining } }))
  }

  const undoAllocations = () => { hasUserEditsRef.current = true; setItems(prev => prev.map(it => { const allocatedQty = Object.values(it.colorAllocations || {}).reduce((a, b) => a + b, 0); const originalQty = it.quantity + allocatedQty; return { ...it, quantity: originalQty, colorAllocations: {} } })); setTipAllocations({}) }

  const addEmptyItem = () => {
    setItems(prev => [
      ...prev,
      { description: '', unitPrice: 0, quantity: 1, colorAllocations: {} }
    ])
  }

  const changeItemDescription = (index: number, description: string) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, description } : it))
  }

  const deleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const totalsByColor = useMemo(() => {
    const totals: Record<string, number> = {}
    const visibleColors = userColors.slice(0, Math.max(1, numPersons))
    for (const color of visibleColors) totals[color] = 0
    for (const it of items) { for (const [color, qty] of Object.entries(it.colorAllocations || {})) { if (visibleColors.includes(color)) totals[color] = +(((totals[color] || 0) + qty * it.unitPrice).toFixed(2)) } }
    const isService = (label: string) => /service\s*(charge|chg)|\bserc\b/i.test(label)
    const serviceChargeTotal = charges.filter(c => isService(c.label)).reduce((s, c) => s + c.amount, 0)
    if (serviceChargeTotal !== 0) {
      if (splitChargesEvenly && visibleColors.length > 0) { const per = serviceChargeTotal / visibleColors.length; for (const color of visibleColors) totals[color] = +(((totals[color] || 0) + per).toFixed(2)) }
      else if (selectedChargeColor && visibleColors.includes(selectedChargeColor)) { totals[selectedChargeColor] = +(((totals[selectedChargeColor] || 0) + serviceChargeTotal).toFixed(2)) }
    }
    for (const [color, tip] of Object.entries(tipAllocations)) { if (visibleColors.includes(color)) totals[color] = +(((totals[color] || 0) + tip).toFixed(2)) }
    if (tipInput && tipInput > 0) {
      if (splitTipEvenly && visibleColors.length > 0) { const per = tipInput / visibleColors.length; for (const color of visibleColors) totals[color] = +(((totals[color] || 0) + per).toFixed(2)) }
      else if (!splitTipEvenly && selectedTipColor && visibleColors.includes(selectedTipColor)) { totals[selectedTipColor] = +(((totals[selectedTipColor] || 0) + tipInput).toFixed(2)) }
    }
    if (splitEvenly && visibleColors.length > 0) { let remainingAmount = 0; for (const item of items) remainingAmount += item.quantity * item.unitPrice; if (remainingAmount > 0) { const per = remainingAmount / visibleColors.length; for (const color of visibleColors) totals[color] = +(((totals[color] || 0) + per).toFixed(2)) } }
    return totals
  }, [items, tipAllocations, userColors, numPersons, splitChargesEvenly, charges, selectedChargeColor, tipInput, splitTipEvenly, selectedTipColor, splitEvenly])

  const subtotal = useMemo(() => { if (netTotal != null && netTotal > 0) return netTotal; return Object.values(items).reduce((sum, it) => { const allocated = Object.values(it.colorAllocations).reduce((a, b) => a + b, 0); return sum + allocated * it.unitPrice }, 0) }, [items, netTotal])
  const tipTotal = useMemo(() => Object.values(tipAllocations).reduce((a, b) => a + b, 0), [tipAllocations])
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

  const handleFileSelect = (file: File) => { const reader = new FileReader(); reader.onload = (e) => { const dataUrl = e.target?.result as string; if (dataUrl) setBillImage(dataUrl) }; reader.readAsDataURL(file) }

  const resetAll = () => { setBillImage(null); setBillText(''); setItems([]); setTipAllocations({}); setUserColors(DEFAULT_COLORS); setActiveColor(DEFAULT_COLORS[0]) }

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
    overrideAllocation,
    deallocateOne,
    incrementTip,
    changeChargesTotal,
    changeItemPrice,
    changeItemOriginalQuantity,
    undoAllocations,
    addEmptyItem,
    changeItemDescription,
    deleteItem,
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
    enginePrompt,
    proceedToNextEngine,
    cancelEngines,
  }
}
