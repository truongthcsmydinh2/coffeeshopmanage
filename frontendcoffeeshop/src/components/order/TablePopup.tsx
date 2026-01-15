'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { TableGrid } from './TableGrid'
import { OrderPopup } from './OrderPopup'
import { FaCut } from 'react-icons/fa'

interface Order {
  id: string
  totalAmount: number
  time_in: string
  status: string
}

interface OrderDetailItem {
  id: number
  menu_item_id: number
  name: string
  quantity: number
  unit_price: number
  total_price: number
  note?: string
}

interface TablePopupProps {
  table: {
    id: string | number
    name: string
    status: 'empty' | 'occupied'
    orders: Order[]
  }
  onClose: () => void
  onStatusChange: (newStatus: 'empty' | 'occupied') => void
}

export function TablePopup({ table, onClose, onStatusChange }: TablePopupProps) {
  const router = useRouter()
  const [showTableSelect, setShowTableSelect] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [transferNote, setTransferNote] = useState('')
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [selectedMergeOrders, setSelectedMergeOrders] = useState<string[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isSplitting, setIsSplitting] = useState(false)
  const [splitOrderItems, setSplitOrderItems] = useState<OrderDetailItem[]>([])
  const [itemsToSplit, setItemsToSplit] = useState<OrderDetailItem[]>([])

  const handleMoveTable = async () => {
    const pendingOrders = table.orders?.filter(order => order.status === 'pending') || [];
    if (pendingOrders.length === 0) {
      toast.error('Không có order đang chờ xử lý để chuyển bàn!');
      return;
    }
    let orderId = '';
    if (pendingOrders.length === 1) {
      orderId = pendingOrders[0].id;
    } else {
      const orderList = pendingOrders.map(o => `#${o.id}`).join(', ');
      orderId = prompt(`Bàn này có nhiều order đang chờ xử lý (${orderList}). Nhập ID order muốn chuyển:`) || '';
      if (!pendingOrders.some(o => o.id === orderId)) {
        toast.error('Order không hợp lệ!');
        return;
      }
    }
    setSelectedOrderId(orderId)
    setShowTableSelect(true)
  }

  const handleTableClick = (tableId: number) => {
    setSelectedTableId(tableId.toString())
  }

  const handleConfirmTransfer = () => {
    if (!selectedTableId) {
      toast.error('Vui lòng chọn bàn mới!')
      return
    }
    fetch(`/api/v1/orders/${selectedOrderId}/transfer-table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        new_table_id: Number(selectedTableId),
        note: transferNote || ''
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => Promise.reject(err))
      }
      toast.success('Chuyển bàn thành công!')
      setShowTableSelect(false)
      setSelectedTableId('')
      setTransferNote('')
      onStatusChange('empty')
      onClose()
    })
    .catch(error => {
      console.error('Error transferring table:', error)
      toast.error(error.detail || 'Có lỗi xảy ra khi chuyển bàn!')
    })
  }

  const handleAction = (action: string, orderId?: string) => {
    switch (action) {
      case 'merge':
        alert('Chức năng ghép bàn đang được phát triển')
        onClose()
        break
      case 'split':
        if (orderId) {
          handleSplitOrder(table.orders.find(o => o.id === orderId) as Order)
        }
        break
      case 'move':
        if (!orderId) {
          toast.error('Không có order để chuyển bàn!')
          return
        }
        const newTableId = prompt('Nhập ID bàn mới:')
        if (!newTableId) return
        
        const note = prompt('Nhập ghi chú (tùy chọn):')
        
        fetch(`/api/v1/orders/${orderId}/transfer-table`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify({
            new_table_id: Number(newTableId),
            note: note || ''
          })
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err))
          }
          toast.success('Chuyển bàn thành công!')
          onStatusChange('empty')
          onClose()
        })
        .catch(error => {
          console.error('Error transferring table:', error)
          toast.error(error.detail || 'Có lỗi xảy ra khi chuyển bàn!')
        })
        onClose()
        break
      case 'edit':
        if (orderId) {
          router.push(`/order/edit/${orderId}`)
        }
        onClose()
        break
      case 'payment':
        if (orderId) {
          router.push(`/payment/${orderId}`)
        }
        onClose()
        break
      case 'print':
        alert('Chức năng in tạm tính đang được phát triển')
        onClose()
        break
    }
  }

  const handleOpenMerge = () => {
    setSelectedMergeOrders([])
    setShowMergeModal(true)
  }

  const handleToggleMergeOrder = (orderId: string) => {
    setSelectedMergeOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleConfirmMerge = async () => {
    setIsMerging(true)
    try {
      const res = await fetch('/api/orders/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: selectedMergeOrders.map(Number) })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Gộp order thành công!')
        setShowMergeModal(false)
        setIsMerging(false)
        if (onStatusChange) onStatusChange('occupied')
      } else {
        toast.error('Gộp order thất bại!')
        setIsMerging(false)
      }
    } catch (err) {
      toast.error('Lỗi khi gộp order!')
      setIsMerging(false)
    }
  }

  const handleSplitOrder = async (order: Order) => {
    setSelectedOrder(order)
    setIsSplitModalOpen(true)
    setItemsToSplit([])
    // Lấy chi tiết order
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/`)
      if (!res.ok) throw new Error('Không thể lấy chi tiết order')
      const data = await res.json()
      // data.items là danh sách món
      setSplitOrderItems(data.items.map((item: any) => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        name: item.name || item.menu_item_name || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        note: item.note || ''
      })))
    } catch (err) {
      toast.error('Không thể lấy chi tiết order!')
      setSplitOrderItems([])
    }
  }

  const handleToggleSplitItem = (item: OrderDetailItem) => {
    setItemsToSplit(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.filter(i => i.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }

  const handleConfirmSplit = async () => {
    if (!selectedOrder) return
    if (itemsToSplit.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món để tách!')
      return
    }
    if (itemsToSplit.length === splitOrderItems.length) {
      toast.error('Không thể tách toàn bộ món!')
      return
    }
    setIsSplitting(true)
    try {
      // Tạo order mới với các món được chọn
      const splitOrderData = {
        table_id: table.id,
        staff_id: null, // sẽ lấy từ order gốc phía dưới
        shift_id: null,
        status: 'pending',
        total_amount: itemsToSplit.reduce((total, i) => total + i.unit_price * i.quantity, 0),
        discount_amount: 0,
        final_amount: itemsToSplit.reduce((total, i) => total + i.unit_price * i.quantity, 0),
        payment_status: 'unpaid',
        note: 'Order được tách từ order gốc',
        order_code: `ORD${Date.now()}`,
        items: itemsToSplit.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          note: item.note || ''
        }))
      }
      // Lấy lại chi tiết order để lấy staff_id, shift_id
      const orderRes = await fetch(`/api/v1/orders/${selectedOrder.id}/`)
      const orderData = await orderRes.json()
      splitOrderData.staff_id = orderData.staff_id
      splitOrderData.shift_id = orderData.shift_id
      // Tạo order mới
      const response = await fetch('/api/v1/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(splitOrderData)
      })
      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi tách order')
      }
      // Cập nhật order gốc bằng cách giảm số lượng hoặc xóa món đã tách
      const updatedItems = splitOrderItems.map(item => {
        const splitItem = itemsToSplit.find(i => i.id === item.id)
        if (!splitItem) return item // không tách món này
        if (splitItem.quantity >= item.quantity) {
          // tách hết số lượng, loại khỏi order gốc
          return null
        }
        // tách một phần, giảm số lượng ở order gốc
        return {
          ...item,
          quantity: item.quantity - splitItem.quantity,
          total_price: item.unit_price * (item.quantity - splitItem.quantity)
        }
      }).filter((item): item is OrderDetailItem => item !== null)
      await fetch(`/api/v1/orders/${selectedOrder.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          table_id: table.id,
          staff_id: orderData.staff_id,
          shift_id: orderData.shift_id,
          status: orderData.status,
          total_amount: updatedItems.reduce((total, i) => total + i.unit_price * i.quantity, 0),
          final_amount: updatedItems.reduce((total, i) => total + i.unit_price * i.quantity, 0),
          payment_status: orderData.payment_status,
          note: orderData.note,
          order_code: orderData.order_code,
          items: updatedItems.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
            note: item.note || ''
          }))
        })
      })
      toast.success('Tách order thành công!')
      setIsSplitModalOpen(false)
      setSelectedOrder(null)
      setSplitOrderItems([])
      setItemsToSplit([])
    onClose()
    } catch (error) {
      console.error('Error splitting order:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tách order!')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{table.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div>
            <p className="text-gray-600">Trạng thái:</p>
            <p className={`font-medium ${table.status === 'occupied' ? 'text-red-600' : 'text-green-600'}`}>
              {table.status === 'occupied' ? 'Đang sử dụng' : 'Trống'}
            </p>
          </div>

          {table.orders && table.orders.length > 0 && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <p className="text-gray-600">Danh sách order:</p>
              <div className="overflow-y-auto flex-1 pr-2">
                {table.orders.map((order) => {
                  console.log('Order data:', order);
                  return (
                    <div key={order.id} className="border rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-red-500">
                            {order.time_in ? new Date(order.time_in).toLocaleDateString('vi-VN') : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.time_in ? new Date(order.time_in).toLocaleTimeString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {order.status === 'pending' ? 'Chờ xử lý' : 'Đang phục vụ'}
                        </span>
                      </div>
                      <p className="text-primary-600 font-medium">
                        {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAction('edit', order.id)}
                          className="flex-1 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleAction('payment', order.id)}
                          className="flex-1 px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-sm"
                        >
                          Thanh toán
                        </button>
                        { (order.status === 'active' || order.status === 'pending') && (
                          <button
                            onClick={() => handleAction('split', order.id)}
                            className="flex-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm flex items-center justify-center gap-1"
                          >
                            <FaCut className="text-xs" /> Tách
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                className="w-full mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                onClick={() => setShowCreateOrder(true)}
              >
                + Tạo order mới
              </button>
              {table.orders.length > 1 && (
                <button
                  className="w-full mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  onClick={handleOpenMerge}
                >
                  Gộp order
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={handleMoveTable}
              className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Chuyển bàn
            </button>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {showTableSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-5xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Chọn bàn mới trên sơ đồ</h3>
            <div className="mb-4" style={{ minWidth: 1200, minHeight: 650, overflow: 'auto' }}>
              <TableGrid selectMode={true} onTableSelect={handleTableClick} selectedTableId={selectedTableId} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
              <textarea
                value={transferNote}
                onChange={e => setTransferNote(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Nhập ghi chú cho việc chuyển bàn..."
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowTableSelect(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmTransfer}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                Xác nhận chuyển bàn
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateOrder && (
        <OrderPopup
          tableId={table.id}
          tableName={table.name}
          onClose={() => setShowCreateOrder(false)}
          onOrderCreated={() => {
            setShowCreateOrder(false)
            if (typeof window !== 'undefined') window.location.reload()
          }}
        />
      )}

      {showMergeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Chọn order để gộp</h3>
            <div className="space-y-2 mb-4">
              {table.orders.map(order => (
                <label key={order.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMergeOrders.includes(order.id)}
                    onChange={() => handleToggleMergeOrder(order.id)}
                  />
                  <span>Order #{order.id} - {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                disabled={isMerging}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmMerge}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                disabled={isMerging}
              >
                {isMerging ? 'Đang gộp...' : 'Xác nhận gộp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Order Modal */}
      {isSplitModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Chọn món để tách order</h3>
            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {splitOrderItems.map(item => (
                <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={itemsToSplit.some(i => i.id === item.id)}
                    onChange={() => handleToggleSplitItem(item)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x {item.unit_price.toLocaleString('vi-VN')} ₫
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-500">Ghi chú: {item.note}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                Đã chọn {itemsToSplit.length} món
              </span>
              <span className="font-medium">
                Tổng: {itemsToSplit.reduce((total, i) => total + i.unit_price * i.quantity, 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                disabled={isSplitting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSplit}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                disabled={isSplitting}
              >
                {isSplitting ? 'Đang tách...' : 'Xác nhận tách'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}