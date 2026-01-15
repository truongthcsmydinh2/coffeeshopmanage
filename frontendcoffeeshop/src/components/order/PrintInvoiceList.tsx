'use client'

import React, { useState, useEffect } from 'react'
import { tables } from '@/config/tables'
import { toast } from 'react-hot-toast'
import { FaPrint, FaSpinner } from 'react-icons/fa'
import { getTodayVietnam } from '@/utils/dateUtils'

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

export function PrintInvoiceList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set())
  const [isPrintingCombined, setIsPrintingCombined] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
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

  const handleToggleOrder = (orderId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    const newSelected = new Set(selectedOrderIds)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrderIds(newSelected)
  }

  const handleRowClick = (orderId: number) => {
    handleToggleOrder(orderId)
  }

  // Lấy danh sách bàn từ orders hiện tại
  const getAvailableTables = () => {
    const tableIds = new Set(orders.map(order => order.table_id))
    return Array.from(tableIds).sort((a, b) => a - b)
  }

  // Filter orders theo bàn đã chọn
  const filteredOrders = selectedTableId 
    ? orders.filter(order => order.table_id === selectedTableId)
    : orders

  const handleSelectAll = () => {
    const ordersToSelect = filteredOrders
    if (selectedOrderIds.size === ordersToSelect.length && 
        ordersToSelect.every(order => selectedOrderIds.has(order.id))) {
      // Bỏ chọn tất cả orders đang hiển thị
      const newSelected = new Set(selectedOrderIds)
      ordersToSelect.forEach(order => newSelected.delete(order.id))
      setSelectedOrderIds(newSelected)
    } else {
      // Chọn tất cả orders đang hiển thị
      const newSelected = new Set(selectedOrderIds)
      ordersToSelect.forEach(order => newSelected.add(order.id))
      setSelectedOrderIds(newSelected)
    }
  }

  const handlePrintCombinedInvoice = async () => {
    if (selectedOrderIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một order để in gộp')
      return
    }

    try {
      setIsPrintingCombined(true)
      const response = await fetch(`/api/v1/orders/print-combined-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_ids: Array.from(selectedOrderIds)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Đã gửi hóa đơn gộp tới máy in')
          setSelectedOrderIds(new Set())
        } else {
          toast.error(data.error || 'Có lỗi xảy ra khi in hóa đơn gộp')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi in hóa đơn gộp' }))
        toast.error(errorData.error || 'Có lỗi xảy ra khi in hóa đơn gộp')
      }
    } catch (error) {
      console.error('Lỗi khi in hóa đơn gộp:', error)
      toast.error('Có lỗi xảy ra khi in hóa đơn gộp')
    } finally {
      setIsPrintingCombined(false)
    }
  }

  const handlePrintInvoice = async (orderId: number) => {
    try {
      setPrintingOrderId(orderId)
      const response = await fetch(`/api/v1/orders/print-order?order_id=${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Đã gửi hóa đơn tới máy in')
        } else {
          toast.error(data.error || 'Có lỗi xảy ra khi in hóa đơn')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi in hóa đơn' }))
        toast.error(errorData.error || 'Có lỗi xảy ra khi in hóa đơn')
      }
    } catch (error) {
      console.error('Lỗi khi in hóa đơn:', error)
      toast.error('Có lỗi xảy ra khi in hóa đơn')
    } finally {
      setPrintingOrderId(null)
    }
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

  const availableTables = getAvailableTables()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleTodayClick}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Hôm nay
          </button>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <select
              value={selectedTableId || ''}
              onChange={(e) => setSelectedTableId(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
            >
              <option value="">Tất cả bàn</option>
              {availableTables.map(tableId => (
                <option key={tableId} value={tableId}>
                  {getTableName(tableId)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedOrderIds.size > 0 && (
          <button
            onClick={handlePrintCombinedInvoice}
            disabled={isPrintingCombined}
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
              isPrintingCombined
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPrintingCombined ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Đang in...
              </>
            ) : (
              <>
                <FaPrint className="mr-2" />
                In gộp hóa đơn ({selectedOrderIds.size})
              </>
            )}
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={filteredOrders.length > 0 && filteredOrders.every(order => selectedOrderIds.has(order.id))}
                  onChange={handleSelectAll}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
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
                In
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr 
                key={order.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                onClick={() => handleRowClick(order.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.has(order.id)}
                    onChange={() => handleToggleOrder(order.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePrintInvoice(order.id)
                    }}
                    disabled={printingOrderId === order.id}
                    className={`flex items-center px-3 py-1 rounded-md transition-all duration-200 ${
                      printingOrderId === order.id
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {printingOrderId === order.id ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <FaPrint className="mr-2" />
                    )}
                    In
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

