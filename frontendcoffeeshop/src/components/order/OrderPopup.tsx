import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaMinus, FaTrash, FaCut, FaSearch } from 'react-icons/fa'
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
  const [imgSrc, setImgSrc] = useState(`/image/images/${code}.${extensions[0]}`);
  const handleError = () => {
    if (imgIndex < extensions.length - 1) {
      const nextIndex = imgIndex + 1;
      setImgIndex(nextIndex);
      setImgSrc(`/image/images/${code}.${extensions[nextIndex]}`);
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [currentEditingItem, setCurrentEditingItem] = useState<OrderItem | null>(null)
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(null)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [itemsToSplit, setItemsToSplit] = useState<OrderItem[]>([])
  const [isSplitting, setIsSplitting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const [printedOrder, setPrintedOrder] = useState<any>(null)

  const fetchMenu = useCallback(async () => {
    if (!isLoading) return

    setIsLoading(true)
    try {
      const groupsRes = await fetch('/api/menu-groups/')
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

      const itemsRes = await fetch('/api/menu-items/?limit=1000')
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
      const response = await fetch('/api/shifts/current', {
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

  // Filter items based on search query and selected group
  const filteredItems = (menuItems || []).filter((item: MenuItem) => {
    const matchesSearch = searchQuery === '' ||
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))

    // Nếu có search query, tìm kiếm trên toàn bộ menu
    // Nếu không có search query, chỉ lọc theo nhóm đã chọn
    const matchesGroup = searchQuery === '' ? (!selectedGroupId || item.group_id === selectedGroupId) : true

    return matchesSearch && matchesGroup
  })

  const addToOrder = (item: MenuItem) => {
    const existing = (orderItems || []).find(o => o.menuItemId === item.id)
    if (existing) {
      updateItemQuantity(existing.id, existing.quantity + 1)
    } else {
      setOrderItems([...(orderItems || []), {
        id: Date.now(),
        menuItemId: item.id,
        name: item.name || '',
        price: item.price || 0,
        quantity: 1,
        note: ''
      }])
    }
  }

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems((orderItems || []).filter(i => i.id !== itemId))
    } else {
      setOrderItems((orderItems || []).map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i))
    }
  }

  const openNoteModal = (item: OrderItem) => {
    setCurrentEditingItem(item)
    setNoteText(item.note || '')
    setIsNoteModalOpen(true)
  }

  const saveNote = () => {
    if (currentEditingItem) {
      setOrderItems((orderItems || []).map(i => i.id === currentEditingItem.id ? { ...i, note: noteText } : i))
    }
    setIsNoteModalOpen(false)
  }

  const calculateTotal = () => (orderItems || []).reduce((total, i) => total + (i.price || 0) * (i.quantity || 0), 0)

  const handlePrintBill = () => {
    setPrintedOrder({
      tableName,
      items: orderItems
    })
    setTimeout(() => {
      if (printRef.current) {
        window.print()
      }
    }, 100)
  }

  const handleCreateOrder = async () => {
    if (isCreating) return

    if (!orderItems || orderItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món!')
      return
    }

    if (!currentShift) {
      toast.error('Không thể lấy thông tin ca hiện tại!')
      return
    }

    setIsCreating(true)
    try {
      // Tạo order data theo format của backend
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
        items: (orderItems || []).map(item => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity || 0,
          unit_price: item.price || 0,
          total_price: (item.price || 0) * (item.quantity || 0),
          note: item.note || ''
        }))
      }

      console.log('Sending order data:', orderData)

      const response = await fetch('/api/v1/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Tạo order thành công!')

        // Print bill
        handlePrintBill()

        // Close popup and refresh
        onClose()
        if (onOrderCreated) onOrderCreated()

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('orderUpdate', {
          detail: { type: 'created', order: result }
        }))
      } else {
        const errorData = await response.json()
        console.error('Order creation error:', errorData)

        // Hiển thị chi tiết lỗi
        let errorMessage = 'Không thể tạo order!'
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ')
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          }
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Có lỗi xảy ra khi tạo order!')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSplitOrder = () => {
    setItemsToSplit([])
    setIsSplitModalOpen(true)
  }

  const handleToggleSplitItem = (item: OrderItem) => {
    setItemsToSplit(prev =>
      (prev || []).some(i => i.id === item.id)
        ? (prev || []).filter(i => i.id !== item.id)
        : [...(prev || []), item]
    )
  }

  const handleConfirmSplit = async () => {
    if (!itemsToSplit || itemsToSplit.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món để tách!')
      return
    }

    setIsSplitting(true)
    try {
      // Create new order with split items theo format của backend
      const splitOrderData = {
        table_id: Number(tableId),
        staff_id: currentShift?.staff_id,
        shift_id: currentShift?.id,
        status: 'pending',
        total_amount: (itemsToSplit || []).reduce((total, i) => total + (i.price || 0) * (i.quantity || 0), 0),
        discount_amount: 0,
        final_amount: (itemsToSplit || []).reduce((total, i) => total + (i.price || 0) * (i.quantity || 0), 0),
        payment_status: 'unpaid',
        note: 'Order được tách từ order gốc',
        order_code: `ORD${Date.now()}`,
        items: (itemsToSplit || []).map(item => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity || 0,
          unit_price: item.price || 0,
          total_price: (item.price || 0) * (item.quantity || 0),
          note: item.note || ''
        }))
      }

      console.log('Sending split order data:', splitOrderData)

      const response = await fetch('/api/v1/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(splitOrderData),
      })

      if (response.ok) {
        // Remove split items from current order
        setOrderItems((orderItems || []).filter(item => !(itemsToSplit || []).some(splitItem => splitItem.id === item.id)))
        toast.success('Tách order thành công!')
        setIsSplitModalOpen(false)
      } else {
        const errorData = await response.json()
        console.error('Split order error:', errorData)

        // Hiển thị chi tiết lỗi
        let errorMessage = 'Không thể tách order!'
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ')
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          }
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error splitting order:', error)
      toast.error('Có lỗi xảy ra khi tách order!')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <style jsx global>{`
        @media print {
          .print-bill {
            display: block !important;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.4;
            padding: 20px;
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

        <div className="flex-1 flex overflow-hidden">
          {/* Menu Section - Scrollable */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white rounded-lg">
              {/* Search Box */}
              <div className="mb-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm món ăn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedGroupId(null)}
                  className={`px-3 py-1 rounded-full text-sm ${!selectedGroupId ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                  Tất cả
                </button>
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

              {/* Search Status */}
              {searchQuery && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🔍 Đang tìm kiếm "{searchQuery}" trên toàn bộ menu...
                  </p>
                </div>
              )}

              {/* Menu Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems && filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToOrder(item)}
                  >
                    <div className="h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center text-gray-400 overflow-hidden">
                      <MenuItemImage
                        code={item.code || ''}
                        alt={item.name || ''}
                        className="h-full w-full object-cover rounded-md"
                      />
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name || 'Không có tên'}</h3>
                    <p className="text-primary-600 text-sm font-semibold">
                      {(item.price || 0).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                ))}
              </div>

              {(!filteredItems || filteredItems.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? `Không tìm thấy món ăn nào phù hợp với "${searchQuery}"` : 'Không có món ăn nào'}
                </div>
              )}
            </div>
          </div>

          {/* Order Section - Fixed */}
          <div className="w-80 bg-white border-l flex flex-col">
            <div className="p-4 border-b bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Order</h2>
                {orderItems && orderItems.length >= 2 && (
                  <button
                    onClick={handleSplitOrder}
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <FaCut /> Tách order
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {(!orderItems || orderItems.length === 0) ? (
                <p className="text-gray-500 text-center py-8">Chưa có món nào được chọn</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map(item => (
                    <div key={item.id} className="border-b pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm">{item.name || 'Không có tên'}</h3>
                          <p className="text-primary-600 text-sm">
                            {(item.price || 0).toLocaleString('vi-VN')} ₫
                          </p>
                          {item.note && (
                            <p className="text-xs text-gray-500">Ghi chú: {item.note}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateItemQuantity(item.id, (item.quantity || 0) - 1)}
                              className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300"
                            >
                              <FaMinus className="text-xs" />
                            </button>
                            <span className="mx-1 text-sm">{item.quantity || 0}</span>
                            <button
                              onClick={() => updateItemQuantity(item.id, (item.quantity || 0) + 1)}
                              className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>
                          <div className="flex mt-2 space-x-2">
                            <button
                              onClick={() => openNoteModal(item)}
                              className="text-xs text-gray-500 underline hover:text-gray-700"
                            >
                              Ghi chú
                            </button>
                            <button
                              onClick={() => updateItemQuantity(item.id, 0)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fixed Bottom Section */}
            <div className="p-4 border-t bg-white">
              <div className="flex justify-between font-semibold text-sm mb-4">
                <span>Tổng tiền:</span>
                <span>{calculateTotal().toLocaleString('vi-VN')} ₫</span>
              </div>
              <button
                onClick={handleCreateOrder}
                disabled={(!orderItems || orderItems.length === 0) || isCreating}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Đang tạo...' : 'Tạo order'}
              </button>
            </div>
          </div>
        </div>

        {/* Bill content for print only */}
        {printedOrder && (
          <div className="print-bill" ref={printRef}>
            <h3>PHIẾU LÀM ĐỒ</h3>
            <div style={{ marginBottom: 12 }}>Bàn: {tableName}</div>
            <hr />
            {printedOrder.items && printedOrder.items.map((item: any, idx: number) => (
              <div className="item-row" key={idx}>
                <span className="item-name">{item.name || item.menu_item_name || ''}</span>
                <span className="item-qty">x{item.quantity}</span>
                {item.note && <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 2 }}>Ghi chú: {item.note}</div>}
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
                {orderItems && orderItems.map(item => (
                  <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={itemsToSplit && itemsToSplit.some(i => i.id === item.id)}
                      onChange={() => handleToggleSplitItem(item)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name || 'Không có tên'}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity || 0} x {(item.price || 0).toLocaleString('vi-VN')} ₫
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
                  Đã chọn {itemsToSplit ? itemsToSplit.length : 0} món
                </span>
                <span className="font-medium">
                  Tổng: {(itemsToSplit || []).reduce((total, i) => total + (i.price || 0) * (i.quantity || 0), 0).toLocaleString('vi-VN')} ₫
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
              <h3 className="text-base font-semibold mb-2">Ghi chú cho {currentEditingItem?.name || 'món này'}</h3>
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