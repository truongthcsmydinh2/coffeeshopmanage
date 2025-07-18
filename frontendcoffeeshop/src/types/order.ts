export interface Order {
  id: number;
  order_code: string;
  table_id: number;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  menu_item?: {
    name: string;
    price: number;
  };
} 