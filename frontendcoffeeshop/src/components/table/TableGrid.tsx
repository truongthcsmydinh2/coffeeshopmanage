import React from 'react';
import { Table } from '@/types/table';

interface TableGridProps {
    onTableSelect: (tableId: number) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({ onTableSelect }) => {
    const [tables, setTables] = React.useState<Table[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch('/api/v1/tables/');
                const data = await response.json();
                setTables(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tables:', error);
                setError('Không thể tải danh sách bàn');
                setLoading(false);
            }
        };

        fetchTables();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map(table => (
                <button
                    key={table.id}
                    onClick={() => onTableSelect(table.id)}
                    className={`p-4 rounded-lg shadow-md transition-colors ${
                        table.status === 'occupied'
                            ? 'bg-red-100 hover:bg-red-200'
                            : 'bg-green-100 hover:bg-green-200'
                    }`}
                >
                    <div className="text-center">
                        <h3 className="font-semibold text-lg">{table.name}</h3>
                        <p className="text-sm">
                            {table.status === 'occupied' ? 'Đã có người' : 'Trống'}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}; 