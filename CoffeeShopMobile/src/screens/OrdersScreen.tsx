import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { api, endpoints } from '../api/config';

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  note: string;
  name: string;
}

interface Order {
  id: number;
  table_id: number;
  staff_id: number;
  shift_id: number;
  status: string;
  total_amount: number;
  note: string;
  order_code: string;
  payment_status: string;
  time_in: string;
  time_out: string;
  items: OrderItem[];
}

export const OrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get(endpoints.orders);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#ff0000';
      case 'pending':
        return '#ffa500';
      case 'completed':
        return '#00ff00';
      default:
        return '#808080';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Đơn hàng #{item.id}</Title>
        <Paragraph>Bàn: {item.table_id}</Paragraph>
        <Paragraph>Mã đơn: {item.order_code}</Paragraph>
        <Paragraph>Tổng tiền: {item.total_amount.toLocaleString()}đ</Paragraph>
        <View style={styles.statusContainer}>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: item.payment_status === 'paid' ? '#00ff00' : '#ff0000' }]}
            textStyle={{ color: item.payment_status === 'paid' ? '#00ff00' : '#ff0000' }}
          >
            {item.payment_status}
          </Chip>
        </View>
        <Title style={styles.itemsTitle}>Chi tiết đơn hàng:</Title>
        {item.items.map((orderItem) => (
          <View key={orderItem.id} style={styles.orderItem}>
            <Paragraph>{orderItem.name}</Paragraph>
            <Paragraph>Số lượng: {orderItem.quantity}</Paragraph>
            <Paragraph>Đơn giá: {orderItem.unit_price.toLocaleString()}đ</Paragraph>
            <Paragraph>Tổng: {orderItem.total_price.toLocaleString()}đ</Paragraph>
            {orderItem.note && <Paragraph>Ghi chú: {orderItem.note}</Paragraph>}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  statusChip: {
    marginRight: 8,
  },
  itemsTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  orderItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
}); 