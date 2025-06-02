'use client'

import { useState, useEffect } from 'react'
import { FaChartPie, FaMoneyBillWave, FaReceipt, FaUsers, FaClock, FaCoffee, FaHome, FaCalendarAlt, FaSmoking, FaPrint } from 'react-icons/fa'
import { Card } from '@/components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
  }, [])

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
    fetch(`http://192.168.99.166:8000/api/v1/endpoints/dashboard/summary?date=${selectedDate}`)
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
    fetch(`http://192.168.99.166:8000/api/v1/endpoints/dashboard/cigarettes?date=${selectedDate}`)
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

  const handlePrintShiftReport = async (shift: string) => {
    try {
      const response = await fetch(`http://192.168.99.166:8000/api/v1/endpoints/dashboard/shift-report?date=${selectedDate}&shift=${shift}`)
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="mt-2 text-primary-100">Tổng quan hoạt động quán cà phê</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-lg px-4 py-2">
                <span className="text-white text-sm">Thời gian thực:</span>
                <span className="text-white font-medium ml-2">
                  {currentTime}
                </span>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-2">
                <span className="text-white text-sm">Ngày:</span>
                <span className="text-white font-medium ml-2">
                  {currentDate}
                </span>
              </div>
              <button 
                onClick={() => router.push('/functions')}
                className="bg-white/10 hover:bg-white/20 rounded-full p-3 text-white transition-colors"
                title="Về trang chủ"
              >
                <FaHome className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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

        {/* Date Picker */}
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
          <button
            onClick={() => setSelectedDate(getToday())}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Hôm nay
          </button>
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={stats} loading={loadingStats} error={error} />

        {/* Thống kê theo ca */}
        {!loadingStats && !error && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(stats.shifts).map(([shift, data]: any) => {
              let color = '';
              let icon = null;
              let label = '';
              if (shift === 'morning') {
                color = 'border-yellow-400';
                icon = <FaCoffee className="text-yellow-500 text-3xl" />;
                label = 'Ca sáng (6:00 - 12:00)';
              } else if (shift === 'afternoon') {
                color = 'border-blue-400';
                icon = <FaChartPie className="text-blue-500 text-3xl" />;
                label = 'Ca chiều (12:00 - 18:00)';
              } else {
                color = 'border-purple-500';
                icon = <FaClock className="text-purple-600 text-3xl" />;
                label = 'Ca tối (18:00 - 6:00)';
              }
              return (
                <div key={shift} className={`bg-white rounded-xl shadow-sm p-8 border-l-8 ${color} flex flex-col items-center justify-center transition hover:shadow-lg`}>
                  <div className="mb-4">{icon}</div>
                  <div className="text-lg font-semibold text-gray-700 mb-2">{label}</div>
                  <div className="text-3xl font-bold text-primary-700 mb-1">{data.revenue.toLocaleString('vi-VN')} ₫</div>
                  <div className="text-sm text-gray-500">Doanh thu</div>
                  <div className="text-xl font-semibold text-gray-800 mt-4">{data.orders}</div>
                  <div className="text-sm text-gray-500">Số hóa đơn</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Thống kê thuốc lá theo ca */}
        {!loadingCigarettes && !errorCigarettes && cigarettes && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaSmoking className="text-primary-600 mr-2" />
              Thống kê thuốc lá theo ca
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div key={shift} className={`bg-white rounded-xl shadow-sm p-6 border-l-8 ${color}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>
                    {data.items.length > 0 ? (
                      <div className="space-y-3">
                        {data.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="font-semibold text-primary-600">{item.quantity} gói</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Không có dữ liệu</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loadingStats && !error && !stats && (
          <div className="text-center text-gray-500 py-12">Không có dữ liệu thống kê cho ngày này.</div>
        )}
      </div>
    </div>
  )
} 