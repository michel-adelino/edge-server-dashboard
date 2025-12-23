'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Server,
  Wifi,
  WifiOff,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Thermometer,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Tag,
  Package,
  Upload,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';
import { Device, DeviceFilters } from '../../lib/balena';

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'online' | 'offline' | 'idle' | 'all'>('all');
  const [applicationFilter, setApplicationFilter] = useState<string>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<'Raspberry Pi' | 'Compute Module' | 'all'>('all');

  // Build filters for API
  const apiFilters: DeviceFilters | undefined = useMemo(() => {
    const filters: DeviceFilters = {};
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    if (applicationFilter !== 'all') {
      filters.application = applicationFilter;
    }
    if (deviceTypeFilter !== 'all') {
      filters.deviceType = deviceTypeFilter;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [statusFilter, applicationFilter, deviceTypeFilter]);

  const { devices, loading, error } = useDevices(apiFilters);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Error Loading Devices
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Devices
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage and monitor your fleet of devices
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Devices" value={stats.total.toString()} />
          <StatCard
            title="Online"
            value={stats.online.toString()}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Offline"
            value={stats.offline.toString()}
            color="text-slate-400"
          />
          <StatCard
            title="Idle"
            value={stats.idle.toString()}
            color="text-yellow-600 dark:text-yellow-400"
          />
        </div>

        {/* Filters and Search */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search devices by name or UUID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | 'all')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="idle">Idle</option>
              </select>
            </div>

            {/* Application Filter */}
            <div className="flex items-center gap-2">
              <select
                value={applicationFilter}
                onChange={(e) => setApplicationFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Applications</option>
                {applications.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Type Filter */}
            <div className="flex items-center gap-2">
              <select
                value={deviceTypeFilter}
                onChange={(e) => setDeviceTypeFilter(e.target.value as DeviceTypeCategory | 'all')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Device Types</option>
                <option value="Raspberry Pi">Raspberry Pi</option>
                <option value="Compute Module">Compute Module</option>
              </select>
            </div>
          </div>
        </div>

        {/* Devices Table */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Venue IDs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    CPU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Memory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Storage
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
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
                    </td>
                  </tr>
                ) : filteredDevices.length > 0 ? (
                  filteredDevices.map((device) => (
                    <DeviceRow key={device.id} device={device} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center">
                      <Server className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                        No devices found
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Try adjusting your filters or search query.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  color = 'text-slate-900 dark:text-white',
}: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DeviceRow({ device }: { device: typeof devices[0] }) {
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
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {device.uuid.substring(0, 12)}...
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            device.deviceTypeCategory === 'Raspberry Pi'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {device.deviceTypeCategory}
          </span>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {device.deviceType}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
        {device.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {device.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {device.currentVersion}
          </span>
        </div>
        <button className="mt-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
          <Upload className="h-3 w-3" />
          Update
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900 dark:text-white">
          {device.application}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {device.osVersion}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {device.venueIds.length > 0 ? (
            device.venueIds.map((venueId) => (
              <span
                key={venueId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              >
                <MapPin className="h-3 w-3" />
                {venueId}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No venues</span>
          )}
        </div>
        <button className="mt-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Manage
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {device.status === 'online' ? (
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
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {device.status === 'online' ? (
          <div>
            <div className="flex items-center mb-1">
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
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {device.memoryUsed}MB / {device.memoryTotal}MB
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {device.status === 'online' ? (
          <div>
            <div className="flex items-center mb-1">
              <div className="w-16 bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{ width: `${device.storageUsage}%` }}
                />
              </div>
              <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                {device.storageUsage}%
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {device.storageUsed}GB / {device.storageTotal}GB
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {device.status === 'online' ? (
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
            <Thermometer className="h-4 w-4 mr-1" />
            {device.temperature}°C
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          {device.lastSeen}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <MoreVertical className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

