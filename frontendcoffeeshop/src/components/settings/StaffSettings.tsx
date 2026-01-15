'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface Staff {
  id: string
  code: string
  name: string
  role_id: number
  email: string
  phone: string
  address?: string
  salary: number
  is_active: boolean
}

export function StaffSettings() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    name: '',
    code: '',
    role_id: 1,
    email: '',
    phone: '',
    address: '',
    salary: 0,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')



  // Fetch staff list when component mounts
  useEffect(() => {
    fetchStaffList()
  }, [])

  const fetchStaffList = async () => {
    try {
      setLoading(true)
      let response;
      // Thử với URL tương đối trước
      response = await axios.get('/api/staff/')
      console.log('Dữ liệu nhân viên từ API:', response.data);
      setStaffList(response.data)
      setError('')
    } catch (err) {
      console.error('Lỗi khi lấy danh sách nhân viên:', err)
      setError('Không thể lấy danh sách nhân viên. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.code) {
      setError('Vui lòng nhập đầy đủ thông tin nhân viên')
      return
    }

    try {
      setLoading(true)
      console.log('Dữ liệu gửi đi:', newStaff);
      let response;
      // Thử với URL tương đối trước
      response = await axios.post('/api/staff/', newStaff)
      console.log('Phản hồi từ API:', response.data);
      setStaffList([...staffList, response.data])
      setNewStaff({
        name: '',
        code: '',
        role_id: 1,
        email: '',
        phone: '',
        address: '',
        salary: 0,
        is_active: true
      })
      setError('')
    } catch (err) {
      console.error('Lỗi khi thêm nhân viên:', err)
      setError('Không thể thêm nhân viên. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    try {
      setLoading(true)
      // Thử với URL tương đối trước
      await axios.delete(`/api/staff/${id}`)
      setStaffList(staffList.filter(staff => staff.id !== id))
      setError('')
    } catch (err) {
      console.error('Lỗi khi xóa nhân viên:', err)
      setError('Không thể xóa nhân viên. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Form thêm nhân viên */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-primary-900 mb-6">Thêm nhân viên mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Mã nhân viên</label>
            <input
              type="text"
              value={newStaff.code || ''}
              onChange={(e) => setNewStaff({ ...newStaff, code: e.target.value })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập mã nhân viên"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Tên nhân viên</label>
            <input
              type="text"
              value={newStaff.name || ''}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập tên nhân viên"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Email</label>
            <input
              type="email"
              value={newStaff.email || ''}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập email"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Số điện thoại</label>
            <input
              type="text"
              value={newStaff.phone || ''}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Địa chỉ</label>
            <input
              type="text"
              value={newStaff.address || ''}
              onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập địa chỉ"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Lương</label>
            <input
              type="number"
              value={newStaff.salary || 0}
              onChange={(e) => setNewStaff({ ...newStaff, salary: parseFloat(e.target.value) })}
              className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              placeholder="Nhập lương nhân viên"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddStaff}
              disabled={loading}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <span>➕</span>
                  <span>Thêm nhân viên</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách nhân viên */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách nhân viên</h2>
        </div>
        <div className="overflow-x-auto">
          {loading && staffList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : staffList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Chưa có nhân viên nào</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lương
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.salary?.toLocaleString()} VNĐ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary-600 hover:text-primary-900 mr-4">
                        ✏️ Sửa
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteStaff(staff.id)}
                        disabled={loading}
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
} 