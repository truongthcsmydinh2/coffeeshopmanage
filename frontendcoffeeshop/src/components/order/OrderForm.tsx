'use client'

import { useState, useEffect, useRef } from 'react'
import { FaArrowLeft, FaShoppingCart, FaPlus, FaMinus, FaTrash } from 'react-icons/fa'
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
  total_price: number
  unit_price?: number
  price?: number
  quantity: number
  note: string
}

interface OrderFormProps {
  orderData?: {
    id?: string
    tableId?: string
    tableName?: string
    items?: OrderItem[]
  }
  onSubmit: (orderData: { tableId: string | null, items: OrderItem[] }) => void
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

export default function OrderForm({ orderData, onSubmit }: OrderFormProps) {
  const [tableId, setTableId] = useState<string | null>(orderData?.tableId || null)
  const [tableName, setTableName] = useState<string | null>(orderData?.tableName || null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>(orderData?.items || [])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [currentEditingItem, setCurrentEditingItem] = useState<OrderItem | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellingItem, setCancellingItem] = useState<OrderItem | null>(null)
  const printRef = useRef<HTMLDivElement>(null);
  const [showPrintBill, setShowPrintBill] = useState(false);

  useEffect(() => {
    fetchMenu()
  }, [])

  useEffect(() => {
    if (orderData?.tableId) {
      setTableId(orderData.tableId);
    }
  }, [orderData?.tableId]);

  const fetchMenu = async () => {
    setIsLoading(true)
    try {
      // Lấy danh sách nhóm menu
      const groupsRes = await fetch('/api/menu-groups/')
      const groupsData = await groupsRes.json()
      
      if (groupsRes.ok) {
        const groups = Array.isArray(groupsData) ? groupsData : groupsData.results || []
        setMenuGroups(groups)
        if (groups && groups.length > 0) setSelectedGroupId(groups[0].id)
      } else {
        toast.error('Không thể tải danh sách nhóm món ăn!')
        setMenuGroups([])
      }

      // Lấy danh sách món ăn
      const itemsRes = await fetch('/api/menu-items/?limit=1000')
      const itemsData = await itemsRes.json()
      
      if (itemsRes.ok) {
        const items = Array.isArray(itemsData) ? itemsData : itemsData.results || []
        setMenuItems(items)
      } else {
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
  }

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
        unit_price: item.price,
        total_price: item.price,
        quantity: 1,
        note: ''
      }])
    }
  }

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(i => i.id !== itemId))
    } else {
      setOrderItems(orderItems.map(i => {
        if (i.id === itemId) {
          const price = i.unit_price || i.price || 0;
          return { 
            ...i, 
            quantity: newQuantity,
            total_price: price * newQuantity
          }
        }
        return i;
      }))
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

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const price = Number(item.unit_price || item.price || 0)
      return total + (price * item.quantity)
    }, 0)
  }

  const openCancelModal = (item: OrderItem) => {
    setCancellingItem(item)
    setCancelReason('')
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancellingItem || !cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy!')
      return
    }
    try {
      await fetch('/api/v1/cancelled-items/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderData?.id,
          table_id: orderData?.tableId,
          item_id: cancellingItem.menuItemId,
          item_name: cancellingItem.name,
          quantity: cancellingItem.quantity,
          reason: cancelReason,
          cancelled_by: null,
          cancelled_at: new Date().toISOString()
        })
      })
      setOrderItems(orderItems.filter(i => i.id !== cancellingItem.id))
      setIsCancelModalOpen(false)
      setCancellingItem(null)
      setCancelReason('')
      toast.success('Đã hủy món và lưu lý do!')
    } catch (err) {
      toast.error('Lỗi khi lưu lý do hủy món!')
    }
  }

  const handleSubmit = async () => {
    let submitTableId = tableId;
    if (orderData?.id) {
      submitTableId = orderData.tableId ?? null;
    }
    if (!submitTableId && !orderData?.id) {
      toast.error('Vui lòng chọn bàn!');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món!');
      return;
    }

    try {
      const orderItemsData = orderItems.map(item => ({
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.unit_price || item.price || 0,
        total_price: (item.unit_price || item.price || 0) * item.quantity,
        note: item.note || ''
      }));

      if (orderData?.id) {
        // Update order
        const updateData = {
          table_id: Number(submitTableId),
          staff_id: 1, // TODO: Lấy từ context hoặc state
          status: 'pending',
          total_amount: calculateTotal(),
          payment_status: 'unpaid',
          note: '',
          items: orderItemsData
        };

        console.log('Update payload:', updateData); // Log để debug

        const response = await fetch(`/api/v1/orders/${orderData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Có lỗi xảy ra khi cập nhật đơn hàng');
        }

        toast.success('Cập nhật đơn hàng thành công!');
        setTimeout(() => {
          window.location.href = '/order';
        }, 500);
      } else {
        // Create new order
        const newOrderData = {
          table_id: Number(submitTableId),
          staff_id: 1, // TODO: Lấy từ context hoặc state
          shift_id: 1, // TODO: Lấy từ context hoặc state
          status: 'pending',
          total_amount: calculateTotal(),
          payment_status: 'unpaid',
          note: '',
          items: orderItemsData
        };
        onSubmit({ tableId: submitTableId, items: orderItems });
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý đơn hàng!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center text-gray-700"
        >
          <FaArrowLeft className="mr-2" /> Quay lại
        </button>
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">
            {orderData?.id ? 'Chỉnh sửa Order' : 'Tạo Order Mới'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Menu */}
        <div className="md:col-span-2 bg-white rounded-lg p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {menuGroups && menuGroups.length > 0 ? (
              menuGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedGroupId === group.id 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
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
            <h2 className="text-lg font-semibold">Order</h2>
          </div>
          <div className="p-4">
            {orderData?.id ? (
              <div className="mb-4">
                <label className="block font-semibold mb-1">Bàn:</label>
                <div className="p-2 border rounded bg-gray-100">{orderData.tableName || orderData.tableId}</div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block font-semibold mb-1">Chọn bàn:</label>
                <input
                  type="text"
                  value={tableId || ''}
                  onChange={e => setTableId(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Nhập ID bàn hoặc chọn bàn..."
                />
              </div>
            )}
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
                          {(item.unit_price || item.price || 0).toLocaleString('vi-VN')} ₫
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
                            onClick={() => openCancelModal(item)}
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
                    onClick={handleSubmit}
                    className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                  >
                    {orderData?.id ? 'Cập nhật Order' : 'Tạo Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h3 className="text-base font-semibold mb-2">Lý do hủy món: {cancellingItem?.name}</h3>
            <select
              className="w-full border rounded mb-2 p-2"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            >
              <option value="">Chọn lý do...</option>
              <option value="Khách đổi ý">Khách đổi ý</option>
              <option value="Hết hàng">Hết hàng</option>
              <option value="Làm nhầm">Làm nhầm</option>
              <option value="Khác">Khác...</option>
            </select>
            <textarea
              className="w-full border rounded p-2 mb-2"
              placeholder="Nhập chi tiết lý do (nếu cần)"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3 py-1 border rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3 py-1 bg-red-600 text-white rounded-md"
              >
                Xác nhận hủy món
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintBill && (
        <div className="print-bill" ref={printRef}>
          <h3>PHIẾU LÀM ĐỒ</h3>
          <div style={{marginBottom: 12}}>Bàn: {orderData?.tableName || orderData?.tableId || tableId}</div>
          <hr />
          {orderItems.map((item, idx) => (
            <div className="item-row" key={idx}>
              <span className="item-name">{item.name}</span>
              <span className="item-qty">x{item.quantity}</span>
              {item.note && <div style={{fontSize: 14, fontWeight: 'normal', marginTop: 2}}>Ghi chú: {item.note}</div>}
            </div>
          ))}
        </div>
      )}

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
    </div>
  )
} 