'use client'

import React, { useState, useEffect } from 'react'
import { tables } from '@/config/tables'
import { toast } from 'react-hot-toast'
import { getTodayVietnam } from '@/utils/dateUtils'
import { FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa'

interface Table {
  id: number
  name: string
}

interface OrderItem {
  id: number
  order_id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  total_price: number
  note: string
  name: string
}

interface Order {
  id: number
  table_id: number
  staff_id: number
  shift_id: number
  status: string
  total_amount: number
  note: string
  order_code: string
  payment_status: string
  time_in: string
  time_out: string | null
  items: OrderItem[]
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getTodayVietnam();
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
      const response = await fetch(`/api/v1/complete-orders/?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        toast.error('Không thể tải danh sách order')
        setOrders([])
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải danh sách order')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }

  const handleTodayClick = () => {
    setSelectedDate(getTodayVietnam())
  }

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <p className="text-gray-500 text-lg">Không có đơn hàng nào trong ngày này</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleTodayClick}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <FaCalendarAlt className="mr-2" /> Hôm nay
        </button>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mã Order
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Bàn
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thời gian bắt đầu
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thời gian kết thúc
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <tr 
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.order_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTableName(order.table_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.total_amount.toLocaleString('vi-VN')} ₫
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.time_in ? new Date(order.time_in).toLocaleDateString('vi-VN') : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.time_in ? new Date(order.time_in).toLocaleTimeString('vi-VN') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.time_out ? new Date(order.time_out).toLocaleDateString('vi-VN') : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.time_out ? new Date(order.time_out).toLocaleTimeString('vi-VN') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                    {expandedOrderId === order.id ? (
                      <FaChevronUp className="text-gray-400 transform transition-transform duration-200" />
                    ) : (
                      <FaChevronDown className="text-gray-400 transform transition-transform duration-200" />
                    )}
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 bg-gray-50">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Chi tiết đồ uống:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item) => (
                              <div 
                                key={item.id} 
                                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                              >
                                <p className="font-medium text-gray-900 mb-2">{item.name}</p>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Số lượng:</span> {item.quantity}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Đơn giá:</span> {item.unit_price.toLocaleString('vi-VN')} ₫
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Thành tiền:</span> {item.total_price.toLocaleString('vi-VN')} ₫
                                  </p>
                                  {item.note && (
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Ghi chú:</span> {item.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-4 text-center text-gray-500 py-4">
                              Không có món nào trong order này
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 