// ... existing code ...
// (Đã xóa toàn bộ cấu hình SERVER_URL liên quan WebSocket)
// ... existing code ...

export const WEBSOCKET_CONFIG = {
  // URL WebSocket server
  SERVER_URL: 'ws://192.168.99.166:8000/ws/print',
  
  // Các endpoint khác nếu cần
  ENDPOINTS: {
    ORDERS: '/ws/orders',
    PRINT: '/ws/print'
  }
} 