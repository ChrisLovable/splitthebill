import type { BillItem } from '../types'
import type { BillCharge } from '../types'

const STOPWORDS = [
  'bill no', 'date', 'time', 'table', 'covers', 'gst', 'gstin', 'cgst', 'sgst', 'igst', 'tax', 'round off', 'round-off', 'roundoff',
  'total amount', 'total', 'net amount', 'grand total', 'balance', 'kot', 'user id', 'server', 'steward', 'service charge', 'servc', 'serc',
  'rate', 'qty', 'amount', 'snc', 'sno', 'description', 'subtotal', 'plan', 'pvt ltd'
]

const ADDRESS_WORDS = ['layout', 'road', 'rd', 'main', 'cross', 'bengaluru', 'bangalore', 'banashankari', 'siddanna', 'india', 'pin', 'gstin']

function isStopLine(line: string): boolean {
  const l = line.toLowerCase()
  if (STOPWORDS.some(w => l.includes(w))) return true
  // Address-like lines are ignored unless we are inside the items section
  if (ADDRESS_WORDS.some(w => l.includes(w))) return true
  return false
}

function normalizeLine(line: string): string {
  return line
    .replace(/[\t]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/[₹₨]/g, '')
    .trim()
}

function parseNumbersAtEnd(line: string): number[] {
  const nums: number[] = []
  const regex = /([\d]+[\d,]*\.?\d*)\s*$/
  let rest = line
  for (let i = 0; i < 3; i++) {
    const m = rest.match(regex)
    if (!m) break
    const raw = m[1].replace(/,/g, '')
    const n = parseFloat(raw)
    if (!Number.isNaN(n)) nums.unshift(n)
    rest = rest.slice(0, m.index).trim()
  }
  return nums
}

function buildItem(desc: string, qty: number | null, unitOrTotal: number | null, maybeTotal?: number | null): BillItem | null {
  let quantity = qty ?? 1
  let unitPrice: number
  if (maybeTotal != null && qty != null && qty > 0) {
    unitPrice = maybeTotal / quantity
  } else if (qty != null && unitOrTotal != null) {
    unitPrice = unitOrTotal
  } else if (unitOrTotal != null) {
    unitPrice = unitOrTotal
  } else {
    return null
  }
  if (!desc || !Number.isFinite(unitPrice) || unitPrice <= 0) return null
  return { description: desc, quantity, unitPrice, colorAllocations: {} }
}

function looksLikeHeader(line: string): boolean {
  const l = line.toLowerCase()
  return (/\b(sn|sno|snc)\b/.test(l) && /desc|description/.test(l)) || (/description/.test(l) && /qty|rate|amount/.test(l))
}

function looksLikeItemStart(line: string): boolean {
  // e.g., "1 GINGER ALE 3 130.00 390.00"
  if (/^\d+\s+\D+\s+\d+\s+[\d.,]+\s+[\d.,]+$/.test(line)) return true
  // e.g., "1 GINGER ALE 390.00"
  if (/^\d+\s+\D+\s+[\d.,]+$/.test(line)) return true
  return false
}

