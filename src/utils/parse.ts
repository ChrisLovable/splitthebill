import type { BillItem, BillCharge } from '../types'

// Ultra-robust parsing system for heavily corrupted OCR text
interface ParsingPattern {
  name: string
  regex: RegExp
  confidence: number
}

// Patterns that can handle severe OCR corruption
const ITEM_PATTERNS: ParsingPattern[] = [
  {
    name: 'Corrupted QTY PRICE VALUE format',
    regex: /^(.+?)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)$/,
    confidence: 0.95
  },
  {
    name: 'Corrupted QTY PRICE format',
    regex: /^(.+?)\s+(\d+)\s+([\d.,]+)$/,
    confidence: 0.9
  },
  {
    name: 'Very corrupted format with OCR artifacts',
    regex: /^(.+?)\s+(\d+)\s+([\d.,]+)(?:\s+([\d.,]+))?$/,
    confidence: 0.8
  },
  {
    name: 'Extremely flexible - any text with numbers',
    regex: /^(.+?)\s+(\d+)\s+([\d.,]+)$/,
    confidence: 0.6
  }
]

// Section markers that can handle OCR corruption
const SECTION_MARKERS = {
  start: [/^ITEM/i, /^QTY/i, /^PRICE/i, /^VALUE/i, /^[-]{3,}/, /^[=]{3,}/],
  end: [/^BILL\s+TOTAL/i, /^GRAND\s+TOTAL/i, /^[-]{3,}/, /^[=]{3,}/]
}

// Charge patterns
const CHARGE_PATTERNS = [
  { pattern: /\bVAT\b/i, label: 'VAT' },
  { pattern: /\bSERVICE\s+CHARGE\b/i, label: 'Service Charge' },
  { pattern: /\bTAX\b/i, label: 'Tax' }
]

function normalizeText(text: string): string {
  return text
    .replace(/[\t]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/[₹₨R]/g, '') // Remove currency symbols
    .replace(/(\d)\s*[:]\s*(\d{2})(?=\D|$)/g, '$1.$2') // Fix OCR colon-as-decimal
    .replace(/[nN]\s*[nN]/g, '') // Remove OCR artifacts like "nN"
    .replace(/[%]{2,}/g, '') // Remove multiple % symbols
    .trim()
}

function extractNumbers(line: string): number[] {
  const matches = line.match(/[\d,]+\.?\d*/g) || []
  return matches.map(m => parseFloat(m.replace(/,/g, ''))).filter(n => !isNaN(n))
}

// Also extract positions for smarter column inference
function extractNumberTokens(line: string): Array<{ value: number; start: number; end: number }> {
  const tokens: Array<{ value: number; start: number; end: number }> = []
  const regex = /[\d,]+\.?\d*/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(line)) !== null) {
    const raw = m[0]
    const value = parseFloat(raw.replace(/,/g, ''))
    if (!Number.isNaN(value)) tokens.push({ value, start: m.index, end: m.index + raw.length })
  }
  return tokens
}

// Infer a sensible quantity from OCR context
function inferQuantity(rawQuantity: number, numbersInLine: number[], unitPrice: number): number {
  const lastNumber = numbersInLine[numbersInLine.length - 1]
  const secondLastNumber = numbersInLine.length >= 2 ? numbersInLine[numbersInLine.length - 2] : NaN
  const tolerance = 0.011

  // If the number just before the price equals the price, it's almost certainly a duplicated value column → qty = 1
  if (Number.isFinite(secondLastNumber) && Math.abs(secondLastNumber - lastNumber) < tolerance) {
    return 1
  }

  // Quantities are integers, small (typically 1-20). If not, default to 1
  if (!Number.isInteger(rawQuantity) || rawQuantity <= 0 || rawQuantity > 20) {
    return 1
  }

  return rawQuantity
}

