'use client'

import { useState, useEffect } from 'react'
import { FaTimes } from 'react-icons/fa'

interface Staff {
  id: number
  name: string
  role_id: number
}

interface ShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenShift: (data: {
    staff_id: number
    staff_id_2?: number
    shift_type: string
    initial_cash?: number
    staff1_start_order_number: number
    staff2_start_order_number?: number
    note?: string
  }) => void
}

export function ShiftModal({ isOpen, onClose, onOpenShift }: ShiftModalProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff1, setSelectedStaff1] = useState('')
  const [selectedStaff2, setSelectedStaff2] = useState('')
  const [shiftType, setShiftType] = useState('morning')
  const [initialCash, setInitialCash] = useState('')
  const [staff1StartOrderNumber, setStaff1StartOrderNumber] = useState('')
  const [staff2StartOrderNumber, setStaff2StartOrderNumber] = useState('')
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchStaff()
    }
  }, [isOpen])

  const fetchStaff = async () => {
    try {
      setIsLoading(true)
      // URL API đã được cấu hình đúng trên backend
      const response = await fetch('/api/staff/by-role/1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Staff data loaded successfully:', data)
      setStaff(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching staff details:', error)
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStaff1) {
      alert('Vui lòng chọn nhân viên 1!')
      return
    }
    
    if (!staff1StartOrderNumber) {
      alert('Vui lòng nhập mã cuống order cho nhân viên 1!')
      return
    }
    
    try {
      const shiftData = {
        staff_id: parseInt(selectedStaff1),
        staff_id_2: selectedStaff2 ? parseInt(selectedStaff2) : undefined,
        shift_type: shiftType,
        initial_cash: initialCash ? parseFloat(initialCash) : undefined,
        staff1_start_order_number: parseInt(staff1StartOrderNumber),
        staff2_start_order_number: staff2StartOrderNumber ? parseInt(staff2StartOrderNumber) : undefined,
        note: note || undefined
      }
      
      console.log('Dữ liệu gửi đi:', JSON.stringify(shiftData))
      
      onOpenShift(shiftData)
    } catch (error) {
      console.error('Lỗi khi gửi dữ liệu:', error)
      alert('Có lỗi xảy ra khi mở ca. Vui lòng kiểm tra dữ liệu nhập vào.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Mở ca làm việc</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nhân viên 1 <span className="text-red-500">*</span>
              </label>
              {isLoading ? (
                <div className="mt-1 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              ) : (
                <select
                  value={selectedStaff1}
                  onChange={(e) => setSelectedStaff1(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  required
                >
                  <option value="">Chọn nhân viên 1</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nhân viên 2 (tùy chọn)
              </label>
              {isLoading ? (
                <div className="mt-1 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              ) : (
                <select
                  value={selectedStaff2}
                  onChange={(e) => setSelectedStaff2(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                >
                  <option value="">Không có / Chọn nhân viên 2</option>
                  {staff
                    .filter(s => s.id.toString() !== selectedStaff1)
                    .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ca làm việc <span className="text-red-500">*</span>
              </label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                required
              >
                <option value="morning">Ca sáng</option>
                <option value="afternoon">Ca chiều</option>
                <option value="evening">Ca tối</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tiền quỹ ban đầu (tùy chọn)
              </label>
              <input
                type="number"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Nhập số tiền (nếu có)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số cuống order đầu ca nhân viên 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={staff1StartOrderNumber}
                onChange={(e) => setStaff1StartOrderNumber(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                required
                placeholder="Nhập số cuống order bắt đầu cho nhân viên 1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số cuống order đầu ca nhân viên 2 (nếu có)
              </label>
              <input
                type="number"
                value={staff2StartOrderNumber}
                onChange={(e) => setStaff2StartOrderNumber(e.target.value)}
                disabled={!selectedStaff2}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Nhập số cuống order bắt đầu cho nhân viên 2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                placeholder="Ghi chú (nếu có)"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Mở ca
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}