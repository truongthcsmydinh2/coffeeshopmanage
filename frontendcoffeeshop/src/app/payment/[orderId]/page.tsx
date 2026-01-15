"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface OrderItem {
  id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  total_price: number
  name?: string
}

interface Order {
  id: string
  table_id: number
  total_amount: number
  status: string
  time_in?: string
  staff_id?: number
  items: OrderItem[]
}

const paymentMethods = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank', label: 'Chuyển khoản' },
  { value: 'other', label: 'Khác' },
]

export default function Page({ params }: { params: { orderId: string } }) {
  const { orderId } = params
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerPaid, setCustomerPaid] = useState('')
  const [change, setChange] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Order items from API:', data.items)
        setOrder({
          id: data.id,
          table_id: data.table_id,
          total_amount: data.total_amount || data.totalAmount || 0,
          status: data.status,
          time_in: data.time_in,
          staff_id: data.staff_id,
          items: data.items?.map((item: any) => ({
            id: item.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            name: item.name || ''
          })) || []
        })
      } else {
        toast.error('Không tìm thấy order!')
        router.push('/order')
      }
    } catch (err) {
      toast.error('Lỗi khi tải thông tin order!')
      router.push('/order')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (customerPaid && isNaN(Number(customerPaid))) {
      toast.error('Vui lòng nhập số tiền khách đưa hợp lệ!')
      return
    }
    if (customerPaid && Number(customerPaid) < (order?.total_amount || 0)) {
      toast.error('Số tiền khách đưa chưa đủ!')
      return
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
      })
      const data = await res.json()
      console.log('[PAYMENT] Kết quả thanh toán:', data)
      if (res.ok) {
        toast.success('Thanh toán thành công!')
        setTimeout(() => router.push('/order'), 1500)
      } else {
        toast.error(data.detail || 'Thanh toán thất bại!')
      }
    } catch (err) {
      console.error('[PAYMENT] Lỗi khi gọi API thanh toán:', err)
      toast.error('Lỗi khi gọi API thanh toán!')
    }
  }

  useEffect(() => {
    if (order && customerPaid) {
      const paid = Number(customerPaid)
      if (!isNaN(paid)) {
        setChange(paid - order.total_amount)
      } else {
        setChange(null)
      }
    } else {
      setChange(null)
    }
  }, [customerPaid, order])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải...</div>
  }

  if (!order) return null

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Thanh toán Order</h1>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div><span className="font-semibold">Mã Order:</span> {order.id}</div>
        <div><span className="font-semibold">Bàn:</span> {order.table_id}</div>
        <div><span className="font-semibold">Thời gian:</span> {order.time_in ? new Date(order.time_in).toLocaleString('vi-VN') : '-'}</div>
        <div><span className="font-semibold">Trạng thái:</span> <span className="capitalize">{order.status}</span></div>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Danh sách món</h2>
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">Tên món</th>
              <th className="px-2 py-1 border">SL</th>
              <th className="px-2 py-1 border">Đơn giá</th>
              <th className="px-2 py-1 border">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-2 py-1 border">{item.name }</td>
                <td className="px-2 py-1 border text-center">{item.quantity}</td>
                <td className="px-2 py-1 border text-right">{item.unit_price.toLocaleString('vi-VN')}</td>
                <td className="px-2 py-1 border text-right">{item.total_price.toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right mt-2 font-bold text-lg text-green-700">
          Tổng cộng: {order.total_amount.toLocaleString('vi-VN')} ₫
        </div>
      </div>
      <div className="mb-4">
        <label className="font-semibold mr-2">Phương thức thanh toán:</label>
        <select
          className="border rounded px-2 py-1"
          value={paymentMethod}
          onChange={e => setPaymentMethod(e.target.value)}
        >
          {paymentMethods.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex items-center space-x-2">
        <label className="font-semibold">Tiền khách đưa:</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-32"
          value={customerPaid}
          onChange={e => setCustomerPaid(e.target.value)}
          min={0}
        />
        <span className="ml-4 font-semibold">Tiền thừa:</span>
        <span className="text-blue-700 font-bold">{change !== null && change >= 0 ? change.toLocaleString('vi-VN') + ' ₫' : '-'}</span>
      </div>
      <button
        className="w-full bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition-colors mt-4"
        onClick={handlePayment}
      >
        Xác nhận thanh toán
      </button>
    </div>
  )
} 