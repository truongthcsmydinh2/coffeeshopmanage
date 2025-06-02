'use client'

import React, { useState, useEffect } from 'react'
import { tables } from '@/config/tables'
import { toast } from 'react-hot-toast'
import { FaHome, FaClipboardList } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

interface Table {
  id: number
  name: string
}

interface Order {
  id: string
  table_id: number
  totalAmount: number
  startTime: Date
  endTime?: Date
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  time_in: string
  time_out?: string
}

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    fetchOrders()
  }, [selectedDate])

  const getTableName = (tableId: number) => {
    const table = tables.find(t => t.id === Number(tableId))
    return table ? table.name : `Bàn ${tableId}`
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching orders for date:', selectedDate)
      const response = await fetch(`http://192.168.99.166:8000/orders/?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Orders data:', data)
        setOrders(data)
      } else {
        console.error('Lỗi khi tải danh sách order:', response.status)
        setOrders([])
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách order:', error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditOrder = (orderId: string) => {
    window.location.href = `/order/edit/${orderId}`
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Date changed to:', e.target.value)
    setSelectedDate(e.target.value)
  }

  const handleTodayClick = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    console.log('Setting today date:', formattedDate)
    setSelectedDate(formattedDate)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={() => router.push('/functions')}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            <FaHome className="mr-2" /> Về trang chủ
          </button>
          <button
            onClick={() => router.push('/order')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <FaClipboardList className="mr-2" /> Về trang order
          </button>
        </div>
        <p className="text-gray-500">Không có đơn hàng nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Tất cả order trong ngày</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/functions')}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            <FaHome className="mr-2" /> Về trang chủ
          </button>
          <button
            onClick={() => router.push('/order')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <FaClipboardList className="mr-2" /> Về trang order
          </button>
        </div>
      </div>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleTodayClick}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Hôm nay
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="px-4 py-2 border border-gray-300 rounded"
        />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bàn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian bắt đầu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian kết thúc
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getTableName(order.table_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof order.totalAmount === 'number' && !isNaN(order.totalAmount)
                    ? order.totalAmount.toLocaleString('vi-VN')
                    : ((order as any).total_amount && !isNaN((order as any).total_amount) ? Number((order as any).total_amount).toLocaleString('vi-VN') : '0')
                  } ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.time_in).toLocaleTimeString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.time_out ? new Date(order.time_out).toLocaleTimeString('vi-VN') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.status === 'pending'
                      ? 'Chờ xử lý'
                      : order.status === 'active'
                      ? 'Đang phục vụ'
                      : order.status === 'completed'
                      ? 'Hoàn thành'
                      : 'Đã hủy'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    className="text-primary-500 hover:text-primary-600"
                    onClick={() => handleEditOrder(order.id)}
                  >
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 