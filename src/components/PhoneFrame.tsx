import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function PhoneFrame({ children }: Props) {
  return (
    <div className="min-h-screen w-full bg-neutral-800 flex items-start justify-center py-6">
      <div className="w-[360px] max-w-[360px] h-[90vh] rounded-[20px] border-2 border-white shadow-2xl bg-black overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
