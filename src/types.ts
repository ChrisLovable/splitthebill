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

export const DEFAULT_COLORS = [
  "#FF0000", "#0000FF", "#00FF00", "#FFA500", "#800080",
  "#FFFF00", "#FF1493", "#00FFFF", "#FF69B4", "#32CD32",
  "#8A2BE2", "#FF4500", "#20B2AA", "#DC143C", "#4169E1",
  "#228B22", "#FF6347", "#9932CC", "#DAA520", "#008B8B",
  "#B22222", "#5F9EA0", "#D2691E", "#6495ED", "#CD5C5C"
]
