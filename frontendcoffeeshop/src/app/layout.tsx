import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Âm nhạc',
  description: 'Hệ thống quản lý quán Âm nhạc toàn diện',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
          <Toaster position="top-right" />
        </main>
      </body>
    </html>
  )
} 