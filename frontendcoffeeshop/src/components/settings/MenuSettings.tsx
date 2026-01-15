'use client'

import { useState, useEffect } from 'react'
import { FaPlus, FaPencilAlt, FaTrash, FaSave, FaTimes, FaLayerGroup, FaCoffee } from 'react-icons/fa'

interface MenuGroup {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

interface MenuItem {
  id: number
  code: string
  name: string
  description: string | null
  price: number
  group_id: number
  is_active: boolean
}

interface EditingMenuItem {
  id?: number
  code: string
  name: string
  unit: string
  price: number
  group_id: number
  is_active: boolean
}

interface EditingMenuGroup {
  id?: number
  name: string
  description?: string
  is_active: boolean
}

interface BulkMenuItem {
  code: string
  name: string
  unit: string
  price: number
  group_id: number
}

interface BulkMenuGroup {
  name: string
  description?: string
}

type MenuTab = 'items' | 'groups'

export function MenuSettings() {
  const [activeTab, setActiveTab] = useState<MenuTab>('items')
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkInput, setBulkInput] = useState('')
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [bulkGroupInput, setBulkGroupInput] = useState('')
  const [showBulkGroupInput, setShowBulkGroupInput] = useState(false)

  const [editingItem, setEditingItem] = useState<EditingMenuItem | null>(null)
  const [editingGroup, setEditingGroup] = useState<EditingMenuGroup | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isGroupEditMode, setIsGroupEditMode] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Lấy danh sách nhóm thực đơn
      console.log('Fetching menu groups...')
      // Lấy danh sách nhóm thực đơn
      console.log('Fetching menu groups...')
      const groupsResponse = await fetch('/api/menu-groups/')

      console.log('Menu groups response status:', groupsResponse.status)

      if (!groupsResponse.ok) {
        throw new Error(`HTTP error! status: ${groupsResponse.status}`)
      }

      const groupsData = await groupsResponse.json()
      console.log('Menu groups data:', groupsData)

      // Kiểm tra cấu trúc dữ liệu
      let groups = []
      if (Array.isArray(groupsData)) {
        groups = groupsData
      } else if (groupsData && groupsData.results) {
        groups = groupsData.results
      } else if (groupsData && typeof groupsData === 'object') {
        // Nếu là object đơn lẻ, chuyển thành mảng
        groups = [groupsData]
      }

      console.log('Processed groups:', groups)
      setMenuGroups(groups)

      // Lấy danh sách món ăn
      console.log('Fetching menu items...')
      // Lấy danh sách món ăn
      console.log('Fetching menu items...')
      const itemsResponse = await fetch('/api/menu-items/?limit=1000')

      console.log('Menu items response status:', itemsResponse.status)

      if (!itemsResponse.ok) {
        throw new Error(`HTTP error! status: ${itemsResponse.status}`)
      }

      const itemsData = await itemsResponse.json()
      console.log('Menu items data:', itemsData)

      let items = []
      if (Array.isArray(itemsData)) {
        items = itemsData
      } else if (itemsData && itemsData.results) {
        items = itemsData.results
      } else if (itemsData && typeof itemsData === 'object') {
        items = [itemsData]
      }

      console.log('Processed items:', items)
      setMenuItems(items)

      setError(null)
    } catch (err: any) {
      console.error('Lỗi khi lấy dữ liệu:', err)
      if (err.message.includes('Failed to fetch')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.')
      } else if (err.message.includes('HTTP error')) {
        setError(`Lỗi từ máy chủ: ${err.message}`)
      } else {
        setError('Có lỗi xảy ra khi lấy dữ liệu. Vui lòng thử lại sau.')
      }
      setMenuGroups([])
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  // Khởi tạo form nhập mới
  useEffect(() => {
    resetForm()
  }, [menuGroups])

  const resetForm = () => {
    setEditingItem({
      code: '',
      name: '',
      unit: '',
      price: 0,
      group_id: menuGroups && menuGroups.length > 0 ? menuGroups[0].id : 0,
      is_active: true
    })
    setEditingGroup({
      name: '',
      description: '',
      is_active: true
    })
    setIsEditMode(false)
    setIsGroupEditMode(false)
  }

  // === Phần quản lý món ăn ===
  const handleEdit = (item: MenuItem) => {
    setEditingItem({
      id: item.id,
      code: item.code,
      name: item.name,
      unit: '',
      price: item.price,
      group_id: item.group_id,
      is_active: item.is_active
    })
    setIsEditMode(true)
  }

  const handleSave = async () => {
    if (!editingItem) return

    if (!editingItem.name || !editingItem.code) {
      alert('Vui lòng nhập đầy đủ mã món và tên món')
      return
    }

    try {
      setLoading(true)

      const method = isEditMode ? 'PUT' : 'POST'
      let url = isEditMode
        ? `/api/menu-items/${editingItem.id}`
        : '/api/menu-items/'

      let response;
      // Thử gọi API với URL tương đối trước
      console.log('Đang gửi request với data:', JSON.stringify(editingItem))
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingItem)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API trả về lỗi:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || 'Lỗi khi lưu dữ liệu')
        } catch (e) {
          throw new Error(`Lỗi khi lưu dữ liệu: ${errorText || response.statusText}`)
        }
      }

      const savedItem = await response.json()

      if (isEditMode) {
        setMenuItems(menuItems.map(item =>
          item.id === savedItem.id ? savedItem : item
        ))
      } else {
        setMenuItems([...menuItems, savedItem])
      }

      resetForm()
      setError(null)
      alert(isEditMode ? 'Đã cập nhật món thành công!' : 'Đã thêm món mới thành công!')
    } catch (err: any) {
      console.error('Lỗi khi lưu dữ liệu:', err)
      setError(err.message || 'Có lỗi xảy ra khi lưu dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món này không?')) {
      return
    }

    try {
      setLoading(true)

      let response;
      // Thử gọi API với URL tương đối trước
      response = await fetch(`/api/menu-items/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Lỗi khi xóa dữ liệu')
      }

      setMenuItems(menuItems.filter(item => item.id !== id))
      setError(null)
      alert('Đã xóa món thành công!')
    } catch (err: any) {
      console.error('Lỗi khi xóa dữ liệu:', err)
      setError(err.message || 'Có lỗi xảy ra khi xóa dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  // === Phần quản lý nhóm thực đơn ===
  const handleEditGroup = (group: MenuGroup) => {
    setEditingGroup({
      id: group.id,
      name: group.name,
      description: group.description || '',
      is_active: group.is_active
    })
    setIsGroupEditMode(true)
  }

  const handleSaveGroup = async () => {
    if (!editingGroup) return

    if (!editingGroup.name) {
      alert('Vui lòng nhập tên nhóm')
      return
    }

    try {
      setLoading(true)

      const method = isGroupEditMode ? 'PUT' : 'POST'
      const url = isGroupEditMode
        ? `/api/menu-groups/${editingGroup.id}`
        : '/api/menu-groups/'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingGroup)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Lỗi khi lưu dữ liệu nhóm')
      }

      const savedGroup = await response.json()

      if (isGroupEditMode) {
        setMenuGroups(menuGroups.map(group =>
          group.id === savedGroup.id ? savedGroup : group
        ))
      } else {
        setMenuGroups([...menuGroups, savedGroup])
      }

      resetForm()
      setError(null)
      alert(isGroupEditMode ? 'Đã cập nhật nhóm thành công!' : 'Đã thêm nhóm mới thành công!')
    } catch (err: any) {
      console.error('Lỗi khi lưu dữ liệu nhóm:', err)
      setError(err.message || 'Có lỗi xảy ra khi lưu dữ liệu nhóm')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (id: number) => {
    const itemsInGroup = menuItems.filter(item => item.group_id === id)
    if (itemsInGroup.length > 0) {
      alert(`Không thể xóa nhóm này vì có ${itemsInGroup.length} món đang thuộc nhóm. Vui lòng xóa các món trước.`)
      return
    }

    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này không?')) {
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/menu-groups/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Lỗi khi xóa nhóm')
      }

      setMenuGroups(menuGroups.filter(group => group.id !== id))
      setError(null)
      alert('Đã xóa nhóm thành công!')
    } catch (err: any) {
      console.error('Lỗi khi xóa nhóm:', err)
      setError(err.message || 'Có lỗi xảy ra khi xóa nhóm')
    } finally {
      setLoading(false)
    }
  }

  const getGroupName = (groupId: number) => {
    const group = menuGroups.find(g => g.id === groupId)
    return group ? group.name : 'Không xác định'
  }

  const handleBulkAdd = async () => {
    if (!bulkInput.trim()) {
      alert('Vui lòng nhập dữ liệu')
      return
    }
    if (menuGroups.length === 0) {
      alert('Vui lòng thêm nhóm thực đơn trước')
      return
    }
    try {
      setLoading(true)
      const lines = bulkInput.split('\n')
      const items: BulkMenuItem[] = []
      for (const line of lines) {
        if (!line.trim()) continue
        const [code, name, unit, price, groupName] = line.split('\t')
        if (!code || !name || !unit || !price || !groupName) {
          alert(`Dòng không hợp lệ: ${line}`)
          return
        }
        // Tìm group_id theo tên nhóm
        const group = menuGroups.find(g => g.name.trim().toLowerCase() === groupName.trim().toLowerCase())
        if (!group) {
          alert(`Không tìm thấy nhóm thực đơn: ${groupName}`)
          return
        }
        items.push({
          code: code.trim(),
          name: name.trim(),
          unit: unit.trim(),
          price: Number(price.trim()),
          group_id: group.id
        })
      }
      for (const item of items) {
        const response = await fetch('/api/menu-items/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...item,
            is_active: true
          })
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Lỗi khi thêm món')
        }
        const savedItem = await response.json()
        setMenuItems(prev => [...prev, savedItem])
      }
      setBulkInput('')
      setShowBulkInput(false)
      setError(null)
      alert(`Đã thêm thành công ${items.length} món!`)
    } catch (err: any) {
      console.error('Lỗi khi thêm nhiều món:', err)
      setError(err.message || 'Có lỗi xảy ra khi thêm món')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAddGroup = async () => {
    if (!bulkGroupInput.trim()) {
      alert('Vui lòng nhập dữ liệu')
      return
    }

    try {
      setLoading(true)

      // Phân tích dữ liệu từ textarea
      const lines = bulkGroupInput.split('\n')
      const groups: BulkMenuGroup[] = []

      for (const line of lines) {
        if (!line.trim()) continue

        const [name, description] = line.split('\t')
        if (!name) {
          alert(`Dòng không hợp lệ: ${line}`)
          return
        }

        groups.push({
          name: name.trim(),
          description: description?.trim()
        })
      }

      // Gửi từng group lên server
      for (const group of groups) {
        const response = await fetch('/api/menu-groups/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...group,
            is_active: true
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Lỗi khi thêm nhóm')
        }

        const savedGroup = await response.json()
        setMenuGroups(prev => [...prev, savedGroup])
      }

      setBulkGroupInput('')
      setShowBulkGroupInput(false)
      setError(null)
      alert(`Đã thêm thành công ${groups.length} nhóm!`)
    } catch (err: any) {
      console.error('Lỗi khi thêm nhiều nhóm:', err)
      setError(err.message || 'Có lỗi xảy ra khi thêm nhóm')
    } finally {
      setLoading(false)
    }
  }

  if (loading && menuItems.length === 0 && menuGroups.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && menuItems.length === 0 && menuGroups.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Lỗi!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Lỗi!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Tab chuyển đổi */}
      <div className="flex space-x-1 rounded-lg bg-primary-100 p-1">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'items'
            ? 'bg-white text-primary-800 shadow-sm'
            : 'text-primary-600 hover:bg-white/30'
            }`}
        >
          <FaCoffee className="mr-2" />
          Món ăn
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'groups'
            ? 'bg-white text-primary-800 shadow-sm'
            : 'text-primary-600 hover:bg-white/30'
            }`}
        >
          <FaLayerGroup className="mr-2" />
          Nhóm thực đơn
        </button>
      </div>

      {activeTab === 'items' ? (
        <>
          {/* Form thêm/sửa món */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-primary-900">
                {isEditMode ? 'Chỉnh sửa món' : 'Thêm món mới'}
              </h2>
              <button
                onClick={() => setShowBulkInput(!showBulkInput)}
                className="text-primary-600 hover:text-primary-800 flex items-center"
              >
                <FaPlus className="mr-2" />
                {showBulkInput ? 'Thêm từng món' : 'Thêm nhiều món'}
              </button>
            </div>

            {showBulkInput ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">
                    Nhập nhiều món (mỗi dòng một món, phân tách bằng tab)
                  </label>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    className="w-full h-48 rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="Mã món[TAB]Tên món[TAB]Đơn vị tính[TAB]Giá bán[TAB]Nhóm thực đơn"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleBulkAdd}
                    disabled={loading || menuGroups.length === 0}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        <span>Thêm món</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">Mã món *</label>
                  <input type="text" value={editingItem?.code || ''} onChange={e => setEditingItem(prev => ({
                    ...(prev || { code: '', name: '', unit: '', price: 0, group_id: 0, is_active: true }),
                    code: e.target.value
                  }))} className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">Tên món *</label>
                  <input type="text" value={editingItem?.name || ''} onChange={e => setEditingItem(prev => ({
                    ...(prev || { code: '', name: '', unit: '', price: 0, group_id: 0, is_active: true }),
                    name: e.target.value
                  }))} className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">Đơn vị tính *</label>
                  <input type="text" value={editingItem?.unit || ''} onChange={e => setEditingItem(prev => ({
                    ...(prev || { code: '', name: '', unit: '', price: 0, group_id: 0, is_active: true }),
                    unit: e.target.value
                  }))} className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">Giá bán *</label>
                  <input type="number" value={editingItem?.price || ''} onChange={e => setEditingItem(prev => ({
                    ...(prev || { code: '', name: '', unit: '', price: 0, group_id: 0, is_active: true }),
                    price: Number(e.target.value)
                  }))} className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">Nhóm thực đơn *</label>
                  <select value={editingItem?.group_id || ''} onChange={e => setEditingItem(prev => ({
                    ...(prev || { code: '', name: '', unit: '', price: 0, group_id: 0, is_active: true }),
                    group_id: Number(e.target.value)
                  }))} className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50" required>
                    <option value="">Chọn nhóm</option>
                    {menuGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={loading || menuGroups.length === 0}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        <span>{isEditMode ? 'Cập nhật' : 'Thêm món'}</span>
                      </>
                    )}
                  </button>
                  {isEditMode && (
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                    >
                      <FaTimes className="mr-2" />
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            )}
            {menuGroups.length === 0 && (
              <div className="mt-4 px-4 py-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                <p className="font-medium">Chưa có nhóm thực đơn nào.</p>
                <p>Vui lòng thêm nhóm thực đơn trước khi thêm món ăn.</p>
              </div>
            )}
          </div>

          {/* Danh sách món */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Danh sách món ({menuItems.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã món
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên món
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nhóm món
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Chưa có món nào. Hãy thêm món mới.
                      </td>
                    </tr>
                  ) : (
                    menuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getGroupName(item.group_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.price.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary-600 hover:text-primary-900 mr-4 inline-flex items-center"
                            disabled={loading}
                          >
                            <FaPencilAlt className="mr-1" /> Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                            disabled={loading}
                          >
                            <FaTrash className="mr-1" /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Form thêm/sửa nhóm thực đơn */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-primary-900">
                {isGroupEditMode ? 'Chỉnh sửa nhóm' : 'Thêm nhóm mới'}
              </h2>
              <button
                onClick={() => setShowBulkGroupInput(!showBulkGroupInput)}
                className="text-primary-600 hover:text-primary-800 flex items-center"
              >
                <FaPlus className="mr-2" />
                {showBulkGroupInput ? 'Thêm từng nhóm' : 'Thêm nhiều nhóm'}
              </button>
            </div>

            {showBulkGroupInput ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">
                    Nhập nhiều nhóm (mỗi dòng một nhóm, phân tách bằng tab)
                  </label>
                  <textarea
                    value={bulkGroupInput}
                    onChange={(e) => setBulkGroupInput(e.target.value)}
                    className="w-full h-48 rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="Tên nhóm[TAB]Mô tả (tùy chọn)"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleBulkAddGroup}
                    disabled={loading}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        <span>Thêm nhóm</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">Tên nhóm</label>
                  <input
                    type="text"
                    value={editingGroup?.name || ''}
                    onChange={(e) => setEditingGroup(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="Nhập tên nhóm thực đơn"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary-700">Mô tả</label>
                  <input
                    type="text"
                    value={editingGroup?.description || ''}
                    onChange={(e) => setEditingGroup(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="Nhập mô tả nhóm (tùy chọn)"
                  />
                </div>
                <div className="flex items-end space-x-2 md:col-span-2">
                  <button
                    onClick={handleSaveGroup}
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        <span>{isGroupEditMode ? 'Cập nhật nhóm' : 'Thêm nhóm'}</span>
                      </>
                    )}
                  </button>
                  {isGroupEditMode && (
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                    >
                      <FaTimes className="mr-2" />
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Danh sách nhóm thực đơn */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Danh sách nhóm thực đơn ({menuGroups.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên nhóm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số món
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuGroups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Chưa có nhóm thực đơn nào. Hãy thêm nhóm mới.
                      </td>
                    </tr>
                  ) : (
                    menuGroups.map((group) => {
                      const itemCount = menuItems.filter(item => item.group_id === group.id).length

                      return (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {group.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {group.description || 'Không có mô tả'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {itemCount} món
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleEditGroup(group)}
                              className="text-primary-600 hover:text-primary-900 mr-4 inline-flex items-center"
                              disabled={loading}
                            >
                              <FaPencilAlt className="mr-1" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                              disabled={loading || itemCount > 0}
                              title={itemCount > 0 ? "Không thể xóa nhóm có món ăn" : "Xóa nhóm"}
                            >
                              <FaTrash className="mr-1" /> Xóa
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 