export function parseItemsFromText(text: string): BillItem[] {
  const rawLines = text.split(/\n+/).map(normalizeLine).filter(Boolean)

  // Determine where items begin
  let startIdx = 0
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i]
    if (looksLikeHeader(l)) { startIdx = i + 1; break }
    if (looksLikeItemStart(l)) { startIdx = i; break }
  }

  // Pre-scan above startIdx lines are treated as non-items (addresses etc)
  const slice = rawLines.slice(startIdx)

  // Join wrapped description lines: if a line has no number and next has numbers at end, merge
  const lines: string[] = []
  for (let i = 0; i < slice.length; i++) {
    const cur = slice[i]
    const next = slice[i + 1]
    const hasNum = /\d/.test(cur)
    const nextHasNumEnd = next ? /[\d]+[\d,]*\.?\d*\s*$/.test(next) : false
    if (!hasNum && nextHasNumEnd && cur.length < 40) {
      lines.push(`${cur} ${next}`)
      i++
    } else {
      lines.push(cur)
    }
  }

  const results: BillItem[] = []
  for (const raw of lines) {
    const line = normalizeLine(raw)
    if (!line) continue

    // Ignore address-like and totals lines
    if (isStopLine(line)) continue

    // Discard lines with very large trailing number (likely invoice/address id / pincode)
    const endNums = parseNumbersAtEnd(line)
    if (endNums.length === 1 && endNums[0] >= 10000 && !/\./.test(String(endNums[0]))) {
      continue
    }

    // Structured: SNo desc qty rate amount
    let m = line.match(/^(\d+)\s+(.+?)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)$/)
    if (m) {
      const [, , desc, qtyStr, rateStr, amtStr] = m
      const qty = parseInt(qtyStr, 10)
      const rate = parseFloat(rateStr.replace(/,/g, ''))
      const amt = parseFloat(amtStr.replace(/,/g, ''))
      const item = buildItem(desc, qty, rate, amt)
      if (item) { results.push(item); continue }
    }

    // Pattern: desc qty amount (no rate column)
    m = line.match(/^(.+?)\s+(\d+)\s+([\d.,]+)$/)
    if (m) {
      const [, desc, qtyStr, amtStr] = m
      const qty = parseInt(qtyStr, 10)
      const amt = parseFloat(amtStr.replace(/,/g, ''))
      const item = buildItem(desc, qty, null, amt)
      if (item) { results.push(item); continue }
    }

    // Pattern: qty x desc - price
    m = line.match(/^(\d+)\s*[xX]?\s+(.+?)[\s-]+\$?([\d.,]+)$/)
    if (m) {
      const [, qtyStr, desc, priceStr] = m
      const qty = parseInt(qtyStr, 10)
      const price = parseFloat(priceStr.replace(/,/g, ''))
      const item = buildItem(desc, qty, price)
      if (item) { results.push(item); continue }
    }

    // Fallback using trailing numbers
    if (endNums.length > 0) {
      const desc = line.replace(/[\d]+[\d,]*\.?\d*(\s+[\d]+[\d,]*\.?\d*)?\s*$/, '').trim().replace(/[-–]+$/, '').trim()
      // Require some alphabetic description and exclude address-y words
      if (/[A-Za-z]/.test(desc) && !ADDRESS_WORDS.some(w => desc.toLowerCase().includes(w))) {
        if (endNums.length === 2) {
          const [rate, total] = endNums
          const maybeQty = Math.round(total / (rate || 1))
          const qty = Number.isFinite(maybeQty) && maybeQty > 0 ? maybeQty : 1
          const item = buildItem(desc, qty, rate, total)
          if (item) { results.push(item); continue }
        } else if (endNums.length === 1) {
          const price = endNums[0]
          if (price > 0 && price < 10000) {
            const item = buildItem(desc, 1, price)
            if (item) { results.push(item); continue }
          }
        }
      }
    }
  }

  // Filter out unitPrice 0 and obvious non-items
  return results.filter(r => Number.isFinite(r.unitPrice) && r.unitPrice > 0)
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
    // Capture 'Total Amount' for heuristics but not as a charge
    if (/^total\s*amount\b/i.test(l)) {
      const n = parseTailNumber(l)
      if (n != null) totalAmount = n
      continue
    }

    // SERC/Service Charge variations
    if (/\bserc\b|service\s*(charge|chg)\b/i.test(low)) {
      const n = parseTailNumber(l)
      if (n != null) {
        const amount = fixMagnitude(n)
        charges.push({ label: 'Service Charge', amount })
        serviceChargeAccum += amount
      }
      continue
    }

    // GST (State/Central or generic), tolerate optional @, %, spaces, and case
    if (/\b(state|central)\s*gst\b|\bgst\b/i.test(low)) {
      const n = parseTailNumber(l)
      // Try to read percent if present
      const pctMatch = low.match(/(\d+\.?\d*)\s*%/)
      const pct = pctMatch ? parseFloat(pctMatch[1]) : null
      let amount = n != null ? fixMagnitude(n) : 0
      if (pct != null && totalAmount != null) {
        const base = totalAmount + serviceChargeAccum
        const expected = +(base * (pct / 100)).toFixed(2)
        const tolerance = Math.max(0.25, expected * 0.15)
        if (Math.abs(amount - expected) > tolerance) {
          amount = expected
        }
      }
      // Preserve the human label without trailing numbers
      const label = l.replace(/\s*([\d.,-]+)\s*$/, '').trim()
      charges.push({ label, amount })
      continue
    }

    // Round Off (allow variations: Roundoff, Round-off)
    if (/round\s*-?\s*off/i.test(low)) {
      const n = parseTailNumber(l)
      if (n != null) charges.push({ label: 'Round Off', amount: fixMagnitude(n) })
      continue
    }

    // Net Amount
    if (/^net\s*amount\b/i.test(l)) {
      const n = parseTailNumber(l)
      if (n != null) netTotal = n
    }
  }

  return { items, charges, netTotal }
}
