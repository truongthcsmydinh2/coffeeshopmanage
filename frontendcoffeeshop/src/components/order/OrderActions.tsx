import React from 'react';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface OrderActionsProps {
  order: Order;
  onUpdate: () => void;
}

export const OrderActions: React.FC<OrderActionsProps> = ({ order, onUpdate }) => {
  const handleStatusUpdate = async (newStatus: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="space-y-3">
      {order.status === 'pending' && (
        <>
          <Button
            onClick={() => handleStatusUpdate('completed')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Hoàn thành
          </Button>
          <Button
            onClick={() => handleStatusUpdate('cancelled')}
            variant="destructive"
            className="w-full"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Hủy đơn
          </Button>
        </>
      )}
      
      <Button variant="outline" className="w-full">
        <Eye className="w-4 h-4 mr-2" />
        Xem chi tiết
      </Button>
    </div>
  );
}; 