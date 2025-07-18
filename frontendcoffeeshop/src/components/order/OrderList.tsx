'use client'

import React, { useState, useEffect } from 'react'
import { tables } from '@/config/tables'
import { toast } from 'react-hot-toast'
import { Order } from '@/types/order'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'

interface Table {
  id: number
  name: string
}

interface OrderListProps {
  orders: Order[]
  selectedOrder: Order | null
  onSelectOrder: (order: Order) => void
  isLoading: boolean
}

export function OrderList({ orders, selectedOrder, onSelectOrder, isLoading }: OrderListProps) {
  const [isClosingAll, setIsClosingAll] = useState(false)

  const getTableName = (tableId: number) => {
    const table = tables.find(t => t.id === Number(tableId))
    return table ? table.name : `Bàn ${tableId}`
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
        // Assuming fetchOrders is called elsewhere in the component
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

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Không có đơn hàng nào</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành'
      case 'pending':
        return 'Đang xử lý'
      case 'cancelled':
        return 'Đã hủy'
      default:
        return status
    }
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
                Mã đơn hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số bàn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian tạo
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
            {orders && orders.map((order) => (
              <tr 
                key={order.id} 
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedOrder?.id === order.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectOrder(order)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.order_code || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Bàn {order.table_id || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(order.total_amount || 0).toLocaleString('vi-VN')}đ
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status || '')}`}>
                    {getStatusText(order.status || '')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle view details
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle edit
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 