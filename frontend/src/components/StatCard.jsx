export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-900 text-blue-400 border-blue-700',
    green: 'bg-green-900 text-green-400 border-green-700',
    red: 'bg-red-900 text-red-400 border-red-700',
    yellow: 'bg-yellow-900 text-yellow-400 border-yellow-700',
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${
              trend.positive ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend.positive ? '↑' : '↓'} {trend.value}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}