function findSectionBoundaries(lines: string[]): { start: number; end: number } {
  let start = -1
  let end = lines.length

  // Find start boundary
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').toString().toLowerCase()
    if (SECTION_MARKERS.start.some(pattern => pattern.test(line))) {
      start = i + 1
      break
    }
  }

  // Find end boundary – start might be -1; in that case, search from 0 safely
  const fromIndex = start >= 0 ? start : 0
  for (let i = fromIndex; i < lines.length; i++) {
    const line = (lines[i] ?? '').toString().toLowerCase()
    if (SECTION_MARKERS.end.some(pattern => pattern.test(line))) {
      end = i
      break
    }
  }

  return { start, end }
}

function cleanItemDescription(desc: string): string {
  return desc
    .replace(/[nN]\s*[nN]/g, '') // Remove "nN" artifacts
    .replace(/[%]{2,}/g, '') // Remove multiple % symbols
    .trim()
}

// Try to intelligently deduce qty/price/value using token positions and arithmetic relationships
function deduceItemFromTokens(line: string, tokens: Array<{ value: number; start: number; end: number }>): BillItem | null {
  if (tokens.length === 0) return null

  // Prefer last numbers as price/value candidates
  const last = tokens[tokens.length - 1]
  const prev = tokens.length >= 2 ? tokens[tokens.length - 2] : undefined
  const prev2 = tokens.length >= 3 ? tokens[tokens.length - 3] : undefined

  const candidates: Array<{ qty: number; unitPrice: number; desc: string; score: number }> = []
  const pushCandidate = (qty: number, unitPrice: number, used: number) => {
    if (!(unitPrice > 0 && qty > 0 && Number.isFinite(unitPrice) && Number.isFinite(qty))) return
    let desc = line
    for (let i = 0; i < used; i++) {
      const t = tokens[tokens.length - 1 - i]
      desc = desc.slice(0, t.start).trim()
    }
    candidates.push({ qty, unitPrice: +unitPrice.toFixed(2), desc: cleanItemDescription(desc), score: 0 })
  }

  // Hypothesis A: qty is integer small, price then value
  if (prev2 && prev) {
    const maybeQty = Math.round(prev2.value)
    const price = prev.value
    const value = last.value
    const tolerance = Math.max(0.05, price * maybeQty * 0.02)
    if (Number.isInteger(maybeQty) && maybeQty > 0 && maybeQty <= 20 && Math.abs(maybeQty * price - value) <= tolerance) {
      pushCandidate(maybeQty, price, 3)
    }
  }

  // Hypothesis B: duplicate price=value -> qty 1
  if (prev && Math.abs(prev.value - last.value) < 0.01) {
    pushCandidate(1, last.value, 2)
  }

  // Hypothesis C: line has two numbers → qty, price
  if (prev && !prev2) {
    const maybeQty = Math.round(prev.value)
    if (Number.isInteger(maybeQty) && maybeQty > 0 && maybeQty <= 20) {
      pushCandidate(maybeQty, last.value, 2)
    } else {
      // more likely price only → qty 1
      pushCandidate(1, last.value, 1)
    }
  }

  // Hypothesis D: single number → unit price with qty 1
  if (!prev) {
    pushCandidate(1, last.value, 1)
  }

  if (candidates.length === 0) return null

  // Score candidates: prefer integer qty in [1..10], shorter desc, higher confidence relationships
  for (const c of candidates) {
    let score = 0
    if (c.qty === 1) score += 1
    if (c.qty >= 1 && c.qty <= 10) score += 1
    // penalize very short descriptions
    if ((c.desc || '').length >= 3) score += 1
    c.score = score
  }
  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]
  if (!best) return null
  return { description: best.desc, quantity: best.qty, unitPrice: best.unitPrice, colorAllocations: {} }
}

