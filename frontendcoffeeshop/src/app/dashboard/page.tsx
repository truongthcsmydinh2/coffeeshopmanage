'use client'

import { useState, useEffect } from 'react'
import { FaChartPie, FaMoneyBillWave, FaReceipt, FaUsers, FaClock, FaCoffee, FaHome, FaCalendarAlt, FaSmoking, FaPrint, FaUtensils, FaFilter } from 'react-icons/fa'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useRouter } from 'next/navigation'
import DashboardStats from '@/components/dashboard/DashboardStats'

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')
  const [stats, setStats] = useState<any>(null)
  const [cigarettes, setCigarettes] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingCigarettes, setLoadingCigarettes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCigarettes, setErrorCigarettes] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [menuStats, setMenuStats] = useState<any>(null)
  const [loadingMenuStats, setLoadingMenuStats] = useState(false)
  const [errorMenuStats, setErrorMenuStats] = useState<string | null>(null)

  const [menuStatsFilter, setMenuStatsFilter] = useState<'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'>('today')
  const [menuStatsStartDate, setMenuStatsStartDate] = useState<string>('')
  const [menuStatsEndDate, setMenuStatsEndDate] = useState<string>('')

  // States cho bảo mật và UI
  const [isMenuStatsAuthenticated, setIsMenuStatsAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isMenuStatsVisible, setIsMenuStatsVisible] = useState(true)

  const router = useRouter()

  // Lấy ngày hiện tại dạng yyyy-mm-dd theo múi giờ Việt Nam
  const getToday = () => {
    const now = new Date();
    now.setHours(now.getHours() + 7);
    return now.toISOString().slice(0, 10);
  }

  // Khởi tạo ngày được chọn là ngày hiện tại
  useEffect(() => {
    setSelectedDate(getToday())
    setMenuStatsStartDate(getToday())
    setMenuStatsEndDate(getToday())
  }, [])

  // Đóng date picker khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'))
      setCurrentDate(new Date().toLocaleDateString('vi-VN'))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch thống kê từ API khi ngày thay đổi
  useEffect(() => {
    if (!selectedDate) return;

    // Fetch thống kê chung
    setLoadingStats(true)
    setError(null)
    fetch(`/api/v1/endpoints/dashboard/summary?date=${selectedDate}`)
      .then(res => {
        if (!res.ok) throw new Error('Lỗi API')
        return res.json()
      })
      .then(data => setStats(data))
      .catch(() => {
        setStats(null)
        setError('Không thể tải dữ liệu thống kê!')
      })
      .finally(() => setLoadingStats(false))

    // Fetch thống kê thuốc lá
    setLoadingCigarettes(true)
    setErrorCigarettes(null)
    fetch(`/api/v1/endpoints/dashboard/cigarettes?date=${selectedDate}`)
      .then(res => {
        if (!res.ok) throw new Error('Lỗi API')
        return res.json()
      })
      .then(data => setCigarettes(data))
      .catch(() => {
        setCigarettes(null)
        setErrorCigarettes('Không thể tải dữ liệu thuốc lá!')
      })
      .finally(() => setLoadingCigarettes(false))
  }, [selectedDate])

  // Hàm xác thực mật khẩu
  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault() // Ngăn chặn form submit gây refresh trang
    setPasswordError('')
    try {
      const response = await fetch('/api/v1/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsMenuStatsAuthenticated(true)
        setShowPasswordModal(false)
        setPassword('')
      } else {
        setPasswordError('Mật khẩu không đúng!')
      }
    } catch (error) {
      setPasswordError('Lỗi kết nối!')
    }
  }

  // Hàm tính toán ngày bắt đầu và kết thúc dựa trên filter
  const getDateRange = (filter: string) => {
    const today = new Date()
    let startDate = ''
    let endDate = ''

    switch (filter) {
      case 'today':
        startDate = getToday()
        endDate = getToday()
        break
      case 'this_week':
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Thứ 2
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Chủ nhật
        startDate = startOfWeek.toISOString().slice(0, 10)
        endDate = endOfWeek.toISOString().slice(0, 10)
        break
      case 'last_week':
        const lastWeekStart = new Date(today)
        lastWeekStart.setDate(today.getDate() - today.getDay() - 6) // Thứ 2 tuần trước
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6) // Chủ nhật tuần trước
        startDate = lastWeekStart.toISOString().slice(0, 10)
        endDate = lastWeekEnd.toISOString().slice(0, 10)
        break
      case 'this_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        startDate = startOfMonth.toISOString().slice(0, 10)
        endDate = endOfMonth.toISOString().slice(0, 10)
        break
      case 'last_month':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        startDate = lastMonthStart.toISOString().slice(0, 10)
        endDate = lastMonthEnd.toISOString().slice(0, 10)
        break
      case 'custom':
        startDate = menuStatsStartDate
        endDate = menuStatsEndDate
        break
      default:
        startDate = getToday()
        endDate = getToday()
    }

    return { startDate, endDate }
  }

  // Fetch thống kê món ăn khi filter hoặc ngày thay đổi (chỉ khi đã xác thực)
  useEffect(() => {
    if (!isMenuStatsAuthenticated) return;
    if (menuStatsFilter === 'custom' && (!menuStatsStartDate || !menuStatsEndDate)) return;

    setLoadingMenuStats(true)
    setErrorMenuStats(null)

    const { startDate, endDate } = getDateRange(menuStatsFilter)
    const endpoint = `/api/v1/endpoints/dashboard/menu-stats?start_date=${startDate}&end_date=${endDate}&filter_type=range`

    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error('Lỗi API')
        return res.json()
      })
      .then(data => setMenuStats(data))
      .catch(() => {
        setMenuStats(null)
        setErrorMenuStats('Không thể tải dữ liệu thống kê món ăn!')
      })
      .finally(() => setLoadingMenuStats(false))
  }, [isMenuStatsAuthenticated, menuStatsFilter, menuStatsStartDate, menuStatsEndDate])

  const handlePrintShiftReport = async (shift: string) => {
    try {
      const response = await fetch(`/api/v1/endpoints/dashboard/shift-report?date=${selectedDate}&shift=${shift}`)
      if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu')
      const data = await response.json()

      // Tạo nội dung in
      const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center; margin-bottom: 20px;">BIÊN BẢN ĐÓNG CA</h1>
          
          <div style="margin-bottom: 20px;">
            <p><strong>Ngày:</strong> ${new Date(data.date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Ca:</strong> ${data.shift === 'morning' ? 'Ca sáng' : data.shift === 'afternoon' ? 'Ca chiều' : 'Ca tối'}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; margin-bottom: 10px;">Thống kê chung</h2>
            <p><strong>Tổng doanh thu:</strong> ${data.total_revenue.toLocaleString('vi-VN')} ₫</p>
            <p><strong>Tổng số hóa đơn:</strong> ${data.total_orders}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; margin-bottom: 10px;">Thống kê thuốc lá</h2>
            ${data.cigarettes.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tên thuốc</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Số lượng (gói)</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.cigarettes.map((item: any) => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Không có dữ liệu thuốc lá</p>'}
          </div>

          <div style="margin-top: 40px; text-align: center;">
            <p>Người lập biên bản</p>
            <p style="margin-top: 50px;">(Ký, ghi rõ họ tên)</p>
          </div>
        </div>
      `

      // Tạo cửa sổ in
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Lỗi khi in biên bản:', error)
      alert('Có lỗi xảy ra khi in biên bản')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
              <p className="mt-1 sm:mt-2 text-primary-100 text-sm sm:text-base">Tổng quan hoạt động quán cà phê</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="hidden sm:block bg-white/10 rounded-lg px-4 py-2">
                <span className="text-white text-sm">Thời gian thực:</span>
                <span className="text-white font-medium ml-2">
                  {currentTime}
                </span>
              </div>
              <div className="relative date-picker-container w-full sm:w-auto">
                <div
                  className="bg-white/10 rounded-lg px-3 sm:px-4 py-2 cursor-pointer hover:bg-white/20 transition-colors w-full sm:w-auto"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <span className="text-white text-sm">Ngày:</span>
                  <span className="text-white font-medium ml-2">
                    {new Date(selectedDate || getToday()).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {showDatePicker && (
                  <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <input
                        type="date"
                        value={selectedDate || getToday()}
                        onChange={(e) => {
                          setSelectedDate(e.target.value)
                          setShowDatePicker(false)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-auto"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setSelectedDate(getToday())
                          setShowDatePicker(false)
                        }}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm whitespace-nowrap"
                      >
                        Hôm nay
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push('/functions')}
                className="bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 text-white transition-colors self-end sm:self-auto"
                title="Về trang chủ"
              >
                <FaHome className="text-lg sm:text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Loading & Error */}
        {(loadingStats || loadingCigarettes) && (
          <div className="flex justify-center items-center py-12">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></span>
            <span className="text-primary-600 font-semibold">Đang tải dữ liệu...</span>
          </div>
        )}
        {(error || errorCigarettes) && (
          <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 mb-6 text-center font-semibold">
            {error || errorCigarettes}
          </div>
        )}
        {/* phan chon ngay xem thong ke
        <button
            onClick={() => setSelectedDate(getToday())}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Hôm nay
          </button>
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        */}

        {/* Stats Cards */}
        <DashboardStats stats={stats} loading={loadingStats} error={error} />

        {/* Thống kê theo ca */}
        {!loadingStats && !error && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {Object.entries(stats.shifts).map(([shift, data]: any) => {
              let color = '';
              let icon = null;
              let label = '';
              if (shift === 'morning') {
                color = 'border-yellow-400';
                icon = <FaCoffee className="text-yellow-500 text-2xl sm:text-3xl" />;
                label = 'Ca sáng (6:00 - 12:00)';
              } else if (shift === 'afternoon') {
                color = 'border-blue-400';
                icon = <FaChartPie className="text-blue-500 text-2xl sm:text-3xl" />;
                label = 'Ca chiều (12:00 - 18:00)';
              } else {
                color = 'border-purple-500';
                icon = <FaClock className="text-purple-600 text-2xl sm:text-3xl" />;
                label = 'Ca tối (18:00 - 6:00)';
              }
              return (
                <div key={shift} className={`bg-white rounded-xl shadow-sm p-4 sm:p-8 border-l-8 ${color} flex flex-col items-center justify-center transition hover:shadow-lg`}>
                  <div className="mb-2 sm:mb-4">{icon}</div>
                  <div className="text-base sm:text-lg font-bold text-gray-700 mb-1 sm:mb-2 text-center">{label}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary-700 mb-1">{data.revenue.toLocaleString('vi-VN')} ₫</div>
                  <div className="text-sm sm:text-sm font-semibold text-gray-500">Doanh thu</div>
                  <div className="text-xl sm:text-xl font-bold text-gray-800 mt-2 sm:mt-4">{data.orders}</div>
                  <div className="text-sm sm:text-sm font-semibold text-gray-500">Số hóa đơn</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Thống kê thuốc lá theo ca */}
        {!loadingCigarettes && !errorCigarettes && cigarettes && (
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <FaSmoking className="text-primary-600 mr-2" />
              Thống kê thuốc lá theo ca
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Object.entries(cigarettes.shifts).map(([shift, data]: any) => {
                let color = '';
                let label = '';
                if (shift === 'morning') {
                  color = 'border-yellow-400';
                  label = 'Ca sáng';
                } else if (shift === 'afternoon') {
                  color = 'border-blue-400';
                  label = 'Ca chiều';
                } else {
                  color = 'border-purple-500';
                  label = 'Ca tối';
                }

                return (
                  <div key={shift} className={`bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-8 ${color}`}>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{label}</h3>
                    {data.items.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {data.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{item.name}</p>
                            <p className="font-semibold text-primary-600 text-sm sm:text-base">{item.quantity} gói</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-3 sm:py-4 text-sm sm:text-base">Không có dữ liệu</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thống kê món bán được */}
        <div className="mt-8 sm:mt-12">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <FaUtensils className="text-primary-600 mr-2" />
              Thống kê món bán được
            </h2>

            {/* Bộ lọc thời gian */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Khoảng thời gian:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'today', label: 'Hôm nay' },
                    { key: 'this_week', label: 'Tuần này' },
                    { key: 'last_week', label: 'Tuần trước' },
                    { key: 'this_month', label: 'Tháng này' },
                    { key: 'last_month', label: 'Tháng trước' },
                    { key: 'custom', label: 'Tùy chỉnh' }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        if (!isMenuStatsAuthenticated) {
                          setShowPasswordModal(true)
                        } else {
                          setMenuStatsFilter(filter.key as any)
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${menuStatsFilter === filter.key && isMenuStatsAuthenticated
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hiển thị khoảng thời gian được chọn */}
              {menuStatsFilter !== 'custom' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Khoảng thời gian: {(() => {
                        const { startDate, endDate } = getDateRange(menuStatsFilter)
                        return `${new Date(startDate).toLocaleDateString('vi-VN')} - ${new Date(endDate).toLocaleDateString('vi-VN')}`
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* Chọn khoảng thời gian tùy chỉnh */}
              {menuStatsFilter === 'custom' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <FaCalendarAlt className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Chọn khoảng thời gian tùy chỉnh:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={menuStatsStartDate}
                        onChange={(e) => setMenuStatsStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={menuStatsEndDate}
                        onChange={(e) => setMenuStatsEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => {
                        setMenuStatsStartDate(getToday())
                        setMenuStatsEndDate(getToday())
                      }}
                      className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs"
                    >
                      Hôm nay
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date()
                        const yesterday = new Date(today)
                        yesterday.setDate(today.getDate() - 1)
                        setMenuStatsStartDate(yesterday.toISOString().slice(0, 10))
                        setMenuStatsEndDate(yesterday.toISOString().slice(0, 10))
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs"
                    >
                      Hôm qua
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date()
                        const lastWeek = new Date(today)
                        lastWeek.setDate(today.getDate() - 7)
                        setMenuStatsStartDate(lastWeek.toISOString().slice(0, 10))
                        setMenuStatsEndDate(getToday())
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                    >
                      7 ngày qua
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal xác thực mật khẩu */}
            {showPasswordModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác thực quyền truy cập</h3>
                  <p className="text-sm text-gray-600 mb-4">Vui lòng nhập mật khẩu để xem thống kê món ăn:</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                    placeholder="Nhập mật khẩu..."
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-red-600 text-sm mb-3">{passwordError}</p>
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePasswordSubmit}
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordModal(false)
                        setPassword('')
                        setPasswordError('')
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading & Error cho menu stats */}
            {isMenuStatsAuthenticated && loadingMenuStats && (
              <div className="flex justify-center items-center py-8">
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></span>
                <span className="text-primary-600 font-semibold text-sm">Đang tải dữ liệu...</span>
              </div>
            )}

            {isMenuStatsAuthenticated && errorMenuStats && (
              <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 mb-4 text-center font-semibold text-sm">
                {errorMenuStats}
              </div>
            )}

            {/* Thông báo cần xác thực */}
            {!isMenuStatsAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-800 font-medium mb-2">Cần xác thực để xem thống kê</div>
                <p className="text-yellow-700 text-sm mb-4">Vui lòng nhập mật khẩu để truy cập thống kê món ăn chi tiết.</p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Xác thực ngay
                </button>
              </div>
            )}

            {/* Nút ẩn/hiện bảng và tổng kết */}
            {isMenuStatsAuthenticated && !loadingMenuStats && !errorMenuStats && menuStats && (
              <div className="space-y-6">
                {/* Header với nút ẩn/hiện bảng */}
                {menuStats.items && menuStats.items.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                      Chi tiết món bán được
                    </h3>
                    <button
                      onClick={() => setIsMenuStatsVisible(!isMenuStatsVisible)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-colors self-start sm:self-auto"
                    >
                      {isMenuStatsVisible ? 'Ẩn bảng' : 'Hiện bảng'}
                    </button>
                  </div>
                )}

                {/* Bảng chi tiết */}
                {menuStats.items && menuStats.items.length > 0 && isMenuStatsVisible && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tên món
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tổng SL
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Ca sáng
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Ca chiều
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Ca tối
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Doanh thu
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Tỷ lệ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {menuStats.items.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="sm:hidden text-xs text-gray-500 mt-1">
                                S:{item.morning_quantity} | C:{item.afternoon_quantity} | T:{item.evening_quantity}
                              </div>
                            </td>
                            <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm text-gray-900 font-semibold">{item.total_quantity}</div>
                            </td>
                            <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                              <div className="text-sm text-gray-900 font-semibold">{item.morning_quantity}</div>
                            </td>
                            <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                              <div className="text-sm text-gray-900 font-semibold">{item.afternoon_quantity}</div>
                            </td>
                            <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                              <div className="text-sm text-gray-900 font-semibold">{item.evening_quantity}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-semibold">
                                {item.revenue.toLocaleString('vi-VN')} ₫
                              </div>
                            </td>
                            <td className="px-2 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div className="flex items-center">
                                <div className="text-sm text-gray-900 mr-2">{item.percentage}%</div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-primary-600 h-2 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tổng kết - luôn hiển thị khi có dữ liệu */}
                {menuStats.summary && (
                  <div className="bg-primary-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-primary-900 mb-3">Tổng kết</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-700">{menuStats.summary.total_items}</div>
                        <div className="text-sm text-primary-600">Tổng số món</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-700">{menuStats.summary.total_quantity}</div>
                        <div className="text-sm text-primary-600">Tổng số lượng bán</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-700">
                          {menuStats.summary.total_revenue.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="text-sm text-primary-600">Tổng doanh thu</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state cho menu stats */}
            {isMenuStatsAuthenticated && !loadingMenuStats && !errorMenuStats && (!menuStats || (menuStats.items && menuStats.items.length === 0)) && (
              <div className="text-center text-gray-500 py-8">
                Không có dữ liệu thống kê món ăn cho khoảng thời gian này.
              </div>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!loadingStats && !error && !stats && (
          <div className="text-center text-gray-500 py-12">Không có dữ liệu thống kê cho ngày này.</div>
        )}
      </div>

      {/* Modal xác thực mật khẩu */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác thực để xem thống kê chi tiết
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPassword('')
                    setPasswordError('')
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}