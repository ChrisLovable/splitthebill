import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function PhoneFrame({ children }: Props) {
  return (
    <div className="min-h-screen w-full bg-black overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  )
}
