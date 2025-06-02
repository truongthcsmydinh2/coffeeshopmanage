interface CardProps {
  title: string
  value: string
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export function Card({ title, value, icon, trend, trendUp }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend}</span>
            <span className="ml-1">{trendUp ? '↑' : '↓'}</span>
          </div>
        )}
      </div>
    </div>
  )
} 