import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaMinus, FaTrash, FaCut } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  image?: string
  group_id?: number
  code: string
}

interface MenuGroup {
  id: number
  name: string
  description?: string
}

interface OrderItem {
  id: number
  menuItemId: number
  name: string
  price: number
  quantity: number
  note: string
}

interface CurrentShift {
  id: number
  staff_id: number
  staff_id_2?: number
  staff_name: string
  staff2_name?: string
  shift_type: string
  initial_cash: number
  staff1_start_order_number: number
  staff2_start_order_number?: number
  status: string
  is_active: boolean
}

interface OrderPopupProps {
  tableId: string | number
  tableName: string
  onClose: () => void
  onOrderCreated?: () => void
}

interface MenuItemImageProps {
  code: string;
  alt: string;
  [key: string]: any;
}

function MenuItemImage({ code, alt, ...props }: MenuItemImageProps) {
  const extensions = ['jpg', 'png', 'jpeg', 'webp'];
  const [imgIndex, setImgIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState(`http://192.168.99.166:8000/image/images/${code}.${extensions[0]}`);
  const handleError = () => {
    if (imgIndex < extensions.length - 1) {
      const nextIndex = imgIndex + 1;
      setImgIndex(nextIndex);
      setImgSrc(`http://192.168.99.166:8000/image/images/${code}.${extensions[nextIndex]}`);
    } else {
      setImgSrc('/default-image.png');
    }
  };
  return <img src={imgSrc} alt={alt} onError={handleError} {...props} />;
}

export function OrderPopup({ tableId, tableName, onClose, onOrderCreated }: OrderPopupProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [currentEditingItem, setCurrentEditingItem] = useState<OrderItem | null>(null)
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(null)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [itemsToSplit, setItemsToSplit] = useState<OrderItem[]>([])
  const [isSplitting, setIsSplitting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const [printedOrder, setPrintedOrder] = useState<any>(null)

  const fetchMenu = useCallback(async () => {
    if (!isLoading) return
    
    setIsLoading(true)
    try {
      const groupsRes = await fetch('http://192.168.99.166:8000/api/menu-groups/')
      const groupsData = await groupsRes.json()
      
      if (groupsRes.ok) {
        const groups = Array.isArray(groupsData) ? groupsData : groupsData.results || []
        setMenuGroups(groups)
        if (!selectedGroupId && groups && groups.length > 0) {
          setSelectedGroupId(groups[0].id)
        }
      } else {
        console.error('Menu groups error:', groupsData)
        toast.error('Không thể tải danh sách nhóm món ăn!')
        setMenuGroups([])
      }

      const itemsRes = await fetch('http://192.168.99.166:8000/api/menu-items/?limit=1000')
      const itemsData = await itemsRes.json()
      
      if (itemsRes.ok) {
        const items = Array.isArray(itemsData) ? itemsData : itemsData.results || []
        setMenuItems(items)
      } else {
        console.error('Menu items error:', itemsData)
        toast.error('Không thể tải danh sách món ăn!')
        setMenuItems([])
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách món ăn!')
      setMenuItems([])
      setMenuGroups([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedGroupId, isLoading])

  const fetchCurrentShift = useCallback(async () => {
    try {
      const response = await fetch('http://192.168.99.166:8000/api/shifts/current', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Không thể lấy thông tin ca hiện tại')
      }
      const data = await response.json()
      setCurrentShift(data)
    } catch (error) {
      console.error('Error fetching current shift:', error)
      toast.error('Không thể lấy thông tin ca hiện tại')
    }
  }, [])

  useEffect(() => {
    fetchMenu()
    fetchCurrentShift()

    return () => {
      // Cleanup logic if needed
    }
  }, [fetchMenu, fetchCurrentShift])

  useEffect(() => {
    const handleOrderUpdate = (event: CustomEvent) => {
      const { type, order } = event.detail
      if (type === 'created') {
        onClose()
        if (onOrderCreated) onOrderCreated()
      }
    }

    window.addEventListener('orderUpdate', handleOrderUpdate as EventListener)

    return () => {
      window.removeEventListener('orderUpdate', handleOrderUpdate as EventListener)
    }
  }, [onClose, onOrderCreated])

  const filteredItems = selectedGroupId
    ? menuItems.filter((item: MenuItem) => item.group_id === selectedGroupId)
    : menuItems

  const addToOrder = (item: MenuItem) => {
    const existing = orderItems.find(o => o.menuItemId === item.id)
    if (existing) {
      updateItemQuantity(existing.id, existing.quantity + 1)
    } else {
      setOrderItems([...orderItems, {
        id: Date.now(),
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        note: ''
      }])
    }
  }

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(i => i.id !== itemId))
    } else {
      setOrderItems(orderItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i))
    }
  }

  const openNoteModal = (item: OrderItem) => {
    setCurrentEditingItem(item)
    setNoteText(item.note)
    setIsNoteModalOpen(true)
  }

  const saveNote = () => {
    if (!currentEditingItem) return
    setOrderItems(orderItems.map(i => i.id === currentEditingItem.id ? { ...i, note: noteText } : i))
    setIsNoteModalOpen(false)
    setCurrentEditingItem(null)
    setNoteText('')
  }

  const calculateTotal = () => orderItems.reduce((total, i) => total + i.price * i.quantity, 0)

  const handlePrintBill = () => {
    if (!printRef.current) return;
    
    window.print();
    
    // Xóa printedOrder ngay sau khi in
    setPrintedOrder(null);
    
    // Đóng popup sau khi in xong
    setTimeout(() => {
      onClose();
    }, 300);
  }

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món!')
      return
    }
    if (!currentShift) {
      toast.error('Không thể tạo đơn hàng vì không có ca làm việc!')
      return
    }
    try {
      const orderItemsData = orderItems.map(item => ({
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        note: item.note || ''
      }))
      const orderData = {
        table_id: Number(tableId),
        staff_id: currentShift.staff_id,
        shift_id: currentShift.id,
        status: 'pending',
        total_amount: calculateTotal(),
        discount_amount: 0,
        final_amount: calculateTotal(),
        payment_status: 'unpaid',
        note: '',
        order_code: `ORD${Date.now()}`,
        items: orderItemsData
      }
      const response = await fetch('http://192.168.99.166:8000/api/v1/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(orderData)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Có lỗi xảy ra khi tạo đơn hàng')
      }
      const data = await response.json()
      toast.success('Tạo đơn hàng thành công!')
      
      // Đóng popup sau khi tạo order thành công
      setTimeout(() => {
        onClose()
      }, 100)
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đơn hàng!')
    }
  }

  const handleSplitOrder = () => {
    if (orderItems.length < 2) {
      toast.error('Cần ít nhất 2 món để tách order!')
      return
    }
    setItemsToSplit([])
    setIsSplitModalOpen(true)
  }

  const handleToggleSplitItem = (item: OrderItem) => {
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
    if (itemsToSplit.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món để tách!')
      return
    }

    if (itemsToSplit.length === orderItems.length) {
      toast.error('Không thể tách toàn bộ món!')
      return
    }

    setIsSplitting(true)
    try {
      // Tạo order mới với các món được chọn
      const splitOrderItems = itemsToSplit.map(item => ({
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        note: item.note || ''
      }))

      const splitOrderData = {
        table_id: Number(tableId),
        staff_id: currentShift?.staff_id,
        shift_id: currentShift?.id,
        status: 'pending',
        total_amount: itemsToSplit.reduce((total, i) => total + i.price * i.quantity, 0),
        discount_amount: 0,
        final_amount: itemsToSplit.reduce((total, i) => total + i.price * i.quantity, 0),
        payment_status: 'unpaid',
        note: 'Order được tách từ order gốc',
        order_code: `ORD${Date.now()}`,
        items: splitOrderItems
      }

      const response = await fetch('http://192.168.99.166:8000/api/v1/orders/', {
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

      // Cập nhật order gốc bằng cách loại bỏ các món đã tách
      setOrderItems(prev => prev.filter(item => !itemsToSplit.find(i => i.id === item.id)))
      
      toast.success('Tách order thành công!')
      setIsSplitModalOpen(false)
      setItemsToSplit([])
    } catch (error) {
      console.error('Error splitting order:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tách order!')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-bill, .print-bill * {
            visibility: visible !important;
          }
          .print-bill {
            position: absolute !important;
            left: 0; top: 0; width: 80mm; background: white;
            z-index: 9999;
            font-family: 'Arial', 'Helvetica', 'sans-serif';
            font-size: 16px;
            padding: 10px;
          }
          .print-bill h3 {
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 16px;
            letter-spacing: 2px;
          }
          .print-bill .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 22px;
            font-weight: bold;
            margin: 10px 0;
          }
          .print-bill .item-name {
            flex: 1;
            font-size: 22px;
            font-weight: bold;
          }
          .print-bill .item-qty {
            font-size: 22px;
            font-weight: bold;
            margin-left: 16px;
          }
        }
      `}</style>
      <div className="bg-white w-screen h-screen flex flex-col rounded-none">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Order cho {tableName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Menu */}
            <div className="md:col-span-2 bg-white rounded-lg">
              <div className="flex flex-wrap gap-2 mb-4">
                {menuGroups && menuGroups.length > 0 ? (
                  menuGroups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`px-3 py-1 rounded-full text-sm ${selectedGroupId === group.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {group.name}
                    </button>
                  ))
                ) : (
                  <div className="text-gray-500">Không có nhóm món ăn nào</div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md"
                    onClick={() => addToOrder(item)}
                  >
                    <div className="h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center text-gray-400 overflow-hidden">
                      <MenuItemImage
                        code={item.code}
                        alt={item.name}
                        className="h-full w-full object-cover rounded-md"
                      />
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
                    <p className="text-primary-600 text-sm font-semibold">
                      {item.price.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Order */}
            <div className="bg-white rounded-lg">
              <div className="sticky top-0 bg-white p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Order</h2>
                  {orderItems.length >= 2 && (
                    <button
                      onClick={handleSplitOrder}
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <FaCut /> Tách order
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Chưa có món nào được chọn</p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map(item => (
                      <div key={item.id} className="border-b pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">{item.name}</h3>
                            <p className="text-primary-600 text-sm">
                              {item.price.toLocaleString('vi-VN')} ₫
                            </p>
                            {item.note && (
                              <p className="text-xs text-gray-500">Ghi chú: {item.note}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center"
                              >
                                <FaMinus className="text-xs" />
                              </button>
                              <span className="mx-1 text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center"
                              >
                                <FaPlus className="text-xs" />
                              </button>
                            </div>
                            <div className="flex mt-2 space-x-2">
                              <button
                                onClick={() => openNoteModal(item)}
                                className="text-xs text-gray-500 underline"
                              >
                                Ghi chú
                              </button>
                              <button
                                onClick={() => updateItemQuantity(item.id, 0)}
                                className="text-xs text-red-500"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="sticky bottom-0 bg-white pt-4 border-t">
                      <div className="flex justify-between font-semibold text-sm mb-4">
                        <span>Tổng tiền:</span>
                        <span>{calculateTotal().toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <button
                        onClick={handleCreateOrder}
                        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                      >
                        Tạo order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Bill content for print only */}
        {printedOrder && (
          <div className="print-bill" ref={printRef}>
            <h3>PHIẾU LÀM ĐỒ</h3>
            <div style={{marginBottom: 12}}>Bàn: {tableName}</div>
            <hr />
            {printedOrder.items && printedOrder.items.map((item: any, idx: number) => (
              <div className="item-row" key={idx}>
                <span className="item-name">{item.name || item.menu_item_name || ''}</span>
                <span className="item-qty">x{item.quantity}</span>
                {item.note && <div style={{fontSize: 14, fontWeight: 'normal', marginTop: 2}}>Ghi chú: {item.note}</div>}
              </div>
            ))}
          </div>
        )}
        {/* Split Order Modal */}
        {isSplitModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Chọn món để tách order</h3>
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {orderItems.map(item => (
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
                        {item.quantity} x {item.price.toLocaleString('vi-VN')} ₫
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
                  Tổng: {itemsToSplit.reduce((total, i) => total + i.price * i.quantity, 0).toLocaleString('vi-VN')} ₫
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
        {/* Note Modal */}
        {isNoteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-md">
              <h3 className="text-base font-semibold mb-2">Ghi chú cho {currentEditingItem?.name}</h3>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 h-24"
                placeholder="Ví dụ: Ít đá, ít đường..."
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-3 py-1 border rounded-md"
                >
                  Hủy
                </button>
                <button
                  onClick={saveNote}
                  className="px-3 py-1 bg-primary-600 text-white rounded-md"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 