'use client'

import { useRouter } from 'next/navigation'
import OrderForm from '@/components/order/OrderForm'

export default function CreateOrderPage() {
  const router = useRouter()

  const handleSubmit = async (orderData: { tableId: string | null, items: any[] }) => {
    try {
      console.log('Dữ liệu order gửi đi:', orderData)
      // Trong trường hợp thực tế, đây sẽ là gọi API để tạo order
      // const response = await fetch('/api/orders', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(orderData),
      // })
      // if (response.ok) {
      //   const result = await response.json()
      //   console.log('Order đã được tạo:', result)
      //   alert('Đã tạo order thành công!')
      //   router.push('/order')
      // } else {
      //   const errorData = await response.json()
      //   alert(`Lỗi: ${errorData.message || 'Không thể tạo order'}`)
      // }

      // Giả lập tạo order thành công
      alert('Đã tạo order thành công!')
      router.push('/order')
    } catch (error) {
      console.error('Lỗi khi tạo order:', error)
      alert('Có lỗi xảy ra khi tạo order. Vui lòng thử lại.')
    }
  }

  return <OrderForm onSubmit={handleSubmit} />
} 