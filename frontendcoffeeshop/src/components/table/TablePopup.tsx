import { useState, useEffect } from 'react'
import { FaTimes, FaExchangeAlt, FaArrowRight, FaInfoCircle } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

interface TablePopupProps {
  table: {
    id: number
    name: string
    status: string
    capacity: number
    current_order?: {
      id: number
      items: any[]
      total_amount: number
      time_in: string
    }
  }
  onClose: () => void
  onRefresh: () => void
}

export default function TablePopup({ table, onClose, onRefresh }: TablePopupProps) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [newTableId, setNewTableId] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [availableTables, setAvailableTables] = useState<{id: number, name: string}[]>([])

  useEffect(() => {
    // Lấy danh sách bàn trống
    const fetchAvailableTables = async () => {
      try {
        const response = await fetch('/api/tables/?status=available')
        const data = await response.json()
        if (response.ok) {
          setAvailableTables(data)
        }
      } catch (error) {
        console.error('Error fetching available tables:', error)
      }
    }

    if (isTransferModalOpen) {
      fetchAvailableTables()
    }
  }, [isTransferModalOpen])

  const handleTransferTable = async () => {
    if (!table.current_order?.id) {
      toast.error('Không có order để chuyển bàn!')
      return
    }

    if (!newTableId) {
      toast.error('Vui lòng chọn bàn mới!')
      return
    }

    try {
      const response = await fetch(`/api/v1/orders/${table.current_order.id}/transfer-table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          new_table_id: Number(newTableId),
          note: transferNote
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Có lỗi xảy ra khi chuyển bàn')
      }

      toast.success('Chuyển bàn thành công!')
      setIsTransferModalOpen(false)
      setNewTableId('')
      setTransferNote('')
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Error transferring table:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi chuyển bàn!')
    }
  }

  if (isTransferModalOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {console.log('Overlay click'); onClose();}}>
        <div 
          className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl transform transition-all"
          onClick={e => {console.log('Modal click'); e.stopPropagation();}}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Chuyển bàn</h3>
            <button 
              onClick={() => {
                setIsTransferModalOpen(false)
                setNewTableId('')
                setTransferNote('')
              }} 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200 items-stretch lg:items-center justify-between">
              <div className="flex items-center min-w-0 w-auto">
                <div className="bg-yellow-100 p-2 rounded-lg flex-shrink-0">
                  <FaExchangeAlt className="text-yellow-600" size={20} />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Từ bàn</p>
                  <p className="font-medium text-gray-900 truncate">Bàn {table.name}</p>
                </div>
              </div>
              <div className="flex justify-center items-center py-1 lg:py-0">
                <FaArrowRight className="text-gray-400 text-xl" />
              </div>
              <div className="flex items-center min-w-0 w-auto flex-1">
                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                  <FaExchangeAlt className="text-green-600" size={20} />
                </div>
                <div className="ml-2 w-full min-w-0">
                  <p className="text-xs text-gray-600 truncate">Đến bàn</p>
                  <select
                    value={newTableId}
                    onChange={(e) => setNewTableId(e.target.value)}
                    className="mt-1 block w-full pl-2 pr-6 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-lg"
                  >
                    <option value="">Chọn bàn...</option>
                    {availableTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Bàn {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-start">
                <FaInfoCircle className="text-yellow-500 mt-1 mr-2" />
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    placeholder="Nhập ghi chú cho việc chuyển bàn..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsTransferModalOpen(false)
                  setNewTableId('')
                  setTransferNote('')
                }}
                className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleTransferTable}
                className="px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
              >
                Xác nhận chuyển bàn
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  // Nếu không phải modal chuyển bàn thì render popup chính
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {console.log('Overlay click'); onClose();}}>
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all"
        onClick={e => {console.log('Modal click'); e.stopPropagation();}}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Thông tin bàn {table.name}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <p className="font-medium text-gray-900">
                  {table.status === 'available' ? 'Trống' : 'Đang sử dụng'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sức chứa</p>
                <p className="font-medium text-gray-900">{table.capacity} người</p>
              </div>
            </div>
          </div>

          {table.current_order && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order hiện tại</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ID Order</span>
                  <span className="font-medium text-gray-900">#{table.current_order.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng tiền</span>
                  <span className="font-medium text-gray-900">
                    {table.current_order.total_amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Thời gian vào</span>
                  <span className="font-medium text-gray-900">
                    {new Date(table.current_order.time_in).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Danh sách món</p>
                  <div className="max-h-40 overflow-y-auto bg-white rounded-lg p-3">
                    {table.current_order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-gray-900">{item.name}</span>
                        <span className="text-gray-600">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {table.current_order && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center px-4 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <FaExchangeAlt className="mr-2" />
                Chuyển bàn
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 