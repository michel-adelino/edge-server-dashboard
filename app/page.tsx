import DashboardLayout from './components/DashboardLayout';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Thermometer,
  MemoryStick,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

export default function Home() {
  // Mock data - will be replaced with API calls
  const devices: Device[] = [
    {
      id: '1',
      name: 'raspberry-pi-01',
      uuid: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      status: 'online',
      application: 'edge-monitoring',
      cpuUsage: 45,
      memoryUsage: 62,
      temperature: 52,
      lastSeen: '2 minutes ago',
    },
    {
      id: '2',
      name: 'raspberry-pi-02',
      uuid: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
      status: 'online',
      application: 'edge-monitoring',
      cpuUsage: 32,
      memoryUsage: 48,
      temperature: 48,
      lastSeen: '1 minute ago',
    },
    {
      id: '3',
      name: 'raspberry-pi-03',
      uuid: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
      status: 'offline',
      application: 'sensor-network',
      cpuUsage: 0,
      memoryUsage: 0,
      temperature: 0,
      lastSeen: '2 hours ago',
    },
    {
      id: '4',
      name: 'raspberry-pi-04',
      uuid: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9',
      status: 'online',
      application: 'sensor-network',
      cpuUsage: 78,
      memoryUsage: 85,
      temperature: 65,
      lastSeen: 'Just now',
    },
    {
      id: '5',
      name: 'raspberry-pi-05',
      uuid: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
      status: 'idle',
      application: 'test-app',
      cpuUsage: 12,
      memoryUsage: 25,
      temperature: 42,
      lastSeen: '5 minutes ago',
    },
  ];

  const applications: Application[] = [
    {
      id: '1',
      name: 'edge-monitoring',
      deviceCount: 2,
      release: 'v2.1.3',
      status: 'running',
    },
    {
      id: '2',
      name: 'sensor-network',
      deviceCount: 2,
      release: 'v1.8.2',
      status: 'running',
    },
    {
      id: '3',
      name: 'test-app',
      deviceCount: 1,
      release: 'v0.5.1',
      status: 'stopped',
    },
  ];

  const activities: Activity[] = [
    {
      type: 'deployment',
      message: 'Successfully deployed release v2.1.3 to edge-monitoring',
      timestamp: '10 minutes ago',
      device: 'raspberry-pi-01',
    },
    {
      type: 'device',
      message: 'Device raspberry-pi-04 came online',
      timestamp: '15 minutes ago',
      device: 'raspberry-pi-04',
    },
    {
      type: 'update',
      message: 'Application sensor-network updated to v1.8.2',
      timestamp: '1 hour ago',
    },
    {
      type: 'error',
      message: 'Device raspberry-pi-03 lost connection',
      timestamp: '2 hours ago',
      device: 'raspberry-pi-03',
    },
    {
      type: 'deployment',
      message: 'New release v1.8.2 created for sensor-network',
      timestamp: '3 hours ago',
    },
  ];

  // Calculate stats from dummy data
  const stats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status === 'online').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    totalApplications: applications.length,
    avgCpuUsage: Math.round(
      devices.filter(d => d.status === 'online').reduce((sum, d) => sum + d.cpuUsage, 0) /
      devices.filter(d => d.status === 'online').length || 0
    ),
    avgMemoryUsage: Math.round(
      devices.filter(d => d.status === 'online').reduce((sum, d) => sum + d.memoryUsage, 0) /
      devices.filter(d => d.status === 'online').length || 0
    ),
    totalStorage: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard
        </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Overview of your devices and applications
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Devices"
            value={stats.totalDevices.toString()}
            icon={Server}
            subtitle={`${stats.onlineDevices} online, ${stats.offlineDevices} offline`}
            trend={stats.totalDevices > 0 ? '+' + stats.totalDevices : '0'}
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications.toString()}
            icon={Activity}
            subtitle="Active fleets"
            trend={stats.totalApplications > 0 ? '+' + stats.totalApplications : '0'}
          />
          <StatCard
            title="CPU Usage"
            value={`${stats.avgCpuUsage}%`}
            icon={Cpu}
            subtitle="Average across devices"
            trend={stats.avgCpuUsage > 0 ? `${stats.avgCpuUsage}%` : '0%'}
          />
          <StatCard
            title="Memory Usage"
            value={`${stats.avgMemoryUsage}%`}
            icon={MemoryStick}
            subtitle="Average across devices"
            trend={stats.avgMemoryUsage > 0 ? `${stats.avgMemoryUsage}%` : '0%'}
          />
        </div>

        {/* Devices Table */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Devices
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {stats.totalDevices} total devices
              </p>
            </div>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              View all
            </button>
          </div>
          {devices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Application
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      CPU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Memory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Temperature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Last Seen
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {devices.map((device) => (
                    <DeviceRow key={device.id} device={device} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                No devices found
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Connect your first device to get started.
              </p>
            </div>
          )}
        </div>

        {/* Applications and Activity Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Applications Section */}
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Applications
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {stats.totalApplications} total applications
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View all
              </button>
            </div>
            {applications.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {applications.map((app) => (
                  <ApplicationRow key={app.id} application={app} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  No applications found
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create your first application to deploy.
                </p>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recent Activity
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Latest events and updates
                </p>
              </div>
            </div>
            {activities.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {activities.map((activity, index) => (
                  <ActivityRow key={index} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  No recent activity
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Activity will appear here as events occur.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Types
interface Device {
  id: string;
  name: string;
  uuid: string;
  status: 'online' | 'offline' | 'idle';
  application: string;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
  lastSeen: string;
}

interface Application {
  id: string;
  name: string;
  deviceCount: number;
  release: string;
  status: 'running' | 'stopped';
}

interface Activity {
  type: 'deployment' | 'device' | 'update' | 'error';
  message: string;
  timestamp: string;
  device?: string;
}

// Components
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  trend: string;
}

function StatCard({ title, value, icon: Icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {subtitle}
          </p>
        </div>
        <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900/30">
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    </div>
  );
}

function DeviceRow({ device }: { device: Device }) {
  const statusConfig = {
    online: { icon: Wifi, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Online' },
    offline: { icon: WifiOff, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Offline' },
    idle: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Idle' },
  };

  const config = statusConfig[device.status];
  const StatusIcon = config.icon;

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Server className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {device.name}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {device.uuid.substring(0, 8)}...
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
        {device.application || 'Unassigned'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-16 bg-slate-200 rounded-full h-2 dark:bg-slate-700">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${device.cpuUsage}%` }}
            />
          </div>
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
            {device.cpuUsage}%
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-16 bg-slate-200 rounded-full h-2 dark:bg-slate-700">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${device.memoryUsage}%` }}
            />
          </div>
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
            {device.memoryUsage}%
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
          <Thermometer className="h-4 w-4 mr-1" />
          {device.temperature}°C
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {device.lastSeen}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <MoreVertical className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

function ApplicationRow({ application }: { application: Application }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {application.name}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {application.deviceCount} device{application.deviceCount !== 1 ? 's' : ''} • Release {application.release}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            application.status === 'running'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {application.status === 'running' ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {application.status}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const typeConfig = {
    deployment: { icon: CheckCircle2, color: 'text-primary-500' },
    device: { icon: Server, color: 'text-blue-500' },
    update: { icon: Activity, color: 'text-green-500' },
    error: { icon: AlertCircle, color: 'text-red-500' },
  };

  const config = typeConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="px-6 py-4">
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-slate-900 dark:text-white">
            {activity.message}
          </p>
          {activity.device && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Device: {activity.device}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {activity.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}
