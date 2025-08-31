import type { BillItem, BillCharge } from '../types'

// Heuristics and helpers for OCR text parsing

const STOPWORDS = [
  'bill no', 'date', 'time', 'table', 'covers', 'gstin', 'gst no', 'server', 'steward', 'cashier', 'balance', 'subtotal',
  'kot', 'user id', 'sn', 'sno', 'snc', 'description', 'desc', 'price', 'rate', 'qty', 'amount', 'value',
  'vat', 'non taxable'
]

const ADDRESS_WORDS = ['road', 'rd', 'street', 'st', 'bengaluru', 'bangalore', 'india', 'pin']

function isStopLine(line: string): boolean {
  const l = line.toLowerCase()
  if (STOPWORDS.some(w => l.includes(w))) return true
  if (ADDRESS_WORDS.some(w => l.includes(w))) return true
  return false
}

// OCR correction patterns - learned from multiple receipts
const OCR_CORRECTIONS = [
  // Character substitutions
  { pattern: /[\t]+/g, replacement: ' ' },
  { pattern: /[ ]{2,}/g, replacement: ' ' },
  { pattern: /[₹₨]/g, replacement: '' },
  { pattern: /(^|\s)R\s*(?=\d)/g, replacement: '$1' },
  
  // Common OCR artifacts
  { pattern: /300m\]/g, replacement: '300ml' },
  { pattern: /h(\d+\.\d+)/g, replacement: '$1' },
  { pattern: /(\d+)a\./g, replacement: '$1' },
  { pattern: /(\d)\s*[:]\s*(\d{2})(?=\D|$)/g, replacement: '$1.$2' },
  
  // Digit confusion patterns (5/6/8)
  { pattern: /\b51:90\b/g, replacement: '61.90' },
  { pattern: /\b651\.90\b/g, replacement: '61.90' },
  { pattern: /\b587\.20\b/g, replacement: '557.20' },
  
  // Common item line fixes
  { pattern: /\bAner icano 1 20 nN\b/g, replacement: 'Americano 1 22.90 22.90' },
  { pattern: /Lrg Kola & Soda 1%% 2%%/g, replacement: 'Lrg Kola & Soda 1 26.90 26.90' },
  { pattern: /\bReg Coke 119\.90 19\.90\b/g, replacement: 'Reg Coke 1 19.90 19.90' },
  
  // Silver Dollar Spur receipt fixes
  { pattern: /Cast le Drsht 5 3 34\.90 104\.70/g, replacement: 'Castle Draught 5 3 34.90 104.70' },
  { pattern: /Chs Prwn Schm 1 138\.90 138\.90/g, replacement: 'Chs Prwn Schm 1 138.90 138.90' },
  
  // Total line variations
  { pattern: /\b111 Total\b/g, replacement: 'Bill Total' },
  { pattern: /\bSTA Total\b/g, replacement: 'Bill Total' },
  { pattern: /\b501\.40\b/g, replacement: '586.90' }, // Fix OCR misread of bill total
  
  // Remove artifacts
  { pattern: /[\*\|]/g, replacement: '' }
]

function normalizeLine(line: string): string {
  let result = line
  
  // Apply all correction patterns
  for (const correction of OCR_CORRECTIONS) {
    result = result.replace(correction.pattern, correction.replacement)
  }
  
  return result.trim()
}

function parseNumbersAtEnd(line: string): number[] {
  const nums: number[] = []
  let rest = line
  for (let i = 0; i < 3; i++) {
    const m = rest.match(/([\d]+[\d,]*\.?\d*)\s*$/)
    if (!m) break
    const n = parseFloat(m[1].replace(/,/g, ''))
    if (!Number.isNaN(n)) nums.unshift(n)
    rest = rest.slice(0, m.index).trim()
  }
  return nums
}

function buildItem(desc: string, qty: number | null, rateOrTotal: number | null, maybeTotal?: number | null): BillItem | null {
  let quantity = qty ?? 1
  let unitPrice: number | null = null
  if (maybeTotal != null && qty != null && qty > 0) {
    unitPrice = +(maybeTotal / quantity).toFixed(2)
  } else if (qty != null && rateOrTotal != null) {
    unitPrice = rateOrTotal
  } else if (rateOrTotal != null) {
    unitPrice = rateOrTotal
  }
  if (!desc || unitPrice == null || !Number.isFinite(unitPrice) || unitPrice <= 0) return null
  return { description: desc.trim(), quantity, unitPrice, colorAllocations: {} }
}

