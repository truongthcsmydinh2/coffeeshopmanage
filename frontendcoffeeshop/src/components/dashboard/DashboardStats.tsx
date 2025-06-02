'use client'

import { useEffect } from 'react'
import { FaUsers, FaCoffee, FaReceipt, FaMoneyBillWave } from 'react-icons/fa'

export default function DashboardStats({ stats, loading, error }: { stats: any, loading: boolean, error: string | null }) {
  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></span>
      <span className="text-primary-600 font-semibold">Đang tải dữ liệu...</span>
    </div>
  )
  if (error) return (
    <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 mb-6 text-center font-semibold">{error}</div>
  )
  if (!stats) return (
    <div className="text-center text-gray-500 py-12">Không có dữ liệu thống kê.</div>
  )
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      {/* Thống kê hóa đơn */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng hóa đơn</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total?.orders ?? 'Đang cập nhật'}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <FaReceipt className="text-xl text-purple-600" />
          </div>
        </div>
      </div>
      {/* Thống kê doanh thu */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Doanh thu</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total?.revenue?.toLocaleString('vi-VN') + ' ₫' || 'Đang cập nhật'}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-full">
            <FaMoneyBillWave className="text-xl text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  )
} 