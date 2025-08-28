import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function PhoneFrame({ children }: Props) {
  return (
    <div className="min-h-screen w-full bg-neutral-800 flex items-start justify-center">
      <div className="w-full max-w-[360px] min-h-screen md:h-[90vh] md:my-6 md:rounded-[20px] md:border-2 md:border-white md:shadow-2xl bg-black overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
