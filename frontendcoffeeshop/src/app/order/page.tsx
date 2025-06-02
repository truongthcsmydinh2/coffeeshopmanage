'use client'

import { useEffect, useState, useRef } from 'react'
import { ShiftModal } from '@/components/ui/ShiftModal'
import { FaSpinner, FaCog, FaHome, FaSignOutAlt, FaTable, FaClipboardList, FaUserClock, FaPrint } from 'react-icons/fa'
import { TableGrid } from '@/components/order/TableGrid'
import { OrderList } from '@/components/order/OrderList'
import { useRouter } from 'next/navigation'

interface Shift {
  id: number
  staff_id: number
  staff_name: string
  shift_type: string
  start_time: string
  end_time: string | null
  initial_cash: number | null
  order_paper_count: number
  end_order_paper_count: number | null
  status: string
}

type DropdownOption = 'logout' | 'settings'
type TabType = 'home' | 'order' | 'shift'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      const response = await fetch('http://192.168.99.166:8000/api/shifts/current')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dữ liệu ca hiện tại:', data)
        
        if (data) {
          // Ca làm việc hiện tại
          setCurrentShift(data)
          setIsModalOpen(false)
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
      const response = await fetch('http://192.168.99.166:8000/api/shifts/active')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Danh sách ca đang mở:', data)
        
        if (data.length > 0) {
          // Nếu có ca đang mở, lấy ca đầu tiên
          setCurrentShift(data[0])
          setIsModalOpen(false)
        } else {
          // Không có ca đang mở, mở modal để tạo ca mới
          setIsModalOpen(true)
        }
      } else {
        // Lỗi khi lấy danh sách ca đang mở, mở modal để tạo ca mới
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra ca đang mở:', error)
      setIsModalOpen(true)
    }
  }

  const handleOpenShift = async (data: {
    staff_id: number
    shift_type: string
    initial_cash?: number
    order_paper_count: number
  }) => {
    try {
      console.log('Gửi yêu cầu mở ca làm việc:', data)
      
      const response = await fetch('http://192.168.99.166:8000/api/shifts/', {
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
      setIsModalOpen(false)
      alert('Đã mở ca làm việc thành công!')
    } catch (error) {
      console.error('Lỗi mở ca:', error)
      alert('Có lỗi xảy ra khi mở ca làm việc. Vui lòng thử lại.')
    }
  }

  const handleCloseShift = async () => {
    if (!currentShift) return
    
    // Yêu cầu người dùng nhập số cuống order kết thúc
    const endOrderPaperCount = prompt(`Vui lòng nhập số cuống order kết thúc (phải lớn hơn ${currentShift.order_paper_count}):`)
    
    if (!endOrderPaperCount) {
      return // Người dùng đã hủy
    }
    
    const endOrderPaperCountNumber = parseInt(endOrderPaperCount)
    if (isNaN(endOrderPaperCountNumber) || endOrderPaperCountNumber <= currentShift.order_paper_count) {
      alert(`Số cuống order kết thúc phải là số và phải lớn hơn số cuống order bắt đầu (${currentShift.order_paper_count})`)
      return
    }
    
    // Hỏi người dùng xác nhận
    if (!confirm('Bạn có chắc chắn muốn đóng ca làm việc hiện tại không?')) {
      return
    }
    
    try {
      console.log('Gửi yêu cầu đóng ca làm việc:', currentShift.id)
      
      const response = await fetch(`http://192.168.99.166:8000/api/shifts/${currentShift.id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'closed',
          is_active: false,
          end_order_paper_count: endOrderPaperCountNumber
        }),
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
      const response = await fetch('http://192.168.99.166:8000/api/menu-items/')
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

  // Khi chọn bàn trống, mở modal và fetch menu
  const handleTableClick = (table: Table) => {
    if (table.status === 'empty') {
      setSelectedTable(table)
      fetchMenuItems()
    }
  }

  // Đóng modal
  const handleCloseModal = () => {
    setSelectedTable(null)
    setMenuItems([])
    setErrorMenu(null)
  }

  // Thêm hàm in biên bản đóng ca
  const handlePrintShiftReport = async () => {
    if (!currentShift) return;
    try {
      const date = currentShift.start_time.slice(0, 10);
      const shift = currentShift.shift_type.toLowerCase();
      const response = await fetch('http://192.168.99.166:8000/api/v1/endpoints/dashboard/print-shift-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, shift })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Đã gửi biên bản đóng ca tới máy in!');
      } else {
        alert(data.message || 'Có lỗi khi gửi biên bản tới máy in!');
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi gửi biên bản tới máy in!');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  // Render thông tin ca làm việc 
  const renderShiftInfo = () => {
    if (!currentShift) return null;
    
    // Định dạng ngày và giờ
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    };
    
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    };
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Thông tin ca làm việc
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Nhân viên</p>
            <p className="text-lg font-medium text-gray-900">
              {currentShift.staff_name}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Ca làm việc</p>
            <p className="text-lg font-medium text-gray-900">
              {currentShift.shift_type === 'morning'
                ? 'Ca sáng'
                : currentShift.shift_type === 'afternoon'
                ? 'Ca chiều'
                : 'Ca tối'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Ngày mở ca</p>
            <p className="text-lg font-medium text-gray-900">
              {formatDate(currentShift.start_time)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Thời gian mở ca</p>
            <p className="text-lg font-medium text-gray-900">
              {formatTime(currentShift.start_time)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Tiền quỹ ban đầu</p>
            <p className="text-lg font-medium text-gray-900">
              {currentShift.initial_cash
                ? new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(currentShift.initial_cash)
                : 'Chưa có'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Số cuống order bắt đầu</p>
            <p className="text-lg font-medium text-gray-900">
              {currentShift.order_paper_count}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={handlePrintShiftReport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
          >
            <FaPrint className="mr-2" />
            In biên bản đóng ca
          </button>
          <button
            onClick={handleCloseShift}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Đóng ca
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {!currentShift ? (
        <ShiftModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onOpenShift={handleOpenShift}
        />
      ) : (
        <>
          {/* Sắp xếp lại phần nút bánh răng và tab */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex border-b border-gray-200 flex-grow">
              <button
                onClick={() => setActiveTab('home')}
                className={`py-3 px-6 flex items-center font-medium text-sm focus:outline-none ${
                  activeTab === 'home'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaTable className="mr-2" /> Sơ đồ bàn
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`py-3 px-6 flex items-center font-medium text-sm focus:outline-none ${
                  activeTab === 'order'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaClipboardList className="mr-2" /> Danh sách Order
              </button>
              <button
                onClick={() => setActiveTab('shift')}
                className={`py-3 px-6 flex items-center font-medium text-sm focus:outline-none ${
                  activeTab === 'shift'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaUserClock className="mr-2" /> Thông tin ca
              </button>
            </div>
            
            <div ref={settingsRef} className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaCog className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* Dropdown menu */}
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => router.push('/functions')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaHome className="inline-block mr-2" /> Trang chủ
                  </button>
                  <button
                    onClick={() => router.push('/all-orders')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaClipboardList className="inline-block mr-2" /> Tất cả order trong ngày
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                        router.push('/functions');
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="inline-block mr-2" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'home' ? (
              <div className="grid grid-cols-1 gap-6">
                <TableGrid />
              </div>
            ) : activeTab === 'order' ? (
              <div className="grid grid-cols-1 gap-6">
                <OrderList />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {renderShiftInfo()}
              </div>
            )}
          </div>

          {/* Modal order món */}
          {selectedTable && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
                <button onClick={handleCloseModal} className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl">×</button>
                <h2 className="text-xl font-bold mb-4">Order cho {selectedTable.name}</h2>
                {loadingMenu ? (
                  <div>Đang tải dữ liệu món...</div>
                ) : errorMenu ? (
                  <div className="text-red-600">{errorMenu}</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {menuItems.map(item => (
                      <div key={item.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                        <div className="text-sm">Đơn vị: {item.unit}</div>
                        <div className="text-primary-700 font-bold">{item.price.toLocaleString('vi-VN')} ₫</div>
                        {/* ... nút chọn/thêm vào order ... */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 