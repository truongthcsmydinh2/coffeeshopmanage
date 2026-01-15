'use client'

import { useState, useEffect } from 'react'

interface Shift {
    id: number
    staff_id: number | null
    staff_id_2: number | null
    shift_type: string
    start_time: string
    end_time: string | null
    initial_cash: number
    end_cash: number | null
    staff1_start_order_number: number | null
    staff1_end_order_number: number | null
    staff2_start_order_number: number | null
    staff2_end_order_number: number | null
    total_shift_orders: number | null
    status: string
    note: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

interface Staff {
    id: number
    name: string
    code: string
}

export default function ShiftManagementPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [editingShift, setEditingShift] = useState<Shift | null>(null)
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    useEffect(() => {
        fetchShifts()
        fetchStaff()
    }, [])

    const fetchShifts = async () => {
        try {
            const response = await fetch('/api/shifts/get-all?limit=1000')
            if (response.ok) {
                const data = await response.json()
                setShifts(data || [])
            }
        } catch (error) {
            console.error('Error fetching shifts:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStaff = async () => {
        try {
            const response = await fetch('/api/staff/')
            if (response.ok) {
                const data = await response.json()
                setStaffList(data || [])
            }
        } catch (error) {
            console.error('Error fetching staff:', error)
        }
    }

    const getStaffName = (staffId: number | null) => {
        if (!staffId) return 'N/A'
        const staff = staffList.find(s => s.id === staffId)
        return staff ? staff.name : `ID: ${staffId}`
    }

    const handleDelete = async (shiftId: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) return

        try {
            const response = await fetch(`/api/shifts/${shiftId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('Xóa ca làm việc thành công!')
                fetchShifts()
            } else {
                alert('Lỗi khi xóa ca làm việc!')
            }
        } catch (error) {
            console.error('Error deleting shift:', error)
            alert('Lỗi kết nối!')
        }
    }

    const handleEdit = (shift: Shift) => {
        setEditingShift({ ...shift })
    }

    const handleSave = async () => {
        if (!editingShift) return

        try {
            const response = await fetch(`/api/shifts/update/${editingShift.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editingShift),
            })

            if (response.ok) {
                alert('Cập nhật ca làm việc thành công!')
                setEditingShift(null)
                fetchShifts()
            } else {
                alert('Lỗi khi cập nhật ca làm việc!')
            }
        } catch (error) {
            console.error('Error updating shift:', error)
            alert('Lỗi kết nối!')
        }
    }

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleString('vi-VN')
    }

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return 'N/A'
        return amount.toLocaleString('vi-VN') + ' đ'
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'open': 'bg-green-100 text-green-800',
            'active': 'bg-green-100 text-green-800', // Keep for backward compatibility if needed
            'closed': 'bg-gray-100 text-gray-800',
            'pending': 'bg-yellow-100 text-yellow-800',
        }
        return colors[status] || 'bg-blue-100 text-blue-800'
    }

    const getShiftTypeName = (type: string) => {
        const types: Record<string, string> = {
            'morning': 'Sáng',
            'afternoon': 'Chiều',
            'evening': 'Tối',
            'night': 'Đêm',
            'full': 'Cả ngày',
        }
        return types[type] || type
    }

    // Filter and pagination
    const filteredShifts = shifts.filter(shift =>
        filterStatus === 'all' || shift.status === filterStatus
    )

    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentShifts = filteredShifts.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredShifts.length / itemsPerPage)

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl">Đang tải...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý Ca Làm Việc</h1>
                <p className="text-gray-600">Tổng số: {filteredShifts.length} ca</p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4 items-center bg-white p-4 rounded-lg shadow">
                <label className="font-semibold text-gray-700">Lọc theo trạng thái:</label>
                <select
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Tất cả</option>
                    <option value="open">Đang hoạt động</option>
                    <option value="closed">Đã đóng</option>
                    <option value="pending">Chờ xử lý</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại ca</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số đơn</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentShifts.map((shift) => (
                                <tr key={shift.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{shift.id}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className="font-semibold">{getShiftTypeName(shift.shift_type)}</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        <div>{getStaffName(shift.staff_id)}</div>
                                        {shift.staff_id_2 && (
                                            <div className="text-gray-500 text-xs">+ {getStaffName(shift.staff_id_2)}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        <div className="text-xs">Bắt đầu: {formatDateTime(shift.start_time)}</div>
                                        {shift.end_time && (
                                            <div className="text-xs text-gray-500">Kết thúc: {formatDateTime(shift.end_time)}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.total_shift_orders || 0}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(shift.status)}`}>
                                            {shift.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(shift)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(shift.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{' '}
                                    <span className="font-medium">{Math.min(indexOfLastItem, filteredShifts.length)}</span> trong{' '}
                                    <span className="font-medium">{filteredShifts.length}</span> ca
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingShift && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Chỉnh sửa ca làm việc #{editingShift.id}</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại ca</label>
                                    <select
                                        value={editingShift.shift_type}
                                        onChange={(e) => setEditingShift({ ...editingShift, shift_type: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="morning">Sáng</option>
                                        <option value="afternoon">Chiều</option>
                                        <option value="evening">Tối</option>
                                        <option value="night">Đêm</option>
                                        <option value="full">Cả ngày</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                    <select
                                        value={editingShift.status}
                                        onChange={(e) => setEditingShift({ ...editingShift, status: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Đang hoạt động</option>
                                        <option value="closed">Đã đóng</option>
                                        <option value="pending">Chờ xử lý</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên 1</label>
                                    <select
                                        value={editingShift.staff_id || ''}
                                        onChange={(e) => setEditingShift({ ...editingShift, staff_id: parseInt(e.target.value) || null })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Chọn nhân viên</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên 2</label>
                                    <select
                                        value={editingShift.staff_id_2 || ''}
                                        onChange={(e) => setEditingShift({ ...editingShift, staff_id_2: parseInt(e.target.value) || null })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Không có</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiền đầu ca</label>
                                <input
                                    type="number"
                                    value={editingShift.initial_cash}
                                    onChange={(e) => setEditingShift({ ...editingShift, initial_cash: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea
                                    value={editingShift.note || ''}
                                    onChange={(e) => setEditingShift({ ...editingShift, note: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingShift(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