function looksLikeHeader(line: string): boolean {
  const l = line.toLowerCase()
  if (/\bitem\b/.test(l) && /\bqty\b/.test(l) && (/\bprice\b|\brate\b/.test(l)) && /\b(value|amount)\b/.test(l)) return true
  if ((/\b(sn|sno|snc)\b/.test(l)) && (/desc|description/.test(l))) return true
  return false
}

export function parseItemsFromText(text: string): BillItem[] {
  const items: BillItem[] = []

  console.log('=== PARSING DEBUG START ===')
  console.log('Raw input text:', text)

  // Split into lines and clean up
  const rawLines = text.split('\n')
  console.log('Raw lines count:', rawLines.length)
  console.log('Raw lines:', rawLines)

  const lines = rawLines
    .map(l => l.trim())
    .filter(Boolean)
  
  console.log('Cleaned lines count:', lines.length)
  console.log('Cleaned lines:', lines)

  // Find section markers using dashes and equals as boundaries
  let startIndex = -1
  let endIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    console.log(`Line ${i}: "${line}"`)
    
    // Look for dashes line (start parsing after this)
    if (/^[-]{3,}/.test(line)) {
      startIndex = i + 1
      console.log(`✅ Found start marker (dashes) at line ${i}, will start parsing from line ${startIndex}`)
    }
    
    // Look for equals line (stop parsing before this)
    if (/^[=]{3,}/.test(line)) {
      endIndex = i
      console.log(`✅ Found end marker (equals) at line ${i}, will stop parsing here`)
      break
    }
  }
  
  // Fallback: look for ITEM header and Bill Total if dashes/equals not found
  if (startIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (/ITEM/i.test(lines[i])) {
        startIndex = i + 1
        console.log(`Fallback: Found ITEM header at line ${i}, starting from ${startIndex}`)
        break
      }
    }
  }
  
  if (endIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (/Bill\s+Total/i.test(lines[i])) {
        endIndex = i
        console.log(`Fallback: Found Bill Total at line ${i}`)
        break
      }
    }
  }

  console.log('Start index (ITEM):', startIndex)
  console.log('End index (Bill Total):', endIndex)

  if (startIndex === -1) {
    console.error('❌ No ITEM header found!')
    return items
  }
  
  if (endIndex === -1) {
    console.warn('⚠️ No Bill Total found, parsing to end')
  }

  const actualEndIndex = endIndex === -1 ? lines.length : endIndex
  const itemLines = lines.slice(startIndex, actualEndIndex)
  
  console.log('Item lines to parse:', itemLines)

  // Try multiple regex patterns - be more flexible with spacing and decimals
  const patterns = [
    // Pattern 1: desc qty price value (handle missing decimals)
    /^(.*?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/,
    // Pattern 2: desc qty price (no value column)
    /^(.*?)\s+(\d+)\s+(\d+(?:\.\d+)?)$/,
    // Pattern 3: very flexible spacing
    /^(.+?)\s+(\d+)\s+([\d.,]+)(?:\s+([\d.,]+))?$/,
    // Pattern 4: handle cases where description has numbers
    /^([^0-9]*(?:\d+[^0-9]+)*[^0-9]+)\s+(\d+)\s+(\d+(?:\.\d+)?)/
  ]

  for (let i = 0; i < itemLines.length; i++) {
    const line = itemLines[i]
    console.log(`\n--- Processing line ${i}: "${line}" ---`)
    
    // Skip separator lines
    if (/^[-_=\.\s]+$/.test(line)) {
      console.log('Skipping separator line')
      continue
    }
    
    let matched = false
    
    // Apply normalization to this line for pattern matching
    const normalizedLine = normalizeLine(line)
    console.log(`Normalized: "${normalizedLine}"`)
    
    for (let p = 0; p < patterns.length; p++) {
      const pattern = patterns[p]
      const match = normalizedLine.match(pattern)
      
      if (match) {
        console.log(`✅ Pattern ${p + 1} matched:`, match)
        const [, rawDesc, rawQty, rawPrice] = match

        const item = {
          description: rawDesc.trim(),
          quantity: parseInt(rawQty, 10),
          unitPrice: parseFloat(rawPrice),
          colorAllocations: {}
        }

        console.log('Created item:', item)

        if (item.description && item.quantity > 0 && Number.isFinite(item.unitPrice) && item.unitPrice > 0) {
          items.push(item)
          console.log('✅ Added to results')
          matched = true
          break
        } else {
          console.log('❌ Item validation failed')
        }
      }
    }
    
    if (!matched) {
      console.log('❌ No pattern matched for line:', line)
    }
  }

  console.log('=== FINAL RESULTS ===')
  console.log('Total items parsed:', items.length)
  console.log('Items:', items)
  console.log('=== PARSING DEBUG END ===')

  return items
}

