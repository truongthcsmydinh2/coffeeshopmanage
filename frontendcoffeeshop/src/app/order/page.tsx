'use client'

import { useEffect, useState, useRef } from 'react'
import { ShiftModal } from '@/components/ui/ShiftModal'
import { CloseShiftModal } from '@/components/ui/CloseShiftModal'
import { ShiftInfoPanel } from '@/components/ui/ShiftInfoPanel'
import { FaSpinner, FaCog, FaHome, FaSignOutAlt, FaTable, FaClipboardList, FaUserClock, FaPrint } from 'react-icons/fa'
import { TableGrid } from '@/components/order/TableGrid'
import { OrderList } from '@/components/order/OrderList'
import { PrintInvoiceList } from '@/components/order/PrintInvoiceList'
import { useRouter } from 'next/navigation'

interface Shift {
  id: number
  staff_id: number
  staff_id_2?: number
  staff_name: string
  staff2_name?: string
  shift_type: string
  start_time: string
  end_time: string | null
  initial_cash: number | null
  end_cash: number | null
  staff1_start_order_number: number | null
  staff1_end_order_number: number | null
  staff1_calculated_total_orders: number | null
  staff2_start_order_number: number | null
  staff2_end_order_number: number | null
  staff2_calculated_total_orders: number | null
  total_shift_orders: number | null
  status: string
  note: string | null
  is_active: boolean
}

type DropdownOption = 'logout' | 'settings' | 'all-orders'
type TabType = 'home' | 'order' | 'shift' | 'print'

interface Table {
  id: number;
  name: string;
  status: 'empty' | 'occupied';
}

interface MenuItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  price: number;
  group_id: number;
  is_active: boolean;
}

