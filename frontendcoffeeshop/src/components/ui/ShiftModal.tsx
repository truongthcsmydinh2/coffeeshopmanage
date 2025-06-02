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
    shift_type: string
    initial_cash?: number
    order_paper_count: number
  }) => void
}

export function ShiftModal({ isOpen, onClose, onOpenShift }: ShiftModalProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState('')
  const [shiftType, setShiftType] = useState('morning')
  const [initialCash, setInitialCash] = useState('')
  const [orderPaperCount, setOrderPaperCount] = useState('')
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
      const response = await fetch('http://192.168.99.166:8000/api/staff/by-role/1', {
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
    
    if (!selectedStaff) {
      alert('Vui lòng chọn nhân viên!')
      return
    }
    
    if (!orderPaperCount) {
      alert('Vui lòng nhập số cuống order!')
      return
    }
    
    try {
      const shiftData = {
        staff_id: parseInt(selectedStaff),
        shift_type: shiftType,
        initial_cash: initialCash ? parseFloat(initialCash) : undefined,
        order_paper_count: parseInt(orderPaperCount)
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
                Nhân viên
              </label>
              {isLoading ? (
                <div className="mt-1 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              ) : (
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  required
                >
                  <option value="">Chọn nhân viên</option>
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
                Ca làm việc
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
                Số cuống order bắt đầu
              </label>
              <input
                type="number"
                value={orderPaperCount}
                onChange={(e) => setOrderPaperCount(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                required
                placeholder="Nhập số cuống order bắt đầu"
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