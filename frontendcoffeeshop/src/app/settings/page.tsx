'use client'

import { useState } from 'react'
import { MenuSettings } from '@/components/settings/MenuSettings'
import { StaffSettings } from '@/components/settings/StaffSettings'
import { PrinterSettings } from '@/components/settings/PrinterSettings'
import { FaHome } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

type SettingsTab = 'menu' | 'staff' | 'printer'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('menu')
  const router = useRouter()

  const tabs = [
    { id: 'menu', name: 'Thực đơn', icon: '🍽️' },
    { id: 'staff', name: 'Nhân viên', icon: '👥' },
    { id: 'printer', name: 'Cài đặt in', icon: '🖨️' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 relative">
            <h1 className="text-3xl font-bold text-white">Thiết lập hệ thống</h1>
            <p className="mt-2 text-primary-100">Quản lý và cấu hình toàn bộ hệ thống quán cà phê của bạn</p>
            
            {/* Home button */}
            <button 
              onClick={() => router.push('/functions')}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white transition-colors"
              title="Về trang chủ"
            >
              <FaHome className="text-xl" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`
                    group relative min-w-0 flex-1 overflow-hidden py-6 px-2 text-sm font-medium text-center hover:bg-gray-50 focus:z-10
                    ${activeTab === tab.id 
                      ? 'text-primary-600 border-b-2 border-primary-500' 
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xl">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </div>
                  {activeTab === tab.id && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeTab === 'menu' && <MenuSettings />}
              {activeTab === 'staff' && <StaffSettings />}
              {activeTab === 'printer' && <PrinterSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 