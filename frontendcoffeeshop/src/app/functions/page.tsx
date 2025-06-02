import Link from 'next/link'
import { FaChartPie, FaCoffee, FaGift, FaCog } from 'react-icons/fa'

const functions = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    description: 'Xem tổng quan hoạt động quán cà phê',
    color: 'from-blue-400 to-blue-600',
    icon: <FaChartPie size={40} />,
  },
  {
    label: 'Order',
    href: '/order',
    description: 'Quản lý đơn hàng và bàn',
    color: 'from-green-400 to-green-600',
    icon: <FaCoffee size={40} />,
  },
  {
    label: 'Khuyến mãi',
    href: '/promotions',
    description: 'Quản lý các chương trình khuyến mãi',
    color: 'from-yellow-400 to-yellow-600',
    icon: <FaGift size={40} />,
  },
  {
    label: 'Thiết lập',
    href: '/settings',
    description: 'Cài đặt hệ thống, menu, nhân viên, máy in',
    color: 'from-purple-400 to-purple-600',
    icon: <FaCog size={40} />,
  },
]

export default function FunctionsIndex() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-full max-w-3xl p-6">
        {functions.map((func) => (
          <Link
            key={func.href}
            href={func.href}
            className={`rounded-2xl shadow-xl p-10 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer bg-gradient-to-br ${func.color} text-white group`}
          >
            <div className="mb-4 group-hover:scale-110 transition-transform">{func.icon}</div>
            <span className="text-2xl font-extrabold mb-2 drop-shadow-lg">{func.label}</span>
            <span className="text-base text-center opacity-90 font-medium drop-shadow">{func.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
} 