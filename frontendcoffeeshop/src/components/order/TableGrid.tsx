'use client'

import React, { useState, useEffect, useRef } from 'react'
import { TablePopup } from './TablePopup'
import { toast } from 'react-hot-toast'
import { OrderPopup } from './OrderPopup'
import { tables } from '../../config/tables'
import { Table } from '@/config/tables'

interface TableGridProps {
  onTableClick?: (x: number, y: number) => void;
  selectMode?: boolean;
  onTableSelect?: (tableId: number) => void;
  selectedTableId?: string | number;
}

interface TableItem {
  id: number;
  x: number;
  y: number;
  name?: string;
  width?: number;
  height?: number;
  type?: string;
  area?: string;
  status?: string;
}

interface TableStatus {
  id: number;
  status: string;
  orderId: string;
  totalAmount: number;
  time_in: string;
}

interface TableInfo {
  id: number;
  name: string;
}

export const TableGrid: React.FC<TableGridProps> = ({ onTableClick, selectMode = false, onTableSelect, selectedTableId }) => {
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [showOrderPopup, setShowOrderPopup] = useState(false)
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [tableInfos, setTableInfos] = useState<TableInfo[]>([])

  const fetchTableStatuses = async () => {
    try {
      console.log('Fetching table statuses...');
      // Sử dụng API proxy route
      const apiUrl = '/api/v1/orders/';
      console.log('API URL:', apiUrl);
      const response = await fetch(apiUrl)
      const data = await response.json()
      console.log('Raw orders data:', data);

      // Lọc các order có status là active hoặc pending
      const activeOrders = data.filter((order: any) =>
        order.status === 'active' || order.status === 'pending'
      )
      console.log('Filtered active orders:', activeOrders);

      // Cập nhật trạng thái bàn dựa trên order
      const newTableStatuses = activeOrders.map((order: any) => ({
        id: order.table_id,
        status: order.status,
        orderId: order.id,
        totalAmount: Number(order.total_amount || 0),
        time_in: order.time_in
      }))
      console.log('Processed table statuses:', newTableStatuses);

      setTableStatuses(newTableStatuses)
    } catch (error) {
      console.error('Error fetching table statuses:', error)
    }
  }

  useEffect(() => {
    // Load dữ liệu lần đầu
    fetchTableStatuses()

    // Load lại dữ liệu mỗi 30 giây
    const interval = setInterval(fetchTableStatuses, 30000)

    // Cleanup khi component unmount
    return () => {
      clearInterval(interval)
    }
  }, [])

  const getTableStatus = (tableId: number) => {
    const tableStatus = tableStatuses.find(t => t.id === tableId)
    return tableStatus ? tableStatus.status : 'available'
  }

  const getTableOrders = (tableId: number) => {
    return tableStatuses.filter(t => t.id === tableId)
  }

  const getTableColor = (tableId: number) => {
    const orders = getTableOrders(tableId)
    if (orders.length === 0) return '#38bbfc' // blue for available

    // Nếu có order pending thì ưu tiên hiển thị màu pending
    const hasPending = orders.some(order => order.status === 'pending')
    if (hasPending) return '#ffa500' // Orange for pending

    // Nếu không có pending thì hiển thị màu active
    return '#ff0000' // Red for active
  }

  const getTableName = (tableId: number) => {
    // Đầu tiên tìm trong mảng tables được import
    const tableFromConfig = tables.find(t => t.id === tableId);
    if (tableFromConfig) return tableFromConfig.name;

    // Nếu không tìm thấy, tìm trong mảng tables được định nghĩa trong renderGrid
    const tableFromRenderGrid = renderGridTables.find(t => t.id === tableId);
    return tableFromRenderGrid?.name || `Bàn ${tableId}`;
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (onTableClick) {
      onTableClick(x, y);
    }
  };

  const handleTableClick = (table: TableItem) => {
    if (selectMode && onTableSelect) {
      onTableSelect(table.id)
      return
    }
    const orders = getTableOrders(table.id)
    setSelectedTable(table)
    if (orders.length > 0) {
      setShowPopup(true)
      setShowOrderPopup(false)
    } else {
      setShowPopup(false)
      setShowOrderPopup(true)
    }
  }

  // Định nghĩa mảng tables cho renderGrid ở ngoài hàm renderGrid để có thể sử dụng ở hàm getTableName
  const renderGridTables = [
    { id: 1, x: 550, y: 275 },
    { id: 2, x: 650, y: 275 },
    { id: 3, x: 750, y: 275 },
    { id: 4, x: 850, y: 275 },
    { id: 5, x: 850, y: 385 },
    { id: 6, x: 950, y: 75 },
    { id: 7, x: 850, y: 0 },
    { id: 8, x: 750, y: 0 },
    { id: 9, x: 650, y: 0 },
    { id: 10, x: 550, y: 0 },
    { id: 11, x: 550, y: 150 },
    { id: 12, x: 650, y: 150 },
    { id: 13, x: 750, y: 150 },
    { id: 14, x: 850, y: 150 },
    { id: 15, x: 850, y: 555, name: "T5", width: 80, height: 45, type: "outdoor" },
    { id: 16, x: 750, y: 555, name: "T6", width: 80, height: 45, type: "outdoor" },
    { id: 17, x: 650, y: 555, name: "T7", width: 80, height: 45, type: "outdoor" },
    { id: 18, x: 550, y: 555, name: "T8", width: 80, height: 45, type: "outdoor" },
    { id: 19, x: 850, y: 485, name: "T4", width: 80, height: 45, type: "outdoor" },
    { id: 20, x: 750, y: 485, name: "T3", width: 80, height: 45, type: "outdoor" },
    { id: 21, x: 650, y: 485, name: "T2", width: 80, height: 45, type: "outdoor" },
    { id: 22, x: 550, y: 485, name: "T1", width: 80, height: 45, type: "outdoor" },
    { id: 23, x: 275, y: 0, name: "N1", width: 90, height: 90, type: "outdoor" },
    { id: 24, x: 275, y: 102, name: "N2", width: 90, height: 90, type: "outdoor" },
    { id: 25, x: 275, y: 202, name: "N3", width: 90, height: 90, type: "outdoor" },
    { id: 26, x: 275, y: 302, name: "N4", width: 90, height: 90, type: "outdoor" },
    { id: 27, x: 275, y: 408, name: "N5", width: 90, height: 90, type: "outdoor" },
    { id: 28, x: 275, y: 510, name: "N6", width: 90, height: 90, type: "outdoor" },
    { id: 29, x: 25, y: 0, name: "B1", width: 100, height: 100, type: "outdoor" },
    { id: 30, x: 25, y: 125, name: "B2", width: 100, height: 100, type: "outdoor" },
    { id: 31, x: 25, y: 250, name: "B3", width: 100, height: 100, type: "outdoor" },
    { id: 32, x: 25, y: 375, name: "B4", width: 100, height: 100, type: "outdoor" },
    { id: 33, x: 25, y: 500, name: "B5", width: 100, height: 100, type: "outdoor" },
    { id: 34, x: 150, y: 0, name: "B6", width: 100, height: 100, type: "outdoor" },
    { id: 35, x: 150, y: 125, name: "B7", width: 100, height: 100, type: "outdoor" },
    { id: 36, x: 150, y: 250, name: "B8", width: 100, height: 100, type: "outdoor" },
    { id: 37, x: 150, y: 375, name: "B9", width: 100, height: 100, type: "outdoor" },
    { id: 38, x: 150, y: 500, name: "B10", width: 100, height: 100, type: "outdoor" },
    { id: 39, x: 400, y: 0, name: "15", width: 90, height: 90, type: "outdoor" },
    { id: 40, x: 400, y: 102, name: "16", width: 90, height: 90, type: "outdoor" },
    { id: 41, x: 400, y: 202, name: "17", width: 90, height: 90, type: "outdoor" },
    { id: 42, x: 400, y: 302, name: "18", width: 90, height: 90, type: "outdoor" },
    { id: 43, x: 400, y: 408, name: "19", width: 90, height: 90, type: "outdoor" },
    { id: 44, x: 400, y: 510, name: "20", width: 90, height: 90, type: "outdoor" },
    { id: 45, x: 950, y: 250, name: "Mang về", width: 80, height: 300, type: "outdoor" },
  ];

  const renderGrid = () => {
    const gridLines: JSX.Element[] = [];

    // Sử dụng mảng tables đã định nghĩa ở trên
    renderGridTables.forEach(table => {
      let tableColor = getTableColor(table.id)
      if (selectMode && selectedTableId && String(table.id) === String(selectedTableId)) {
        tableColor = '#22c55e' // xanh lá cây
      }
      const tableName = table.name || getTableName(table.id)
      const orders = getTableOrders(table.id)

      gridLines.push(
        <g
          key={`table-${table.id}`}
          onClick={() => handleTableClick(table)}
          style={{ cursor: 'pointer' }}
          className="hover:opacity-80 transition-opacity"
        >
          <rect
            x={table.x}
            y={table.y}
            width={table.width || 80}
            height={table.height || 80}
            fill={tableColor}
            stroke="#333"
            strokeWidth={2}
          />
          <text
            x={table.x + (table.width || 80) / 2}
            y={table.y + (table.height || 80) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={16}
            fontWeight="bold"
            className="select-none"
          >
            {tableName}
          </text>
        </g>
      );
    });

    return gridLines;
  };

  return (
    <div className="relative w-full h-[1000px] bg-white rounded-lg shadow-lg overflow-hidden">
      <div
        className="relative w-full h-full"
        onClick={handleClick}
      >
        <svg width="2000" height="1000" className="absolute top-0 left-0">
          {renderGrid()}
        </svg>
      </div>
      {showOrderPopup && selectedTable && (
        <OrderPopup
          tableId={selectedTable.id}
          tableName={selectedTable.name || `Bàn ${selectedTable.id}`}
          onClose={() => {
            setShowOrderPopup(false)
          }}
        />
      )}
      {showPopup && selectedTable && (
        <TablePopup
          table={{
            id: selectedTable.id,
            name: selectedTable.name || `Bàn ${selectedTable.id}`,
            status: 'occupied',
            orders: getTableOrders(selectedTable.id).map(order => ({
              id: order.orderId,
              totalAmount: order.totalAmount,
              time_in: order.time_in,
              status: order.status
            }))
          }}
          onClose={() => {
            setShowPopup(false)
          }}
          onStatusChange={(newStatus) => {
            console.log('Table status changed to:', newStatus)
            setShowPopup(false)
          }}
        />
      )}
    </div>
  )
} 