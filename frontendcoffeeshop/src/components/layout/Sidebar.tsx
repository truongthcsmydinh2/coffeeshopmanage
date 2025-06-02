'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

interface MenuItem {
  name: string
  path?: string
  icon?: string | React.ComponentType
  children?: {
    name: string
    path: string
  }[]
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Order', path: '/order', icon: '🛍️' },
  {
    name: 'Thiết lập',
    icon: Cog6ToothIcon,
    children: [
      {
        name: 'Tất cả order',
        path: '/all-orders',
      },
    ],
  },
  { name: 'Khuyến mãi', path: '/promotions', icon: '🎁' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="bg-white h-screen w-64 fixed left-0 top-0 shadow-lg">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">Coffee Shop</h1>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div className="px-4 py-2">
                <div className="flex items-center text-gray-600">
                  {typeof item.icon === 'string' ? (
                    <span className="mr-2">{item.icon}</span>
                  ) : item.icon ? (
                    <item.icon className="h-5 w-5 mr-2" />
                  ) : null}
                  <span>{item.name}</span>
                </div>
                <div className="ml-6 mt-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      href={child.path}
                      className={`block px-4 py-2 text-sm ${
                        pathname === child.path
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-600'
                      }`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                href={item.path || '#'}
                className={`flex items-center px-4 py-2 ${
                  pathname === item.path
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {typeof item.icon === 'string' ? (
                  <span className="mr-2">{item.icon}</span>
                ) : item.icon ? (
                  <item.icon className="h-5 w-5 mr-2" />
                ) : null}
                <span>{item.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
} 