import React from 'react';
import { Order } from '@/types/order';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Mã đơn hàng</label>
          <p className="text-sm font-semibold">{order.order_code}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Số bàn</label>
          <p className="text-sm font-semibold">{order.table_id}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Trạng thái</label>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {order.status === 'completed' ? 'Hoàn thành' :
             order.status === 'pending' ? 'Đang xử lý' : 'Đã hủy'}
          </span>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Tổng tiền</label>
          <p className="text-sm font-semibold">{order.total_amount?.toLocaleString('vi-VN')}đ</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">Thời gian tạo</label>
        <p className="text-sm">
          {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
        </p>
      </div>

      {order.items && order.items.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-500">Chi tiết món</label>
          <div className="mt-2 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium">{item.menu_item?.name || `Món ${item.menu_item_id}`}</p>
                  <p className="text-xs text-gray-500">Số lượng: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{item.price?.toLocaleString('vi-VN')}đ</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 