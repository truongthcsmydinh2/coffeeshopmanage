'use client'

import { FaGift, FaHome } from 'react-icons/fa'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Promotion {
  id: string
  code: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  startDate: Date
  endDate: Date
  status: 'active' | 'inactive'
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({
    type: 'percentage',
    status: 'active',
  })
  const router = useRouter()

  const handleAddPromotion = () => {
    if (newPromotion.code && newPromotion.name && newPromotion.value) {
      setPromotions([
        ...promotions,
        {
          id: Date.now().toString(),
          code: newPromotion.code,
          name: newPromotion.name,
          type: newPromotion.type || 'percentage',
          value: newPromotion.value,
          startDate: newPromotion.startDate || new Date(),
          endDate: newPromotion.endDate || new Date(),
          status: newPromotion.status || 'active',
        },
      ])
      setNewPromotion({
        type: 'percentage',
        status: 'active',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 py-10 relative">
      {/* Home button */}
      <button 
        onClick={() => router.push('/functions')}
        className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-md hover:bg-yellow-50 transition-colors"
        title="Về trang chủ"
      >
        <FaHome className="text-xl text-yellow-600" />
      </button>
      
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-full shadow-lg mb-4">
          <FaGift size={48} className="text-white drop-shadow" />
        </div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-400 drop-shadow mb-2">Khuyến mãi</h1>
        <p className="text-lg text-yellow-700 opacity-80 font-medium">Quản lý các chương trình khuyến mãi</p>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl mb-10">
        <h2 className="text-xl font-bold mb-4 text-yellow-700">Thêm khuyến mãi mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã khuyến mãi</label>
            <input
              type="text"
              value={newPromotion.code || ''}
              onChange={(e) => setNewPromotion({ ...newPromotion, code: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên khuyến mãi</label>
            <input
              type="text"
              value={newPromotion.name || ''}
              onChange={(e) => setNewPromotion({ ...newPromotion, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loại khuyến mãi</label>
            <select
              value={newPromotion.type || 'percentage'}
              onChange={(e) => setNewPromotion({ ...newPromotion, type: e.target.value as 'percentage' | 'fixed' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            >
              <option value="percentage">Phần trăm</option>
              <option value="fixed">Số tiền cố định</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giá trị</label>
            <input
              type="number"
              value={newPromotion.value || ''}
              onChange={(e) => setNewPromotion({ ...newPromotion, value: Number(e.target.value) })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
            <input
              type="date"
              value={newPromotion.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setNewPromotion({ ...newPromotion, startDate: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
            <input
              type="date"
              value={newPromotion.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setNewPromotion({ ...newPromotion, endDate: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={newPromotion.status || 'active'}
              onChange={(e) => setNewPromotion({ ...newPromotion, status: e.target.value as 'active' | 'inactive' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddPromotion}
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform"
            >
              Thêm khuyến mãi
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-4 text-yellow-700">Danh sách khuyến mãi</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                  Mã khuyến mãi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                  Tên khuyến mãi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                  Giá trị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <tr key={promotion.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.type === 'percentage'
                      ? `${promotion.value}%`
                      : `${promotion.value.toLocaleString('vi-VN')} ₫`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.startDate.toLocaleDateString('vi-VN')} -{' '}
                    {promotion.endDate.toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        promotion.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {promotion.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-yellow-600 hover:text-yellow-800 mr-4 font-semibold">Sửa</button>
                    <button className="text-red-500 hover:text-red-700 font-semibold">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 