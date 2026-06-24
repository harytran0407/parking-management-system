export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }) {
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30',
    green: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400 border border-green-100 dark:border-green-900/30',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/30',
    yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30',
  }

  return (
    
    <div className="card transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
         
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
          
         
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{value}</p>
          
        
          {trend && (
            <p className={`text-xs mt-2 font-medium ${
              trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend.positive ? '↑' : '↓'} {trend.value}% <span className="text-slate-400 dark:text-slate-500 font-normal">from last month</span>
            </p>
          )}
        </div>
        
        
        {Icon && (
          <div className={`p-3 rounded-lg transition-colors duration-300 ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}