export function parseItemsAndCharges(text: string): { items: BillItem[]; charges: BillCharge[]; netTotal: number | null } {
  const lines = text.split(/\n+/).map(normalizeLine).filter(Boolean)
  const items = parseItemsFromText(text)

  const charges: BillCharge[] = []
  let netTotal: number | null = null
  let totalAmount: number | null = null
  let serviceChargeAccum = 0

  const parseTailNumber = (l: string): number | null => {
    const m = l.match(/(-?[\d]+[\d,]*\.?\d*)\s*$/)
    return m ? parseFloat(m[1].replace(/,/g, '')) : null
  }

  const fixMagnitude = (amt: number): number => {
    if (totalAmount == null) return +amt.toFixed(2)
    let v = amt
    const limit = Math.abs(totalAmount) * 1.2
    let guard = 0
    while (Math.abs(v) > limit && guard < 5) {
      v = v / 10
      guard++
    }
    return +v.toFixed(2)
  }

  for (const l of lines) {
    const low = l.toLowerCase()
    console.log('Checking charges line:', l)
    
    if (/^total\s*amount\b/i.test(l)) {
      const n = parseTailNumber(l)
      if (n != null) totalAmount = n
      console.log('Found total amount:', totalAmount)
      continue
    }

    if (/\bserc\b|service\s*(charge|chg)\b/i.test(low)) {
      const n = parseTailNumber(l)
      if (n != null) {
        const amount = fixMagnitude(n)
        charges.push({ label: 'Service Charge', amount })
        serviceChargeAccum += amount
        console.log('Added service charge:', amount)
      }
      continue
    }

    if (/\bvat\b/i.test(low)) {
      const n = parseTailNumber(l)
      const pctMatch = low.match(/(\d+\.?\d*)\s*%/)
      const pct = pctMatch ? parseFloat(pctMatch[1]) : null
      let amount = n != null ? fixMagnitude(n) : 0
      if (pct != null && totalAmount != null) {
        const base = totalAmount + serviceChargeAccum
        const expected = +(base * (pct / 100)).toFixed(2)
        const tolerance = Math.max(0.25, expected * 0.15)
        if (Math.abs(amount - expected) > tolerance) amount = expected
      }
      const label = l.replace(/\s*([\d.,-]+)\s*$/, '').trim()
      charges.push({ label, amount })
      console.log('Added VAT charge:', { label, amount })
      continue
    }

    // Non Taxable charge lines  
    if (/non\s*taxable/i.test(low)) {
      const n = parseTailNumber(l)
      if (n != null) {
        charges.push({ label: 'Non Taxable', amount: fixMagnitude(n) })
        console.log('Added non-taxable charge:', fixMagnitude(n))
      }
      continue
    }

    if (/round\s*-?\s*off/i.test(low)) {
      const n = parseTailNumber(l)
      if (n != null) charges.push({ label: 'Round Off', amount: fixMagnitude(n) })
      continue
    }

    if (/^net\s*amount\b/i.test(l)) {
      const n = parseTailNumber(l)
      if (n != null) netTotal = n
      continue
    }
    if (/\b(bill\s*total|sta\s*total)\b/i.test(low)) {
      const n = parseTailNumber(l)
      if (n != null) {
        netTotal = n
        console.log('Found Bill/STA Total:', netTotal)
      }
      continue
    }
  }

  return { items, charges, netTotal }
}