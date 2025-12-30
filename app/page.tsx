'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  Activity,
  Cpu,
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
  Package,
  MapPin,
  Loader2,
  Search,
  Plus,
  HardDrive,
  Bell,
} from 'lucide-react';
import { useDevices } from '../hooks/useDevices';
import { useApplications } from '../hooks/useApplications';
import { useReleasesApi } from '../hooks/useReleasesApi';
import { Device, Application } from '../lib/balena';
import ProvisioningKeyModal from './components/ProvisioningKeyModal';

export default function Home() {
  const router = useRouter();
  const { devices, loading: devicesLoading, error: devicesError } = useDevices();
  const { applications, loading: appsLoading, error: appsError } = useApplications();
  const { releases } = useReleasesApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProvisioningModal, setShowProvisioningModal] = useState(false);
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);

  // Mock activities - will be replaced with API calls in future
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

  // Calculate stats from API data
  const stats = useMemo(() => {
    if (!devices || !applications) {
      return {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        totalApplications: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        totalStorage: 0,
        totalStorageUsed: 0,
        recentDeploysSuccess: 0,
        recentDeploysFailed: 0,
        alertsCount: 0,
      };
    }
    const onlineDevices = devices.filter(d => d.status === 'online');
    const totalStorageUsed = devices.reduce((sum, d) => sum + (d.storageUsed || 0), 0);
    const totalStorage = devices.reduce((sum, d) => sum + (d.storageTotal || 0), 0);
    
    // Calculate recent deploys (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReleases = releases?.filter(r => {
      const createdAt = new Date(r.createdAt);
      return createdAt >= oneDayAgo;
    }) || [];
    const recentDeploysSuccess = recentReleases.filter(r => r.status === 'success').length;
    const recentDeploysFailed = recentReleases.filter(r => r.status === 'failed').length;
    
    // Calculate alerts (offline devices, high CPU, etc.)
    const alertsCount = devices.filter(d => 
      d.status === 'offline' || 
      (d.status === 'online' && (d.cpuUsage > 90 || d.memoryUsage > 90))
    ).length;
    
    return {
      totalDevices: devices.length,
      onlineDevices: onlineDevices.length,
      offlineDevices: devices.filter(d => d.status === 'offline').length,
      totalApplications: applications.length,
      avgCpuUsage: Math.round(
        onlineDevices.reduce((sum, d) => sum + (d.cpuUsage || 0), 0) /
        onlineDevices.length || 0
      ),
      avgMemoryUsage: Math.round(
        onlineDevices.reduce((sum, d) => sum + (d.memoryUsage || 0), 0) /
        onlineDevices.length || 0
      ),
      totalStorage: totalStorage,
      totalStorageUsed: totalStorageUsed,
      recentDeploysSuccess,
      recentDeploysFailed,
      alertsCount,
    };
  }, [devices, applications, releases]);
  
  // Filter devices and applications based on search
  const filteredDevices = useMemo(() => {
    if (!devices || !searchQuery) return devices || [];
    const query = searchQuery.toLowerCase();
    return devices.filter(d => 
      d.name.toLowerCase().includes(query) ||
      d.uuid.toLowerCase().includes(query) ||
      d.application.toLowerCase().includes(query)
    );
  }, [devices, searchQuery]);
  
  const filteredApplications = useMemo(() => {
    if (!applications || !searchQuery) return applications || [];
    const query = searchQuery.toLowerCase();
    return applications.filter(a => 
      a.name.toLowerCase().includes(query)
    );
  }, [applications, searchQuery]);

  const loading = devicesLoading || appsLoading;
  const error = devicesError || appsError;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/applications')}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Application
            </button>
            <button
              onClick={() => setShowProvisioningModal(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              Add Device
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search devices or fleets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
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
            title="Recent Deploys"
            value={`${stats.recentDeploysSuccess + stats.recentDeploysFailed}`}
            icon={Package}
            subtitle={`${stats.recentDeploysSuccess} success, ${stats.recentDeploysFailed} failed`}
            trend={`${stats.recentDeploysSuccess}/${stats.recentDeploysFailed}`}
          />
          <StatCard
            title="Storage Usage"
            value={stats.totalStorage > 0 ? `${(stats.totalStorageUsed / stats.totalStorage * 100).toFixed(0)}%` : '0%'}
            icon={HardDrive}
            subtitle={stats.totalStorage > 0 ? `${(stats.totalStorageUsed / 1024).toFixed(1)}GB / ${(stats.totalStorage / 1024).toFixed(1)}GB` : 'No data'}
            trend={stats.totalStorage > 0 ? `${(stats.totalStorageUsed / 1024).toFixed(1)}GB` : '0GB'}
          />
        </div>
        
        {/* Additional Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
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
          <StatCard
            title="Alerts"
            value={stats.alertsCount.toString()}
            icon={Bell}
            subtitle="Devices needing attention"
            trend={stats.alertsCount > 0 ? `${stats.alertsCount} active` : 'All clear'}
            color={stats.alertsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
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
            <button 
              onClick={() => router.push('/devices')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View all
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredDevices && filteredDevices.length > 0 ? (
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
                  {filteredDevices.slice(0, 5).map((device) => (
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
              <button 
                onClick={() => router.push('/applications')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                View all
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : filteredApplications && filteredApplications.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredApplications.slice(0, 3).map((app) => (
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
        
        {/* Provisioning Key Modal */}
        <ProvisioningKeyModal
          isOpen={showProvisioningModal}
          onClose={() => setShowProvisioningModal(false)}
        />
      </div>
  );
}

// Types
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
  color?: string;
}

function StatCard({ title, value, icon: Icon, subtitle, trend, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className={`mt-2 text-3xl font-bold ${color || 'text-slate-900 dark:text-white'}`}>
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {subtitle}
          </p>
        </div>
        <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900/30">
          <Icon className={`h-6 w-6 ${color || 'text-primary-600 dark:text-primary-400'}`} />
        </div>
      </div>
    </div>
  );
}

function DeviceRow({ device }: { device: Device }) {
  // Ensure required properties have defaults
  const deviceTypeCategory = device.deviceTypeCategory || 'Raspberry Pi';
  const currentVersion = device.currentVersion || 'unknown';
  const venueIds = device.venueIds || [];
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
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {device.uuid.substring(0, 12)}...
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                deviceTypeCategory === 'Raspberry Pi'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              }`}>
                {deviceTypeCategory}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <Package className="h-3 w-3" />
                {currentVersion}
              </span>
            </div>
            {venueIds.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {venueIds.slice(0, 2).map((venueId: string) => (
                  <span
                    key={venueId}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    {venueId}
                  </span>
                ))}
                {venueIds.length > 2 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    +{venueIds.length - 2} more
                  </span>
                )}
              </div>
            )}
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
