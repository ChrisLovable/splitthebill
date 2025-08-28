export type BillItem = {
  description: string
  quantity: number
  unitPrice: number
  colorAllocations: Record<string, number>
}

export type TipAllocation = Record<string, number>

export type BillCharge = {
  label: string
  amount: number
}

export const DEFAULT_COLORS = ["#FF0000", "#0000FF", "#00FF00", "#FFA500", "#800080"]
