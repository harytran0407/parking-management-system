import { TrendingUp, Users, ParkingCircle, DollarSign } from 'lucide-react'
import StatCard from '../../components/StatCard'

export default function ManagerDashboard() {
  return (
    <div className="animate-slide-in">
      <h2 className="section-title">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Capacity"
          value="450"
          icon={ParkingCircle}
          color="blue"
          trend={{ positive: true, value: '2.5' }}
        />
        <StatCard
          title="Available Slots"
          value="182"
          icon={ParkingCircle}
          color="green"
          trend={{ positive: true, value: '5.2' }}
        />
        <StatCard
          title="Occupied"
          value="268"
          icon={Users}
          color="red"
          trend={{ positive: false, value: '1.8' }}
        />
        <StatCard
          title="Today's Revenue"
          value="$2,450"
          icon={DollarSign}
          color="yellow"
          trend={{ positive: true, value: '12.5' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="subsection-title">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <span className="text-gray-300">Vehicle ABC-123 checked in</span>
              <span className="text-xs text-gray-400">2 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <span className="text-gray-300">Vehicle XYZ-789 checked out</span>
              <span className="text-xs text-gray-400">5 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <span className="text-gray-300">Slot B-05 marked under maintenance</span>
              <span className="text-xs text-gray-400">10 min ago</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="subsection-title">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full btn-primary justify-start">View Parking Slots</button>
            <button className="w-full btn-secondary justify-start">View Reports</button>
            <button className="w-full btn-secondary justify-start">Manage Pricing</button>
            <button className="w-full btn-secondary justify-start">Vehicle Types</button>
          </div>
        </div>
      </div>
    </div>
  )
}