export default function OrderPage() {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const settingsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [errorMenu, setErrorMenu] = useState<string | null>(null)

  useEffect(() => {
    // Lắng nghe sự kiện click để đóng dropdown settings
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    checkCurrentShift()
    fetchMenuItems()

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const checkCurrentShift = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/shifts/current')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dữ liệu ca hiện tại:', data)
        
        if (data) {
          // Ca làm việc hiện tại
          setCurrentShift(data)
          setIsShiftModalOpen(false)
        } else {
          // Không có ca làm việc, mở modal để tạo ca mới
          await checkActiveShifts()
        }
      } else {
        // Kiểm tra xem có ca đang mở không
        await checkActiveShifts()
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra ca hiện tại:', error)
      // Trong trường hợp lỗi, kiểm tra xem có ca đang mở không
      await checkActiveShifts()
    } finally {
      setIsLoading(false)
    }
  }

  const checkActiveShifts = async () => {
    try {
      const response = await fetch('/api/shifts/active')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Danh sách ca đang mở:', data)
        
        if (data.length > 0) {
          // Nếu có ca đang mở, lấy ca đầu tiên
          setCurrentShift(data[0])
          setIsShiftModalOpen(false)
        } else {
          // Không có ca đang mở, mở modal để tạo ca mới
          setIsShiftModalOpen(true)
        }
      } else {
        // Lỗi khi lấy danh sách ca đang mở, mở modal để tạo ca mới
        setIsShiftModalOpen(true)
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra ca đang mở:', error)
      setIsShiftModalOpen(true)
    }
  }

  const handleOpenShift = async (data: {
    staff_id: number
    staff_id_2?: number
    shift_type: string
    initial_cash?: number
    staff1_start_order_number: number
    staff2_start_order_number?: number
    note?: string
  }) => {
    try {
      console.log('Gửi yêu cầu mở ca làm việc:', data)
      
      const response = await fetch('/api/shifts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.detail || 'Có lỗi xảy ra khi mở ca làm việc'
        
        // Kiểm tra nếu lỗi là do ca đã mở
        if (errorMessage.includes('đang được mở')) {
          alert(errorMessage)
          // Kiểm tra lại xem có ca nào đang mở không
          await checkActiveShifts()
        } else {
          alert(`Lỗi: ${errorMessage}`)
        }
        return
      }

      const newShift = await response.json()
      console.log('Dữ liệu ca mới:', newShift)
      
      setCurrentShift(newShift)
      setIsShiftModalOpen(false)
      alert('Đã mở ca làm việc thành công!')
    } catch (error) {
      console.error('Lỗi mở ca:', error)
      alert('Có lỗi xảy ra khi mở ca làm việc. Vui lòng thử lại.')
    }
  }

  const handleUpdateShift = async (data: {
    end_cash?: number
    staff1_end_order_number?: number
    staff2_end_order_number?: number
    note?: string
  }) => {
    if (!currentShift) return
    
    try {
      console.log('Gửi yêu cầu cập nhật ca làm việc:', data)
      
      const response = await fetch(`/api/shifts/${currentShift.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        alert('Có lỗi xảy ra khi cập nhật ca. Vui lòng thử lại.')
        return
      }

      const updatedShift = await response.json()
      console.log('Dữ liệu ca đã cập nhật:', updatedShift)
      
      setCurrentShift(updatedShift)
      alert('Đã cập nhật thông tin ca làm việc thành công!')
      
      return updatedShift
    } catch (error) {
      console.error('Lỗi cập nhật ca:', error)
      alert('Có lỗi xảy ra khi cập nhật ca. Vui lòng thử lại.')
    }
  }

  const handleCloseShiftRequest = () => {
    if (!currentShift) return
    setIsCloseShiftModalOpen(true)
  }
  
  const handleCloseShift = async (data: {
    end_cash?: number
    staff1_end_order_number?: number
    staff2_end_order_number?: number
    note?: string
  }) => {
    if (!currentShift) return
    
    try {
      console.log('Gửi yêu cầu đóng ca làm việc:', currentShift.id)
      
      const response = await fetch(`/api/shifts/${currentShift.id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        alert('Có lỗi xảy ra khi đóng ca. Vui lòng thử lại.')
        return
      }

      const closedShift = await response.json()
      console.log('Dữ liệu ca đã đóng:', closedShift)
      
      alert('Đã đóng ca làm việc thành công!')
      router.push('/functions') // Chuyển về trang chủ sau khi đóng ca
    } catch (error) {
      console.error('Lỗi đóng ca:', error)
      alert('Có lỗi xảy ra khi đóng ca. Vui lòng thử lại.')
    }
  }

  const fetchMenuItems = async () => {
    setLoadingMenu(true)
    try {
      const response = await fetch('/api/menu-items/')
      if (!response.ok) throw new Error('Không thể lấy dữ liệu món')
      const data = await response.json()
      setMenuItems(data)
      setErrorMenu(null)
    } catch (err: any) {
      setErrorMenu('Lỗi khi lấy dữ liệu món: ' + (err.message || ''))
    } finally {
      setLoadingMenu(false)
    }
  }

  // Giả lập danh sách bàn (bạn có thể thay bằng API thực tế)
  const tables: Table[] = [
    { id: 1, name: 'Bàn 1', status: 'empty' },
    { id: 2, name: 'Bàn 2', status: 'occupied' },
    { id: 3, name: 'Bàn 3', status: 'empty' },
    // ...
  ];

  const handleTableClick = (tableId: number) => {
    const table = tables.find(t => t.id === tableId)
    if (table) {
      setSelectedTable(table)
    }
    // Mở modal tạo hóa đơn cho bàn
    // setOrderModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedTable(null)
    // setOrderModalOpen(false)
  }

  const handleSettingsClick = (option: DropdownOption) => {
    if (option === 'logout') {
      if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        router.push('/login')
      }
    } else if (option === 'settings') {
      router.push('/settings')
    } else if (option === 'all-orders') {
      router.push('/all-orders')
    }
  }

  const handlePrintShiftReport = async () => {
    if (!currentShift) return
    alert('Đang in báo cáo ca...')
    // Thêm logic in báo cáo ca ở đây
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen justify-center items-center bg-gray-100">
        <FaSpinner className="animate-spin text-4xl text-primary-600 mb-4" />
        <p className="text-gray-600">Đang tải thông tin ca làm việc...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modal mở ca */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onOpenShift={handleOpenShift}
      />
      
      {/* Modal đóng ca */}
      {currentShift && (
        <CloseShiftModal
          isOpen={isCloseShiftModalOpen}
          onClose={() => setIsCloseShiftModalOpen(false)}
          currentShift={currentShift}
          onCloseShift={handleCloseShift}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">
              Coffee Shop Manager
            </h1>
          </div>
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaCog className="text-gray-600" />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1">
                <button
                  onClick={() => handleSettingsClick('settings')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cài đặt
                </button>
                <button
                  onClick={() => handleSettingsClick('all-orders')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Danh sách order
                </button>
                <button
                  onClick={() => handleSettingsClick('logout')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Tab navigation */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <nav className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'home'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('home')}
            >
              <FaTable className="inline-block mr-1" /> Sơ đồ bàn
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'order'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('order')}
            >
              <FaClipboardList className="inline-block mr-1" /> Danh sách đơn
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'shift'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('shift')}
            >
              <FaUserClock className="inline-block mr-1" /> Thông tin ca
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'print'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('print')}
            >
              <FaPrint className="inline-block mr-1" /> In hóa đơn
            </button>
          </nav>

          <div className="mt-4">
            {activeTab === 'home' && (
              <TableGrid onTableSelect={handleTableClick} />
            )}
            {activeTab === 'order' && <OrderList />}
            {activeTab === 'shift' && currentShift && (
              <ShiftInfoPanel
                currentShift={currentShift}
                onUpdate={handleUpdateShift}
                onCloseShift={handleCloseShiftRequest}
              />
            )}
            {activeTab === 'print' && <PrintInvoiceList />}
          </div>
        </div>
      </main>
    </div>
  )
}