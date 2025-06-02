import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Title, Paragraph } from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { api, endpoints } from '../api/config';

interface RevenueData {
  actual_revenue: number;
  estimated_revenue: number;
  total_revenue: number;
}

interface RevenueByHour {
  hour: number;
  revenue: number;
}

interface RevenueByGroup {
  group_name: string;
  revenue: number;
}

export const DashboardScreen = () => {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [revenueByHour, setRevenueByHour] = useState<RevenueByHour[]>([]);
  const [revenueByGroup, setRevenueByGroup] = useState<RevenueByGroup[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<number>(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [revenueRes, revenueByHourRes, revenueByGroupRes, cancelledOrdersRes] = await Promise.all([
        api.get(endpoints.revenue),
        api.get(endpoints.revenueByHour),
        api.get(endpoints.revenueByGroup),
        api.get(endpoints.cancelledOrders),
      ]);

      setRevenue(revenueRes.data);
      setRevenueByHour(revenueByHourRes.data);
      setRevenueByGroup(revenueByGroupRes.data);
      setCancelledOrders(cancelledOrdersRes.data.cancelled_orders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  const screenWidth = Dimensions.get('window').width;

  const validRevenueByHour = revenueByHour.filter(item => Number.isFinite(item.revenue));
  const validRevenueByGroup = revenueByGroup.filter(item => Number.isFinite(item.revenue));

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Tổng quan doanh thu</Title>
          <Paragraph>Doanh thu thực tế: {revenue?.actual_revenue.toLocaleString()}đ</Paragraph>
          <Paragraph>Doanh thu ước tính: {revenue?.estimated_revenue.toLocaleString()}đ</Paragraph>
          <Paragraph>Tổng doanh thu: {revenue?.total_revenue.toLocaleString()}đ</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Doanh thu theo giờ</Title>
          <LineChart
            data={{
              labels: validRevenueByHour.map(item => `${item.hour}h`),
              datasets: [{
                data: validRevenueByHour.map(item => item.revenue)
              }]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Doanh thu theo nhóm</Title>
          <PieChart
            data={validRevenueByGroup.map((item, index) => ({
              name: item.group_name,
              revenue: item.revenue,
              color: `rgb(${index * 50}, ${255 - index * 50}, ${index * 30})`,
              legendFontColor: '#7F7F7F',
              legendFontSize: 12
            }))}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="revenue"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Đơn hàng đã hủy</Title>
          <Paragraph>Số lượng: {cancelledOrders}</Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 