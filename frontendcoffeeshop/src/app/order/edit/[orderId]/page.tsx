"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OrderForm from '@/components/order/OrderForm'

interface OrderData {
  id: string
  tableId: string
  tableName: string
  staff_id?: number
  shift_id?: number
  status?: string
  note?: string
  order_code?: string
  payment_status?: string
  items: Array<{
    id: number
    menuItemId: number
    name: string
    price: number
    quantity: number
    note: string
    total_price: number
  }>
}

export default function EditOrderPage({ params }: { params: { orderId: string } }) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/orders/${params.orderId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Data từ API:', data);
          // Group các item cùng menuItemId lại thành 1 item
          const groupedItemsMap = new Map();
          (data.items || []).forEach((item: any) => {
            const key = item.menuItemId || item.menu_item_id;
            console.log('Item từ API:', item);
            // Lấy unit_price là giá gốc của món từ menu_items
            const unitPrice = item.menu_item?.price || item.unit_price || item.price || 0;
            console.log('Unit price:', unitPrice);
            
            if (groupedItemsMap.has(key)) {
              const exist = groupedItemsMap.get(key);
              exist.quantity += item.quantity;
              // Tính lại total_price dựa trên unit_price gốc
              exist.total_price = unitPrice * exist.quantity;
              if (item.note && item.note.trim() && (!exist.note || !exist.note.includes(item.note))) {
                exist.note = exist.note ? (exist.note + "; " + item.note) : item.note;
              }
            } else {
              groupedItemsMap.set(key, {
                ...item,
                menuItemId: item.menuItemId || item.menu_item_id,
                unit_price: unitPrice,
                total_price: unitPrice * item.quantity
              });
            }
          });
          const groupedItems = Array.from(groupedItemsMap.values());
          const mappedData = {
            ...data,
            tableId: data.tableId || data.table_id?.toString() || '',
            items: groupedItems
          }
          setOrderData(mappedData)
        } else {
          alert('Không thể lấy dữ liệu order!')
          router.push('/order')
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu order:', error)
        alert('Có lỗi xảy ra khi lấy dữ liệu order. Vui lòng thử lại.')
        router.push('/order')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderData()
  }, [params.orderId, router])

  const handleSubmit = async (submitData: { tableId: string | null, items: any[] }) => {
    try {
      if (!submitData.tableId) {
        alert('Vui lòng chọn bàn!')
        return
      }
      if (!submitData.items || submitData.items.length === 0) {
        alert('Vui lòng chọn ít nhất một món!')
        return
      }
      // Lấy các trường cần thiết từ state orderData hoặc gán mặc định
      const payload = {
        table_id: Number(submitData.tableId),
        staff_id: orderData?.staff_id || 1,
        shift_id: orderData?.shift_id || 1,
        total_amount: submitData.items.reduce((sum, item) => sum + item.total_price, 0),
        status: orderData?.status || 'pending',
        note: orderData?.note || '',
        order_code: orderData?.order_code || '',
        payment_status: orderData?.payment_status || 'unpaid',
        items: submitData.items.map(item => ({
          menu_item_id: item.menuItemId || item.menu_item_id,
          quantity: item.quantity,
          // Lấy unit_price là giá gốc của món
          unit_price: item.unit_price || item.price || 0,
          // Tính total_price dựa trên unit_price gốc
          total_price: (item.unit_price || item.price || 0) * item.quantity,
          note: item.note || ''
        }))
      }
      console.log('Payload gửi lên backend:', payload);
      const response = await fetch(`/orders/${params.orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        alert('Đã cập nhật order thành công!')
        router.push('/order')
      } else {
        const errorData = await response.json()
        console.log('Lỗi backend trả về:', errorData);
        alert(`Lỗi: ${errorData.message || 'Không thể cập nhật order'}`)
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật order:', error)
      alert('Có lỗi xảy ra khi cập nhật order. Vui lòng thử lại.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Không tìm thấy dữ liệu order!</p>
      </div>
    )
  }

  return <OrderForm orderData={orderData} onSubmit={handleSubmit} />
}
