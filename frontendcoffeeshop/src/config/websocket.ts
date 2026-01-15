// ... existing code ...
// (Đã xóa toàn bộ cấu hình SERVER_URL liên quan WebSocket)
// ... existing code ...

export const WEBSOCKET_CONFIG = {
  // URL WebSocket server
  SERVER_URL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/^http/, 'ws') + '/ws/print',

  // Các endpoint khác nếu cần
  ENDPOINTS: {
    ORDERS: '/ws/orders',
    PRINT: '/ws/print'
  }
} 