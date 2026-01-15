'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface Table {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  type: 'square' | 'circle' | 'rectangle'
}

interface Position {
  x: number
  y: number
}

export function LayoutSettings() {
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<Position | null>(null)
  const [drawEnd, setDrawEnd] = useState<Position | null>(null)
  const [drawingType, setDrawingType] = useState<'square' | 'circle' | 'rectangle'>('rectangle')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tableName, setTableName] = useState('')
  const [copiedTable, setCopiedTable] = useState<Table | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [gridSize, setGridSize] = useState(20)
  const canvasRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Lấy dữ liệu layout từ server khi component được mount
  useEffect(() => {
    fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/layouts/')
      if (response.ok) {
        const data = await response.json()
        console.log('Dữ liệu layout từ server:', data)
        if (data.length > 0 && data[0].layout_data) {
          // Chuyển layout_data từ object thành mảng
          if (typeof data[0].layout_data === 'object' && !Array.isArray(data[0].layout_data)) {
            const tableArray = Object.values(data[0].layout_data)
            setTables(tableArray as Table[])
          } else {
            setTables(data[0].layout_data)
          }
        }
      } else {
        console.error('Lỗi khi tải layout:', response.status, response.statusText)
        toast.error(`Không thể tải layout: ${response.status} ${response.statusText}`)
        // Nếu API lỗi, sử dụng dữ liệu mock để demo
        setTables([
          {
            id: '1',
            name: 'Bàn 1',
            x: 100,
            y: 100,
            width: 80,
            height: 80,
            type: 'square'
          },
          {
            id: '2',
            name: 'Bàn 2',
            x: 250,
            y: 100,
            width: 120,
            height: 80,
            type: 'rectangle'
          },
          {
            id: '3',
            name: 'Bàn 3',
            x: 180,
            y: 230,
            width: 90,
            height: 90,
            type: 'circle'
          }
        ])
      }
    } catch (error) {
      console.error('Lỗi khi tải layout:', error)
      toast.error('Không thể kết nối đến server. Đang sử dụng dữ liệu demo.')
      // Nếu lỗi kết nối, sử dụng dữ liệu mock để demo
      setTables([
        {
          id: '1',
          name: 'Bàn 1',
          x: 100,
          y: 100,
          width: 80,
          height: 80,
          type: 'square'
        },
        {
          id: '2',
          name: 'Bàn 2',
          x: 250,
          y: 100,
          width: 120,
          height: 80,
          type: 'rectangle'
        },
        {
          id: '3',
          name: 'Bàn 3',
          x: 180,
          y: 230,
          width: 90,
          height: 90,
          type: 'circle'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm lấy danh sách bàn thực tế từ backend
  async function fetchTablesFromBackend() {
    try {
      const res = await fetch('/tables/');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  const saveLayout = async () => {
    try {
      setIsLoading(true)
      // Không cho lưu nếu còn bàn có id tạm
      const hasTempId = tables.some(table => table.id.toString().startsWith('temp-'));
      if (hasTempId) {
        toast.error('Vui lòng chờ tạo bàn xong trước khi lưu layout!');
        setIsLoading(false);
        return;
      }
      // Kiểm tra xem có layout nào chưa
      let existingLayouts = [];
      try {
        const checkResponse = await fetch('/layouts/')
        if (checkResponse.ok) {
          existingLayouts = await checkResponse.json()
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra layout hiện có:', error)
        toast.error('Không thể kết nối đến server để kiểm tra layout hiện có.')
        return
      }
      // Chuyển đổi mảng tables thành object với key là id thực tế của bàn
      const tableMap: Record<string, any> = {};
      tables.forEach(table => {
        tableMap[table.id] = { ...table, id: table.id };
      });
      const layoutData = {
        name: "Quán cà phê",
        layout_data: tableMap // Gửi dưới dạng object với id thực tế
      }
      console.log('Dữ liệu gửi đi:', JSON.stringify(layoutData))
      try {
        let response;
        if (existingLayouts.length > 0) {
          // Cập nhật layout hiện có
          response = await fetch(`/layouts/${existingLayouts[0].id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(layoutData),
          })
        } else {
          // Tạo layout mới
          response = await fetch('/layouts/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(layoutData),
          })
        }
        if (response.ok) {
          toast.success('Layout đã được lưu thành công')
        } else {
          const errorText = await response.text();
          console.error('Lỗi khi lưu layout:', response.status, errorText);
          toast.error(`Lỗi khi lưu layout: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error('Lỗi khi lưu layout:', error)
        toast.error('Không thể kết nối đến server để lưu layout')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý sự kiện nhấn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang chỉnh sửa tên trong input
      if (isEditing) return;

      // Copy table (Ctrl+C)
      if (e.ctrlKey && e.key === 'c' && selectedTable) {
        setCopiedTable({...selectedTable})
        toast.success('Đã sao chép bàn')
      }
      
      // Paste table (Ctrl+V)
      if (e.ctrlKey && e.key === 'v' && copiedTable) {
        const newTable = {
          ...copiedTable,
          id: Date.now().toString(),
          name: `${copiedTable.name} (copy)`,
          x: copiedTable.x + 20,
          y: copiedTable.y + 20
        }
        setTables([...tables, newTable])
        setSelectedTable(newTable)
        toast.success('Đã dán bàn')
      }

      // Delete table (Delete key)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTable) {
        if (e.target instanceof HTMLInputElement) return;
        deleteTable(selectedTable.id)
        toast.success('Đã xóa bàn')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedTable, copiedTable, tables, isEditing])

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation() // Ngăn chặn sự kiện lan tỏa lên canvas
    setDraggedTable(tableId)
    const table = tables.find(t => t.id === tableId)
    if (table) {
      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
    setSelectedTable(tables.find(t => t.id === tableId) || null)
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedTable) {
      const canvas = canvasRef.current
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect()
        const updatedTables = tables.map(table => {
          if (table.id === draggedTable) {
            let newX = e.clientX - canvasRect.left - dragOffset.x
            let newY = e.clientY - canvasRect.top - dragOffset.y
            
            // Snap to grid if enabled
            if (showGrid) {
              newX = Math.round(newX / gridSize) * gridSize
              newY = Math.round(newY / gridSize) * gridSize
            }

            return {
              ...table,
              x: Math.max(0, Math.min(newX, canvasRect.width - table.width)),
              y: Math.max(0, Math.min(newY, canvasRect.height - table.height))
            }
          }
          return table
        })
        setTables(updatedTables)
      }
    } else if (isDrawing && drawStart) {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        setDrawEnd({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }
  
  // Hàm tìm id nhỏ nhất chưa dùng
  function getNextTableId(existingIds: (string|number)[]): number {
    let id = 1;
    const idSet = new Set(existingIds.map(i => Number(i)));
    while (idSet.has(id)) {
      id++;
    }
    return id;
  }

  const handleMouseUp = async () => {
    if (isDrawing && drawStart && drawEnd) {
      const width = Math.abs(drawEnd.x - drawStart.x)
      const height = Math.abs(drawEnd.y - drawStart.y)
      if (width > 20 && height > 20) {
        let x = Math.min(drawStart.x, drawEnd.x)
        let y = Math.min(drawStart.y, drawEnd.y)
        let newWidth = width
        let newHeight = height
        if (showGrid) {
          x = Math.round(x / gridSize) * gridSize
          y = Math.round(y / gridSize) * gridSize
          newWidth = Math.round(width / gridSize) * gridSize
          newHeight = Math.round(height / gridSize) * gridSize
        }
        // Gán id tạm thời duy nhất
        const newTableObj: Table = {
          id: `temp-${Date.now()}-${Math.random()}`,
          name: `Bàn mới`,
          x,
          y,
          width: newWidth,
          height: newHeight,
          type: drawingType
        }
        setTables([...tables, newTableObj])
        setSelectedTable(newTableObj)
        await createTableAPI(newTableObj) // Gọi API tạo bàn ngay sau khi vẽ
      }
    }
    setDraggedTable(null)
    setIsDrawing(false)
    setDrawStart(null)
    setDrawEnd(null)
  }
  
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDrawing(true)
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        setDrawStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }
  
  const deleteTable = async (id: string) => {
    setTables(tables.filter(table => table.id !== id))
    await deleteTableAPI(id)
    if (selectedTable && selectedTable.id === id) {
      setSelectedTable(null)
    }
  }

  const updateTable = async (id: string, updates: Partial<Table>) => {
    const updatedTables = tables.map(table => {
      if (table.id === id) {
        return { ...table, ...updates }
      }
      return table
    })
    setTables(updatedTables)
    const updatedTable = updatedTables.find(t => t.id === (updates.id || id))
    if (updatedTable) await updateTableAPI(updatedTable)
    if (selectedTable && selectedTable.id === id) {
      setSelectedTable({ ...selectedTable, ...updates })
    }
  }

  const handleDoubleClick = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation()
    setIsEditing(true)
    setTableName(table.name)
    // Cho phép chỉnh sửa tên bằng cách focus vào input
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus()
      }
    }, 0)
  }

  const handleNameChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTable && tableName.trim()) {
      updateTable(selectedTable.id, { name: tableName })
      setIsEditing(false)
    }
  }

  // Căn chỉnh bàn theo các hướng
  const alignTable = (direction: 'left' | 'right' | 'top' | 'bottom' | 'center-x' | 'center-y') => {
    if (!selectedTable || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const canvasRect = canvas.getBoundingClientRect()
    let updates: Partial<Table> = {}
    
    switch (direction) {
      case 'left':
        updates = { x: 0 }
        break
      case 'right':
        updates = { x: canvasRect.width - selectedTable.width }
        break
      case 'top':
        updates = { y: 0 }
        break
      case 'bottom':
        updates = { y: canvasRect.height - selectedTable.height }
        break
      case 'center-x':
        updates = { x: (canvasRect.width - selectedTable.width) / 2 }
        break
      case 'center-y':
        updates = { y: (canvasRect.height - selectedTable.height) / 2 }
        break
    }
    
    updateTable(selectedTable.id, updates)
  }
  
  // Đăng ký sự kiện window để dừng kéo khi ra khỏi canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp()
    }
    
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDrawing, drawStart, drawEnd, tables])

  // Tính toán kích thước và vị trí của hình chữ nhật khi vẽ
  const getDrawingRectStyle = () => {
    if (!drawStart || !drawEnd) return {}
    
    const x = Math.min(drawStart.x, drawEnd.x)
    const y = Math.min(drawStart.y, drawEnd.y)
    const width = Math.abs(drawEnd.x - drawStart.x)
    const height = Math.abs(drawEnd.y - drawStart.y)
    
    return {
      left: x,
      top: y,
      width,
      height,
      borderRadius: drawingType === 'circle' ? '50%' : drawingType === 'square' ? '4px' : '4px'
    }
  }

  // Vẽ lưới căn chỉnh
  const renderGrid = () => {
    if (!showGrid || !canvasRef.current) return null
    
    const canvas = canvasRef.current
    const canvasRect = canvas.getBoundingClientRect()
    const rows = Math.floor(canvasRect.height / gridSize)
    const cols = Math.floor(canvasRect.width / gridSize)
    
    const horizontalLines = []
    const verticalLines = []
    
    // Vẽ các đường ngang
    for (let i = 1; i < rows; i++) {
      horizontalLines.push(
        <div 
          key={`h-${i}`} 
          className="absolute w-full border-t border-gray-200 pointer-events-none" 
          style={{ top: i * gridSize }}
        />
      )
    }
    
    // Vẽ các đường dọc
    for (let i = 1; i < cols; i++) {
      verticalLines.push(
        <div 
          key={`v-${i}`} 
          className="absolute h-full border-l border-gray-200 pointer-events-none" 
          style={{ left: i * gridSize }}
        />
      )
    }
    
    return (
      <>
        {horizontalLines}
        {verticalLines}
      </>
    )
  }

  // Hàm gọi API tạo bàn mới
  async function createTableAPI(table: Table) {
    try {
      const tableData: any = { ...table };
      delete tableData.area;
      delete tableData.id;
      const res = await fetch('/tables/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableData.name,
          capacity: 4,
          status: 'empty',
          location: '',
          is_active: true,
          note: '',
        })
      })
      if (!res.ok) throw new Error('Không thể tạo bàn trên backend')
      const created = await res.json();
      // Cập nhật lại id thực tế vào state tables
      setTables(prev => prev.map(t =>
        t.id === table.id ? { ...t, id: created.id.toString() } : t
      ));
    } catch (err) {
      toast.error('Lỗi khi tạo bàn trên backend')
    }
  }
  // Hàm gọi API cập nhật bàn
  async function updateTableAPI(table: Table) {
    try {
      const { area, ...tableData } = table as any; // ép kiểu any để tránh lỗi linter
      const res = await fetch(`/tables/${tableData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableData.name,
          capacity: 4,
          status: 'empty',
          location: '',
          is_active: true,
          note: '',
        })
      })
      if (!res.ok) throw new Error('Không thể cập nhật bàn trên backend')
    } catch (err) {
      toast.error('Lỗi khi cập nhật bàn trên backend')
    }
  }
  // Hàm gọi API xóa bàn
  async function deleteTableAPI(id: string) {
    try {
      const res = await fetch(`/tables/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Không thể xóa bàn trên backend')
    } catch (err) {
      toast.error('Lỗi khi xóa bàn trên backend')
    }
  }

  return (
    <div className="space-y-8">
      {/* Hướng dẫn và công cụ vẽ */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-primary-900 mb-4">Công cụ vẽ layout</h2>
        <div className="mb-4 text-gray-700 text-sm">
          <p><strong>Hướng dẫn:</strong> Click và kéo chuột trên canvas để vẽ bàn mới. Chọn loại bàn phía dưới trước khi vẽ.</p>
          <p className="mt-1"><strong>Phím tắt:</strong> Ctrl+C để sao chép bàn, Ctrl+V để dán, Delete để xóa bàn. Nhấn đúp để đổi tên bàn.</p>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Loại bàn</label>
            <div className="flex space-x-3">
              <button
                onClick={() => setDrawingType('rectangle')}
                className={`px-4 py-2 rounded-lg ${drawingType === 'rectangle' ? 'bg-primary-600 text-white' : 'bg-white border border-primary-300 text-primary-700'}`}
              >
                Chữ nhật
              </button>
              <button
                onClick={() => setDrawingType('square')}
                className={`px-4 py-2 rounded-lg ${drawingType === 'square' ? 'bg-primary-600 text-white' : 'bg-white border border-primary-300 text-primary-700'}`}
              >
                Vuông
              </button>
              <button
                onClick={() => setDrawingType('circle')}
                className={`px-4 py-2 rounded-lg ${drawingType === 'circle' ? 'bg-primary-600 text-white' : 'bg-white border border-primary-300 text-primary-700'}`}
              >
                Tròn
              </button>
          </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-700">Lưới căn chỉnh</label>
            <div className="flex space-x-3 items-center">
              <label className="flex items-center space-x-2">
            <input
                  type="checkbox" 
                  checked={showGrid} 
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Hiện lưới</span>
              </label>
            <input
              type="number"
                value={gridSize} 
                onChange={(e) => setGridSize(Number(e.target.value))}
                min="5"
                max="50"
                className="w-20 rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-500">px</span>
          </div>
          </div>
        </div>
      </div>

      {/* Layout bàn */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Layout bàn</h2>
          <div className="text-sm text-gray-500">
            {tables.length > 0 ? `${tables.length} bàn trong layout` : 'Chưa có bàn nào'}
          </div>
        </div>
        <div className="p-6">
          <div 
            ref={canvasRef}
            className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 min-h-[500px] bg-gray-50"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
          >
            {renderGrid()}
          {tables.map((table) => (
            <div
              key={table.id}
                className={`absolute flex items-center justify-center cursor-move transition-all duration-200 ${
                selectedTable?.id === table.id
                    ? 'border-primary-500 bg-primary-50 shadow-lg z-10'
                    : 'border-gray-300 bg-white hover:border-primary-300 hover:shadow-md'
                } ${table.type === 'circle' ? 'rounded-full' : 'rounded-lg'} border-2`}
              style={{
                left: table.x,
                top: table.y,
                width: table.width,
                height: table.height,
              }}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
              onClick={() => setSelectedTable(table)}
                onDoubleClick={(e) => handleDoubleClick(e, table)}
              >
                {isEditing && selectedTable?.id === table.id ? (
                  <form onSubmit={handleNameChange} className="w-full h-full flex items-center justify-center">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      onBlur={handleNameChange}
                      className="w-3/4 text-center bg-transparent border-0 focus:ring-0 text-sm font-medium"
                      autoFocus
                    />
                  </form>
                ) : (
                  <span className="text-sm font-medium">{table.name}</span>
                )}
            </div>
          ))}
            {isDrawing && drawStart && drawEnd && (
              <div 
                className={`absolute border-2 border-primary-500 bg-primary-50 opacity-50 ${drawingType === 'circle' ? 'rounded-full' : ''}`}
                style={getDrawingRectStyle()} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Chi tiết bàn được chọn */}
      {selectedTable && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa bàn: {selectedTable.name}</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary-700">ID bàn (số, không trùng)</label>
                <input
                  type="number"
                  value={/^[0-9]+$/.test(selectedTable.id) ? selectedTable.id : ''}
                  min={1}
                  onChange={e => {
                    const newId = e.target.value;
                    if (tables.some(t => t.id === newId && t.id !== selectedTable.id)) {
                      toast.error('ID bàn đã tồn tại, hãy chọn số khác!')
                      return;
                    }
                    updateTable(selectedTable.id, { id: newId })
                  }}
                  disabled={!/^[0-9]+$/.test(selectedTable.id)}
                  placeholder={!/^[0-9]+$/.test(selectedTable.id) ? 'Đang tạo...' : undefined}
                  className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary-700">Tên bàn</label>
                <input
                  type="text"
                  value={selectedTable.name}
                  onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
                  className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary-700">Loại bàn</label>
                <select
                  value={selectedTable.type}
                  onChange={(e) => updateTable(selectedTable.id, { type: e.target.value as 'square' | 'circle' | 'rectangle' })}
                  className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                >
                  <option value="square">Vuông</option>
                  <option value="circle">Tròn</option>
                  <option value="rectangle">Chữ nhật</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary-700">Chiều rộng</label>
                <input
                  type="number"
                  value={selectedTable.width}
                  onChange={(e) => updateTable(selectedTable.id, { width: Number(e.target.value) })}
                  className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary-700">Chiều cao</label>
                <input
                  type="number"
                  value={selectedTable.height}
                  onChange={(e) => updateTable(selectedTable.id, { height: Number(e.target.value) })}
                  className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary-700">Vị trí X</label>
                <input
                  type="number"
                  value={selectedTable.x}
                  onChange={(e) => updateTable(selectedTable.id, { x: Number(e.target.value) })}
                  className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary-700">Vị trí Y</label>
                <input
                  type="number"
                  value={selectedTable.y}
                  onChange={(e) => updateTable(selectedTable.id, { y: Number(e.target.value) })}
                  className="w-full rounded-lg border-primary-200 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Căn chỉnh bàn</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => alignTable('left')}
                  className="bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50"
                >
                  Căn trái
                </button>
                <button
                  onClick={() => alignTable('center-x')}
                  className="bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50"
                >
                  Căn giữa ngang
                </button>
                <button
                  onClick={() => alignTable('right')}
                  className="bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50"
                >
                  Căn phải
                </button>
                <button
                  onClick={() => alignTable('top')}
                  className="bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50"
                >
                  Căn trên
                </button>
                <button
                  onClick={() => alignTable('center-y')}
                  className="bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50"
                >
                  Căn giữa dọc
                </button>
                <button
                  onClick={() => alignTable('bottom')}
                  className="bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50"
                >
                  Căn dưới
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => deleteTable(selectedTable.id)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Xóa bàn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách bàn */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách bàn</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên bàn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí X
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí Y
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kích thước
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.map((table) => (
                <tr key={table.id} className={`hover:bg-gray-50 ${selectedTable?.id === table.id ? 'bg-primary-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {table.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {table.type === 'square' ? 'Vuông' : table.type === 'circle' ? 'Tròn' : 'Chữ nhật'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {table.x}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {table.y}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {table.width} x {table.height}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      onClick={() => setSelectedTable(table)}
                    >
                      ✏️ Sửa
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => deleteTable(table.id)}
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-4">
        <button 
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center space-x-2"
          onClick={() => setTables([])}
        >
          <span>🗑️</span>
          <span>Xóa tất cả</span>
        </button>
        <button 
          className={`bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={saveLayout}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="inline-block animate-spin mr-2">⟳</span>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Lưu layout</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
} 