import Link from 'next/link'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const menu = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Order', href: '/order' },
  { label: 'Khuyến mãi', href: '/promotions' },
  { label: 'Thiết lập', href: '/settings' },
]

export default function FunctionsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <main className="w-full max-w-5xl px-4">{children}</main>
    </div>
  )
} 