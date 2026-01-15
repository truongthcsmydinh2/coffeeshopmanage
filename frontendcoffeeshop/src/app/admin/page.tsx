'use client';

import React, { useState, useEffect } from 'react';
import { FaLock, FaTrash, FaCalendarAlt, FaClock, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { tables } from '@/config/tables';
import { getTodayVietnam } from '@/utils/dateUtils';

interface OrderItem {
  id: number;
  order_id: number;
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
  time_out: string | null;
  items: OrderItem[];
  table_name?: string;
}

const AdminPage: React.FC = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getTodayVietnam();
  });

  const handleCheckPassword = () => {
    if (password === '266600') {
      setShowPopup(false);
      setError('');
      fetchOrders();
    } else {
      setError('Mật khẩu không đúng!');
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/complete-orders/?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast.error('Không thể tải danh sách order');
        setOrders([]);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải danh sách order');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa order này?')) {
      return;
    }

    try {
      // Lấy order cần xóa để lấy danh sách order_items
      const order = orders.find(o => o.id === orderId);
      if (order && order.items && order.items.length > 0) {
        // Xóa từng order_item
        for (const item of order.items) {
          try {
            const res = await fetch(`/order-items/${item.id}`, {
              method: 'DELETE',
              headers: {
                'Accept': 'application/json',
              },
            });
            if (res.status === 500) {
              toast.error(`Lỗi server khi xóa món (id: ${item.id}). Kiểm tra backend!`);
              return;
            }
            if (res.type === 'opaque') {
              toast.error('Lỗi CORS: Backend chưa cho phép truy cập từ frontend.');
              return;
            }
            if (!res.ok) {
              toast.error(`Không thể xóa món (id: ${item.id}) của order!`);
              return;
            }
          } catch (err) {
            toast.error('Lỗi CORS hoặc mạng khi xóa order_items. Kiểm tra backend!');
            return;
          }
        }
      }
      // Sau khi xóa hết order_items, xóa order
      const response = await fetch(`/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Xóa order thành công');
        setOrders(orders.filter(order => order.id !== orderId));
      } else {
        toast.error('Không thể xóa order');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa order');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    fetchOrders();
  };

  const handleTodayClick = () => {
    setSelectedDate(getTodayVietnam());
    fetchOrders();
  };

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getTableName = (tableId: number) => {
    const table = tables.find(t => t.id === Number(tableId));
    return table ? table.name : `Bàn ${tableId}`;
  };

  if (showPopup) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaLock className="text-yellow-600 text-2xl" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-4">Nhập mật khẩu để vào trang Admin</h2>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCheckPassword(); }}
              autoFocus
            />
            {error && (
              <div className="text-red-500 text-sm mb-3 text-center">{error}</div>
            )}
            <button
              className="w-full bg-yellow-500 text-white rounded-xl py-3 font-semibold hover:bg-yellow-600 transition-colors duration-200 shadow-md hover:shadow-lg"
              onClick={handleCheckPassword}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-1 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-6 px-2 sm:px-0">Trang Quản Trị</h1>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-3 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Quản lý Order</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleTodayClick}
                className="flex items-center px-4 sm:px-6 py-3 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg text-base sm:text-base w-full sm:w-auto justify-center font-medium"
              >
                <FaCalendarAlt className="mr-2" /> Hôm nay
              </button>
              <div className="relative w-full sm:w-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="px-4 sm:px-6 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 w-full text-base sm:text-base"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin h-12 w-12 border-4 border-yellow-500 rounded-full border-t-transparent"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Không có order nào trong ngày này
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Mã Order
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                      Bàn
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Thời gian
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Trạng thái
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-sm font-medium text-gray-900">{order.order_code}</div>
                          <div className="text-sm text-gray-500 sm:hidden font-medium">{getTableName(order.table_id)}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-gray-900">{getTableName(order.table_id)}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-sm font-bold text-gray-900">
                            {order.total_amount.toLocaleString('vi-VN')} ₫
                          </div>
                          <div className="text-xs md:hidden mt-1 space-y-0.5">
                            <div className="text-gray-600 font-medium flex items-center">
                              <FaClock className="mr-1.5 text-gray-400 text-xs" />
                              {new Date(order.time_in).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="text-gray-500 ml-5">
                              {new Date(order.time_in).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="flex flex-col text-sm text-gray-900">
                            <div className="flex items-center">
                              <FaClock className="mr-2 text-gray-400" />
                              {new Date(order.time_in).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="text-sm text-gray-500 ml-6">
                              {new Date(order.time_in).toLocaleTimeString('vi-VN')}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                          <span
                            className={`px-3 sm:px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {order.status === 'pending'
                              ? 'Chờ xử lý'
                              : order.status === 'active'
                                ? 'Đang phục vụ'
                                : order.status === 'completed'
                                  ? 'Hoàn thành'
                                  : 'Đã hủy'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-3 sm:space-x-3">
                            <button
                              onClick={() => toggleOrderDetails(order.id)}
                              className="text-gray-400 hover:text-gray-600 p-2 text-lg"
                            >
                              {expandedOrderId === order.id ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-500 hover:text-red-700 p-2 text-lg"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedOrderId === order.id && (
                        <tr>
                          <td colSpan={6} className="px-4 sm:px-6 py-4 sm:py-6 bg-gray-50">
                            <div className="space-y-4 sm:space-y-4">
                              <h4 className="text-lg sm:text-lg font-semibold text-gray-900">Chi tiết đồ uống:</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="bg-white p-4 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                                  >
                                    <p className="font-bold text-gray-900 mb-3 text-base sm:text-base">{item.name}</p>
                                    <div className="space-y-2">
                                      <p className="text-sm sm:text-sm text-gray-600">
                                        <span className="font-semibold">Số lượng:</span> {item.quantity}
                                      </p>
                                      <p className="text-sm sm:text-sm text-gray-600">
                                        <span className="font-semibold">Đơn giá:</span> {item.unit_price.toLocaleString('vi-VN')} ₫
                                      </p>
                                      <p className="text-sm sm:text-sm text-gray-600 font-medium">
                                        <span className="font-semibold">Thành tiền:</span> {item.total_price.toLocaleString('vi-VN')} ₫
                                      </p>
                                      {item.note && (
                                        <p className="text-sm sm:text-sm text-gray-600">
                                          <span className="font-semibold">Ghi chú:</span> {item.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;