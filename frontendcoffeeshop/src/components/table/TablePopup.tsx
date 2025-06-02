import { useState, useEffect } from 'react'
import { FaTimes, FaExchangeAlt } from 'react-icons/fa'
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
        const response = await fetch('http://192.168.99.166:8000/api/tables/?status=available')
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
      const response = await fetch(`http://192.168.99.166:8000/api/v1/orders/${table.current_order.id}/transfer-table`, {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Thông tin bàn {table.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Trạng thái:</p>
            <p className="font-medium">
              {table.status === 'available' ? 'Trống' : 'Đang sử dụng'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Sức chứa:</p>
            <p className="font-medium">{table.capacity} người</p>
          </div>

          {table.current_order && (
            <div>
              <p className="text-sm text-gray-600">Order hiện tại:</p>
              <div className="mt-2 space-y-2">
                <p className="font-medium">ID: {table.current_order.id}</p>
                <p className="font-medium">
                  Tổng tiền: {table.current_order.total_amount.toLocaleString('vi-VN')} ₫
                </p>
                <p className="font-medium">
                  Thời gian vào: {new Date(table.current_order.time_in).toLocaleTimeString('vi-VN')}
                </p>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Danh sách món:</p>
                  <div className="max-h-40 overflow-y-auto">
                    {table.current_order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <span>{item.name}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            {table.current_order && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                <FaExchangeAlt className="mr-2" />
                Chuyển bàn
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Table Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Chuyển bàn</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn bàn mới
                </label>
                <select
                  value={newTableId}
                  onChange={(e) => setNewTableId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Chọn bàn...</option>
                  {availableTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Bàn {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Nhập ghi chú cho việc chuyển bàn..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsTransferModalOpen(false)
                    setNewTableId('')
                    setTransferNote('')
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleTransferTable}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                >
                  Xác nhận chuyển bàn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 