'use client'

import { useState } from 'react'

interface PrinterSettings {
  id: string
  name: string
  type: 'order' | 'receipt' | 'temp'
  fontSize: number
  showHeader: boolean
  showFooter: boolean
  showLogo: boolean
  showAddress: boolean
  showPhone: boolean
  showTax: boolean
}

export function PrinterSettings() {
  const [settings, setSettings] = useState<PrinterSettings[]>([])
  const [newSetting, setNewSetting] = useState<Partial<PrinterSettings>>({
    fontSize: 12,
    showHeader: true,
    showFooter: true,
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showTax: true,
  })

  const handleAddSetting = () => {
    if (newSetting.name && newSetting.type) {
      setSettings([
        ...settings,
        {
          id: Date.now().toString(),
          name: newSetting.name,
          type: newSetting.type,
          fontSize: newSetting.fontSize || 12,
          showHeader: newSetting.showHeader || false,
          showFooter: newSetting.showFooter || false,
          showLogo: newSetting.showLogo || false,
          showAddress: newSetting.showAddress || false,
          showPhone: newSetting.showPhone || false,
          showTax: newSetting.showTax || false,
        },
      ])
      setNewSetting({
        fontSize: 12,
        showHeader: true,
        showFooter: true,
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showTax: true,
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Form thêm cài đặt máy in */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-primary-900 mb-6">Thêm cài đặt máy in mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Tên cài đặt</label>
            <input
              type="text"
              value={newSetting.name || ''}
              onChange={(e) => setNewSetting({ ...newSetting, name: e.target.value })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập tên cài đặt"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Loại in</label>
            <select
              value={newSetting.type || ''}
              onChange={(e) => setNewSetting({ ...newSetting, type: e.target.value as 'order' | 'receipt' | 'temp' })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            >
              <option value="">Chọn loại in</option>
              <option value="order">In order</option>
              <option value="receipt">In hóa đơn</option>
              <option value="temp">In tạm tính</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Cỡ chữ</label>
            <input
              type="number"
              value={newSetting.fontSize || ''}
              onChange={(e) => setNewSetting({ ...newSetting, fontSize: Number(e.target.value) })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập cỡ chữ"
            />
          </div>
          <div className="col-span-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={newSetting.showHeader}
                  onChange={(e) => setNewSetting({ ...newSetting, showHeader: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                />
                <label className="text-sm text-primary-700">Hiển thị header</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={newSetting.showFooter}
                  onChange={(e) => setNewSetting({ ...newSetting, showFooter: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                />
                <label className="text-sm text-primary-700">Hiển thị footer</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={newSetting.showLogo}
                  onChange={(e) => setNewSetting({ ...newSetting, showLogo: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                />
                <label className="text-sm text-primary-700">Hiển thị logo</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={newSetting.showAddress}
                  onChange={(e) => setNewSetting({ ...newSetting, showAddress: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                />
                <label className="text-sm text-primary-700">Hiển thị địa chỉ</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={newSetting.showPhone}
                  onChange={(e) => setNewSetting({ ...newSetting, showPhone: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                />
                <label className="text-sm text-primary-700">Hiển thị số điện thoại</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={newSetting.showTax}
                  onChange={(e) => setNewSetting({ ...newSetting, showTax: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                />
                <label className="text-sm text-primary-700">Hiển thị mã số thuế</label>
              </div>
            </div>
          </div>
          <div className="col-span-full flex justify-end">
            <button
              onClick={handleAddSetting}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>➕</span>
              <span>Thêm cài đặt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách cài đặt máy in */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách cài đặt máy in</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên cài đặt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cỡ chữ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {setting.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {setting.type === 'order'
                      ? 'In order'
                      : setting.type === 'receipt'
                      ? 'In hóa đơn'
                      : 'In tạm tính'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {setting.fontSize}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-primary-600 hover:text-primary-900 mr-4">
                      ✏️ Sửa
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      🗑️ Xóa
                    </button>
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