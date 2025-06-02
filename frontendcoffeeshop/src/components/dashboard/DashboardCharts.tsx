'use client'

import { useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Dữ liệu mẫu
const revenueData = [
  { time: '00:00', value: 0 },
  { time: '03:00', value: 0 },
  { time: '06:00', value: 0 },
  { time: '09:00', value: 150000 },
  { time: '12:00', value: 300000 },
  { time: '15:00', value: 200000 },
  { time: '18:00', value: 400000 },
  { time: '21:00', value: 100000 },
]

const categoryData = [
  { name: 'Cà phê', value: 35 },
  { name: 'Trà', value: 30 },
  { name: 'Bánh', value: 20 },
  { name: 'Khác', value: 15 },
]

export default function DashboardCharts() {
  // Mô phỏng việc tải dữ liệu
  useEffect(() => {
    console.log('DashboardCharts đã được tải')
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Biểu đồ doanh thu theo thời gian */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo giờ</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value) => new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(Number(value))}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={{ fill: '#4F46E5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ phân bố doanh thu */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố doanh thu theo danh mục</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value) => new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(Number(value))}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
} 