function parseItemLine(line: string): BillItem | null {
  const normalizedLine = normalizeText(line)
  
  if (/^[-_=\.\s]+$/.test(normalizedLine)) return null
  if (/total/i.test(normalizedLine.toLowerCase())) return null
  
  const numbersInLine = extractNumbers(normalizedLine)
  const tokens = extractNumberTokens(normalizedLine)

  // Try regex-based fast paths first
  for (const pattern of ITEM_PATTERNS) {
    const match = normalizedLine.match(pattern.regex)
    if (match) {
      const [, description, qtyStr, priceStr] = match
      const parsedQty = parseInt(qtyStr, 10)
      const unitPrice = parseFloat(priceStr.replace(/,/g, ''))
      const quantity = inferQuantity(parsedQty, numbersInLine, unitPrice)
      if (description && quantity > 0 && unitPrice > 0 && !isNaN(unitPrice)) {
        return {
          description: cleanItemDescription(description),
          quantity,
          unitPrice,
          colorAllocations: {}
        }
      }
    }
  }

  // Intelligent deduction using token positions/relationships
  const deduced = deduceItemFromTokens(normalizedLine, tokens)
  if (deduced) return deduced

  return null
}

function parseCharges(lines: string[]): BillCharge[] {
  const charges: BillCharge[] = []
  
  for (const line of lines) {
    const normalizedLine = normalizeText(line)
    const lowerLine = normalizedLine.toLowerCase()
    
    // Check for charge patterns
    for (const chargePattern of CHARGE_PATTERNS) {
      if (chargePattern.pattern.test(lowerLine)) {
        const numbers = extractNumbers(normalizedLine)
        if (numbers.length > 0) {
          charges.push({
            label: chargePattern.label,
            amount: numbers[numbers.length - 1]
          })
          break
        }
      }
    }
  }
  
  return charges
}

function findNetTotal(lines: string[]): number | null {
  for (const line of lines) {
    const normalizedLine = normalizeText(line)
    const lowerLine = normalizedLine.toLowerCase()
    
    if (/bill\s+total/i.test(lowerLine) || /grand\s+total/i.test(lowerLine) || /net\s+amount/i.test(lowerLine)) {
      const numbers = extractNumbers(normalizedLine)
      if (numbers.length > 0) {
        return numbers[numbers.length - 1]
      }
    }
  }
  
  return null
}

export function parseItemsFromText(text: string): BillItem[] {
  console.log('=== ULTRA-ROBUST PARSING START ===')
  console.log('Input text:', text.substring(0, 200) + '...')
  
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  console.log('Total lines:', lines.length)
  console.log('Raw lines:', lines)
  
  const { start, end } = findSectionBoundaries(lines)
  console.log('Section boundaries:', { start, end })
  
  if (start === -1) {
    console.log('No section boundaries found, trying to parse all lines')
    return parseAllLines(lines)
  }
  
  const itemLines = lines.slice(start, end)
  console.log('Item lines to parse:', itemLines)
  
  const items: BillItem[] = []
  
  for (const line of itemLines) {
    const item = parseItemLine(line)
    if (item) {
      items.push(item)
      console.log('✅ Parsed item:', item)
    } else {
      console.log('❌ Could not parse line:', line)
    }
  }
  
  console.log('=== PARSING RESULTS ===')
  console.log('Total items parsed:', items.length)
  console.log('Items:', items)
  
  return items
}

function parseAllLines(lines: string[]): BillItem[] {
  const items: BillItem[] = []
  
  for (const line of lines) {
    const item = parseItemLine(line)
    if (item) {
      items.push(item)
    }
  }
  
  return items
}

export function parseItemsAndCharges(text: string): { items: BillItem[]; charges: BillCharge[]; netTotal: number | null } {
  console.log('=== COMPREHENSIVE PARSING START ===')
  
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  console.log('Total lines:', lines.length)
  console.log('Lines:', lines)
  
  const items = parseItemsFromText(text)
  const charges = parseCharges(lines)
  const netTotal = findNetTotal(lines)
  
  console.log('=== FINAL RESULTS ===')
  console.log('Items:', items)
  console.log('Charges:', charges)
  console.log('Net Total:', netTotal)
  
  return { items, charges, netTotal }
}

// Test helpers intentionally omitted from production logic