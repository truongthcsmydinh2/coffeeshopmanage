export interface Shift {
    id: number;
    staff_id: number;
    staff_id_2?: number;
    staff_name: string;
    staff2_name?: string;
    shift_type: string;
    start_time: string;
    end_time: string | null;
    initial_cash: number | null;
    end_cash: number | null;
    staff1_start_order_number: number | null;
    staff1_end_order_number: number | null;
    staff1_calculated_total_orders: number | null;
    staff2_start_order_number: number | null;
    staff2_end_order_number: number | null;
    staff2_calculated_total_orders: number | null;
    total_shift_orders: number | null;
    status: string;
    note: string | null;
    is_active: boolean;
} 