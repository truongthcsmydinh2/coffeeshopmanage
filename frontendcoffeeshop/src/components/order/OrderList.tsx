'use client'

import React, { useState, useEffect } from 'react'
import { tables } from '@/config/tables'
import { toast } from 'react-hot-toast'

interface Table {
  id: number
  name: string
}

interface Order {
  id: string
  table_id: number
  totalAmount: number
  startTime: Date
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  time_in: string
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClosingAll, setIsClosingAll] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const getTableName = (tableId: number) => {
    const table = tables.find(t => t.id === Number(tableId))
    return table ? table.name : `Bàn ${tableId}`
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://192.168.99.166:8000/orders/')
      if (response.ok) {
        const data = await response.json()
        const activeOrPendingOrders = data.filter((order: Order) => order.status === 'pending' || order.status === 'active')
        const pendingOrders = activeOrPendingOrders.filter((order: Order) => order.status === 'pending')
        setOrders(pendingOrders)
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

  const handleCloseAll = () => {
    console.log('Bắt đầu xử lý đóng tất cả order...')
    const code = prompt('Nhập mã 1111 để đóng tất cả')
    console.log('Mã nhập vào:', code)
    if (code === '1111') {
      if (window.confirm('Bạn có chắc chắn muốn đóng tất cả các order?')) {
        console.log('Xác nhận đóng tất cả order')
        closeAllOrders()
      } else {
        console.log('Hủy xác nhận đóng tất cả order')
      }
    } else if (code !== null) {
      console.log('Mã không chính xác:', code)
      toast.error('Mã không chính xác!')
    }
  }

  const closeAllOrders = async () => {
    try {
      console.log('Bắt đầu gọi API đóng tất cả order...')
      setIsClosingAll(true)
      const url = 'http://192.168.99.166:8000/api/orders/close-all/'
      console.log('API URL:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://192.168.99.166:3001'
        },
        mode: 'cors',
        credentials: 'include'
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        console.log('Đóng tất cả order thành công')
        toast.success('Đã đóng tất cả order thành công!')
        fetchOrders()
      } else {
        console.error('Lỗi từ server:', data)
        let errorMessage = 'Không thể đóng tất cả order!'
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err: { msg: string }) => err.msg).join(', ')
          }
        }
        console.error('Error message:', errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Chi tiết lỗi:', error)
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      toast.error('Có lỗi xảy ra khi đóng tất cả order. Vui lòng thử lại.')
    } finally {
      setIsClosingAll(false)
      console.log('Kết thúc xử lý đóng tất cả order')
    }
  }
  
  const handleEditOrder = (orderId: string) => {
    window.location.href = `/order/edit/${orderId}`
  }

  const handlePayment = (orderId: string) => {
    window.location.href = `/payment/${orderId}`
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
        <p className="text-gray-500">Không có đơn hàng nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleCloseAll}
          disabled={isClosingAll}
          className={`px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 ${
            isClosingAll ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isClosingAll ? 'Đang xử lý...' : 'Đóng tất cả'}
        </button>
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
                Thời gian
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
                  {typeof (order as any).total_amount === 'number' && !isNaN((order as any).total_amount)
                    ? Number((order as any).total_amount).toLocaleString('vi-VN')
                    : '0'
                  } ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.time_in).toLocaleTimeString('vi-VN')}
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
                    className="text-primary-500 hover:text-primary-600 mr-4"
                    onClick={() => handleEditOrder(order.id)}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    className="bg-green-500 text-white font-semibold px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    onClick={() => handlePayment(order.id)}
                  >
                    Thanh toán
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