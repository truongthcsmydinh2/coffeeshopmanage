'use client'

import { useState } from 'react'
import { FaTimes, FaPrint } from 'react-icons/fa'

interface Shift {
  id: number
  staff_id: number
  staff_id_2?: number
  staff_name: string
  staff2_name?: string
  shift_type: string
  start_time: string
  end_time: string | null
  initial_cash: number | null
  end_cash: number | null
  staff1_start_order_number: number | null
  staff1_end_order_number: number | null
  staff1_calculated_total_orders: number | null
  staff2_start_order_number: number | null
  staff2_end_order_number: number | null
  staff2_calculated_total_orders: number | null
  total_shift_orders: number | null
  status: string
  note: string | null
}

interface CloseShiftModalProps {
  isOpen: boolean
  onClose: () => void
  currentShift: Shift
  onCloseShift: (data: {
    end_cash?: number
    staff1_end_order_number?: number
    staff2_end_order_number?: number
    note?: string
  }) => Promise<void>
}

export function CloseShiftModal({ isOpen, onClose, currentShift, onCloseShift }: CloseShiftModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen || !currentShift) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('vi-VN')
  }

  const formatShiftType = (type: string) => {
    switch (type) {
      case 'morning':
        return 'Ca sáng'
      case 'afternoon':
        return 'Ca chiều'
      case 'evening':
        return 'Ca tối'
      default:
        return type
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      // Sử dụng thông tin đã cập nhật từ ShiftInfoPanel
      const closeData = {
        end_cash: currentShift.end_cash || undefined,
        staff1_end_order_number: currentShift.staff1_end_order_number || undefined,
        staff2_end_order_number: currentShift.staff2_end_order_number || undefined,
        note: currentShift.note || undefined
      }
      
      await onCloseShift(closeData)
      onClose()
    } catch (error) {
      console.error('Lỗi khi đóng ca:', error)
      alert('Có lỗi xảy ra khi đóng ca. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintReport = async () => {
    try {
      // Lấy ngày từ start_time (định dạng yyyy-mm-dd)
      const date = currentShift.start_time.split('T')[0];
      const shift = currentShift.shift_type;

      const body = {
        date,
        shift,
        staff1_name: currentShift.staff_name,
        staff1_start_order: currentShift.staff1_start_order_number,
        staff1_end_order: currentShift.staff1_end_order_number,
        staff1_total: currentShift.staff1_calculated_total_orders,
        staff2_name: currentShift.staff2_name,
        staff2_start_order: currentShift.staff2_start_order_number,
        staff2_end_order: currentShift.staff2_end_order_number,
        staff2_total: currentShift.staff2_calculated_total_orders,
      };

      const res = await fetch('/api/v1/endpoints/dashboard/print-shift-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã gửi biên bản đóng ca tới máy in!');
      } else {
        alert(data.error || 'Không thể gửi dữ liệu tới máy in. Vui lòng kiểm tra kết nối máy in.');
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi in biên bản đóng ca!');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Xác nhận đóng ca</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-5">
          <h4 className="text-lg font-medium mb-4">Thông tin ca hiện tại</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Nhân viên 1</p>
              <p className="text-lg font-medium text-gray-900">
                {currentShift.staff_name}
              </p>
            </div>
            
            {currentShift.staff2_name && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Nhân viên 2</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.staff2_name}
                </p>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Ca làm việc</p>
              <p className="text-lg font-medium text-gray-900">
                {formatShiftType(currentShift.shift_type)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Thời gian mở ca</p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(currentShift.start_time)} {formatTime(currentShift.start_time)}
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
                  : 'Không có'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Tiền quỹ cuối ca</p>
              <p className="text-lg font-medium text-gray-900">
                {currentShift.end_cash
                  ? new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(currentShift.end_cash)
                  : 'Chưa cập nhật'}
              </p>
            </div>
            
            {currentShift.staff1_start_order_number && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Mã cuống order đầu NV1</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.staff1_start_order_number}
                </p>
              </div>
            )}
            
            {currentShift.staff1_end_order_number && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Mã cuống order cuối NV1</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.staff1_end_order_number}
                </p>
              </div>
            )}
            
            {currentShift.staff1_calculated_total_orders && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Tổng order NV1</p>
                <p className="text-lg font-medium text-green-600 font-bold">
                  {currentShift.staff1_calculated_total_orders}
                </p>
              </div>
            )}
            
            {currentShift.staff2_start_order_number && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Mã cuống order đầu NV2</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.staff2_start_order_number}
                </p>
              </div>
            )}
            
            {currentShift.staff2_end_order_number && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Mã cuống order cuối NV2</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.staff2_end_order_number}
                </p>
              </div>
            )}
            
            {currentShift.staff2_calculated_total_orders && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Tổng order NV2</p>
                <p className="text-lg font-medium text-green-600 font-bold">
                  {currentShift.staff2_calculated_total_orders}
                </p>
              </div>
            )}
            
            {currentShift.total_shift_orders && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Tổng order của ca</p>
                <p className="text-xl font-medium text-green-600 font-bold">
                  {currentShift.total_shift_orders}
                </p>
              </div>
            )}
            
            {/* Nút in biên bản đóng ca nằm bên phải tổng order ca */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              <button
                onClick={handlePrintReport}
                className="flex items-center space-x-2 px-4 py-3 text-lg font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FaPrint className="text-xl" />
                <span>In biên bản đóng ca</span>
              </button>
            </div>
            
            {currentShift.note && (
              <div className="bg-gray-50 rounded-lg p-4 col-span-full">
                <p className="text-sm text-gray-500">Ghi chú</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.note}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isLoading || currentShift.staff1_end_order_number === null}
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận đóng ca'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 