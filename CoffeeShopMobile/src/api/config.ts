import axios from 'axios';

const API_URL = 'http://192.168.99.166:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const endpoints = {
  orders: '/orders/',
  revenue: '/dashboard/revenue',
  revenueByHour: '/dashboard/revenue-by-hour',
  revenueByGroup: '/dashboard/revenue-by-group',
  cancelledOrders: '/dashboard/cancelled-orders',
}; 