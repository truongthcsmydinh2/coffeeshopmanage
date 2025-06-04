import { useState } from 'react';
import { FaLock } from 'react-icons/fa';

export default function AdminPage() {
  const [showPopup, setShowPopup] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCheckPassword = () => {
    if (password === '266600') {
      setShowPopup(false);
      setError('');
    } else {
      setError('Mật khẩu không đúng!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {showPopup && (
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
      )}

      {!showPopup && (
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Trang Quản Trị</h1>
          
          {/* Các chức năng admin sẽ được thêm vào đây */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4">Quản lý Menu</h2>
              <p className="text-gray-600">Thêm, sửa, xóa các món ăn và đồ uống</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4">Quản lý Bàn</h2>
              <p className="text-gray-600">Cấu hình và quản lý các bàn trong quán</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4">Báo cáo Doanh thu</h2>
              <p className="text-gray-600">Xem thống kê doanh thu theo ngày, tháng</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 