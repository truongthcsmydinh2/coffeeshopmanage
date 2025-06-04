'use client'

import { useState } from 'react'
import { FaEdit, FaSave, FaTimesCircle, FaClipboardCheck } from 'react-icons/fa'

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

interface ShiftInfoPanelProps {
  currentShift: Shift
  onUpdate: (data: {
    end_cash?: number
    staff1_end_order_number?: number
    staff2_end_order_number?: number
    note?: string
  }) => Promise<void>
  onCloseShift: () => void
}

export function ShiftInfoPanel({ currentShift, onUpdate, onCloseShift }: ShiftInfoPanelProps) {
  const [editing, setEditing] = useState(false)
  const [endCash, setEndCash] = useState(currentShift?.end_cash?.toString() || '')
  const [staff1EndOrderNumber, setStaff1EndOrderNumber] = useState(currentShift?.staff1_end_order_number?.toString() || '')
  const [staff2EndOrderNumber, setStaff2EndOrderNumber] = useState(currentShift?.staff2_end_order_number?.toString() || '')
  const [note, setNote] = useState(currentShift?.note || '')
  const [isLoading, setIsLoading] = useState(false)

  if (!currentShift) return null

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
  
  const formatCurrency = (value: number | null) => {
    if (value === null) return 'Không có';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  const calculateTotalOrders = (startNumber: number, endNumber: number) => {
    const startBook = Math.floor(startNumber / 100);
    const endBook = Math.floor(endNumber / 100);

    // Nếu cùng một quyển order
    if (startBook === endBook) {
      if (endNumber < startNumber) return 0;
      return endNumber - startNumber + 1;
    }

    // Nếu khác quyển, luôn tính toán bình thường
    // Tính số lượng order trong quyển đầu
    const firstBookMax = startBook * 100 + 99;
    const firstBookOrders = firstBookMax - startNumber + 1;

    // Tính số lượng order trong quyển cuối
    const lastBookMin = endBook * 100;
    const lastBookOrders = endNumber - lastBookMin + 1;

    // Tổng hợp kết quả
    return firstBookOrders + lastBookOrders;
  };

  function isValidOrderRange(start: number, end: number) {
    const startBook = Math.floor(start / 100);
    const endBook = Math.floor(end / 100);
    const startNum = start % 100;
    const endNum = end % 100;
    if (startBook === endBook) {
      return endNum >= startNum;
    }
    return true;
  }

  const handleUpdate = async () => {
    try {
      setIsLoading(true)
      
      const updateData = {
        end_cash: endCash ? parseFloat(endCash) : undefined,
        staff1_end_order_number: staff1EndOrderNumber ? parseInt(staff1EndOrderNumber) : undefined,
        staff2_end_order_number: staff2EndOrderNumber ? parseInt(staff2EndOrderNumber) : undefined,
        note: note || undefined
      }
      
      await onUpdate(updateData)
      setEditing(false)
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin ca:', error)
      alert('Có lỗi xảy ra khi cập nhật thông tin ca. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEndCash(currentShift?.end_cash?.toString() || '')
    setStaff1EndOrderNumber(currentShift?.staff1_end_order_number?.toString() || '')
    setStaff2EndOrderNumber(currentShift?.staff2_end_order_number?.toString() || '')
    setNote(currentShift?.note || '')
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Thông tin ca làm việc
        </h2>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <button 
                onClick={handleUpdate}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaSave className="mr-2" /> Lưu
              </button>
              <button 
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FaTimesCircle className="mr-2" /> Hủy
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setEditing(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FaEdit className="mr-2" /> Cập nhật
              </button>
              <button 
                onClick={onCloseShift}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaClipboardCheck className="mr-2" /> Đóng ca
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
              <p className="text-sm text-gray-500">Ngày mở ca</p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(currentShift.start_time)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Thời gian mở ca</p>
              <p className="text-lg font-medium text-gray-900">
                {formatTime(currentShift.start_time)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Tiền quỹ ban đầu</p>
              <p className="text-lg font-medium text-gray-900">
                {formatCurrency(currentShift.initial_cash)}
              </p>
            </div>
            
            {currentShift.staff1_start_order_number !== null && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Mã cuống order đầu NV1</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.staff1_start_order_number}
                </p>
              </div>
            )}
            
            {currentShift.staff2_start_order_number !== null && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Mã cuống order đầu NV2</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentShift.staff2_start_order_number}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiền quỹ cuối ca
            </label>
            <input
              type="number"
              value={endCash}
              onChange={(e) => setEndCash(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập số tiền cuối ca (nếu có)"
            />
          </div>
          
          {currentShift.staff1_start_order_number !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã cuống order cuối ca nhân viên 1
              </label>
              <input
                type="number"
                value={staff1EndOrderNumber}
                onChange={(e) => setStaff1EndOrderNumber(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Nhập mã cuống order cuối ca cho nhân viên 1"
              />
              {staff1EndOrderNumber && !isValidOrderRange(currentShift.staff1_start_order_number || 0, parseInt(staff1EndOrderNumber)) && (
                <p className="text-yellow-500 text-sm mt-1">
                  * Số cuống order cuối phải lớn hơn số đầu trong cùng một quyển ({currentShift.staff1_start_order_number})
                </p>
              )}
              {staff1EndOrderNumber && isValidOrderRange(currentShift.staff1_start_order_number || 0, parseInt(staff1EndOrderNumber)) && (
                <p className="text-green-600 text-sm mt-1">
                  Tổng số order: {calculateTotalOrders(currentShift.staff1_start_order_number || 0, parseInt(staff1EndOrderNumber))}
                </p>
              )}
            </div>
          )}
          
          {currentShift.staff2_start_order_number !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã cuống order cuối ca nhân viên 2
              </label>
              <input
                type="number"
                value={staff2EndOrderNumber}
                onChange={(e) => setStaff2EndOrderNumber(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Nhập mã cuống order cuối ca cho nhân viên 2"
              />
              {staff2EndOrderNumber && !isValidOrderRange(currentShift.staff2_start_order_number || 0, parseInt(staff2EndOrderNumber)) && (
                <p className="text-yellow-500 text-sm mt-1">
                  * Số cuống order cuối phải lớn hơn số đầu trong cùng một quyển ({currentShift.staff2_start_order_number})
                </p>
              )}
              {staff2EndOrderNumber && isValidOrderRange(currentShift.staff2_start_order_number || 0, parseInt(staff2EndOrderNumber)) && (
                <p className="text-green-600 text-sm mt-1">
                  Tổng số order: {calculateTotalOrders(currentShift.staff2_start_order_number || 0, parseInt(staff2EndOrderNumber))}
                </p>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Ghi chú (nếu có)"
              rows={3}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <p className="text-sm text-gray-500">Ngày mở ca</p>
            <p className="text-lg font-medium text-gray-900">
              {formatDate(currentShift.start_time)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Thời gian mở ca</p>
            <p className="text-lg font-medium text-gray-900">
              {formatTime(currentShift.start_time)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Tiền quỹ ban đầu</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(currentShift.initial_cash)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Tiền quỹ cuối ca</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(currentShift.end_cash)}
            </p>
          </div>
          
          {currentShift.staff1_start_order_number !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Mã cuống order đầu NV1</p>
              <p className="text-lg font-medium text-gray-900">
                {currentShift.staff1_start_order_number}
              </p>
            </div>
          )}
          
          {currentShift.staff1_end_order_number !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Mã cuống order cuối NV1</p>
              <p className="text-lg font-medium text-gray-900">
                {currentShift.staff1_end_order_number}
              </p>
            </div>
          )}
          
          {currentShift.staff1_calculated_total_orders !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Tổng order NV1</p>
              <p className="text-lg font-medium text-green-600 font-bold">
                {currentShift.staff1_calculated_total_orders}
              </p>
            </div>
          )}
          
          {currentShift.staff2_start_order_number !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Mã cuống order đầu NV2</p>
              <p className="text-lg font-medium text-gray-900">
                {currentShift.staff2_start_order_number}
              </p>
            </div>
          )}
          
          {currentShift.staff2_end_order_number !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Mã cuống order cuối NV2</p>
              <p className="text-lg font-medium text-gray-900">
                {currentShift.staff2_end_order_number}
              </p>
            </div>
          )}
          
          {currentShift.staff2_calculated_total_orders !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Tổng order NV2</p>
              <p className="text-lg font-medium text-green-600 font-bold">
                {currentShift.staff2_calculated_total_orders}
              </p>
            </div>
          )}
          
          {currentShift.total_shift_orders !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Tổng order của ca</p>
              <p className="text-xl font-medium text-green-600 font-bold">
                {currentShift.total_shift_orders}
              </p>
            </div>
          )}
          
          {currentShift.note && (
            <div className="bg-gray-50 rounded-lg p-4 col-span-full">
              <p className="text-sm text-gray-500">Ghi chú</p>
              <p className="text-lg font-medium text-gray-900">
                {currentShift.note}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}