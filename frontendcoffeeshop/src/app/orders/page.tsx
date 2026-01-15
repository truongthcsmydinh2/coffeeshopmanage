"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Search, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Order } from "@/types/order";
import { OrderList } from "@/components/order/OrderList";
import { OrderDetails } from "@/components/order/OrderDetails";
import { OrderActions } from "@/components/order/OrderActions";
import { OrderStats } from "@/components/order/OrderStats";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalAmount: 0
  });

  // Fetch orders
  const fetchOrders = async (selectedDate?: Date) => {
    try {
      setIsLoading(true);
      const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      console.log("Fetching orders for date:", dateStr);
      
      const response = await fetch(`/api/v1/complete-orders/?date=${dateStr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://192.168.99.166:3001'
        },
        mode: 'cors',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error("Failed to fetch orders");
      
      const data = await response.json();
      console.log("Orders data:", data);
      setOrders(data);
      
      // Calculate stats
      const newStats = {
        total: data.length,
        completed: data.filter((o: Order) => o.status === "completed").length,
        pending: data.filter((o: Order) => o.status === "pending").length,
        totalAmount: data.reduce((sum: number, o: Order) => sum + (o.total_amount || 0), 0)
      };
      setStats(newStats);
      
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders(date);
  }, [date]);

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => 
    order.order_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.table_id.toString().includes(searchQuery)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => fetchOrders(date)} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <OrderStats stats={stats} />

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Tìm kiếm theo mã đơn hoặc số bàn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Bộ lọc
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Order List */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderList 
                orders={filteredOrders}
                selectedOrder={selectedOrder}
                onSelectOrder={setSelectedOrder}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOrder ? (
                <OrderDetails order={selectedOrder} />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Chọn một đơn hàng để xem chi tiết
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Actions */}
          {selectedOrder && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Thao tác</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderActions 
                  order={selectedOrder}
                  onUpdate={() => fetchOrders(date)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 