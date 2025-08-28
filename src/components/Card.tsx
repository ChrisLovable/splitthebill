import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  style?: CSSProperties
}

export default function Card({ children, style }: Props) {
  const base: CSSProperties = {
    borderRadius: 16,
    padding: 12,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow:
      '0 14px 30px rgba(0,0,0,0.45), 0 6px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -3px 10px rgba(0,0,0,0.5)',
  }
  return <div style={{ ...base, ...style }}>{children}</div>
}


