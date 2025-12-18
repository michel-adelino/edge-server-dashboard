'use client';

import { useState } from 'react';
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
} from 'lucide-react';

// Dummy data
const devices = [
  {
    id: '1',
    name: 'raspberry-pi-01',
    uuid: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    status: 'online' as const,
    application: 'edge-monitoring',
    deviceType: 'Raspberry Pi 4',
    cpuUsage: 45,
    memoryUsage: 62,
    memoryTotal: 4096,
    memoryUsed: 2539,
    storageUsage: 68,
    storageTotal: 32,
    storageUsed: 21.8,
    temperature: 52,
    lastSeen: '2 minutes ago',
    tags: ['production', 'monitoring'],
    osVersion: 'balenaOS 2.98.0',
    supervisorVersion: '14.0.0',
  },
  {
    id: '2',
    name: 'raspberry-pi-02',
    uuid: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
    status: 'online' as const,
    application: 'edge-monitoring',
    deviceType: 'Raspberry Pi 4',
    cpuUsage: 32,
    memoryUsage: 48,
    memoryTotal: 4096,
    memoryUsed: 1966,
    storageUsage: 45,
    storageTotal: 32,
    storageUsed: 14.4,
    temperature: 48,
    lastSeen: '1 minute ago',
    tags: ['production', 'monitoring'],
    osVersion: 'balenaOS 2.98.0',
    supervisorVersion: '14.0.0',
  },
  {
    id: '3',
    name: 'raspberry-pi-03',
    uuid: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
    status: 'offline' as const,
    application: 'sensor-network',
    deviceType: 'Raspberry Pi 3B+',
    cpuUsage: 0,
    memoryUsage: 0,
    memoryTotal: 1024,
    memoryUsed: 0,
    storageUsage: 0,
    storageTotal: 16,
    storageUsed: 0,
    temperature: 0,
    lastSeen: '2 hours ago',
    tags: ['testing'],
    osVersion: 'balenaOS 2.97.0',
    supervisorVersion: '13.5.0',
  },
  {
    id: '4',
    name: 'raspberry-pi-04',
    uuid: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9',
    status: 'online' as const,
    application: 'sensor-network',
    deviceType: 'Raspberry Pi 4',
    cpuUsage: 78,
    memoryUsage: 85,
    memoryTotal: 4096,
    memoryUsed: 3482,
    storageUsage: 82,
    storageTotal: 32,
    storageUsed: 26.2,
    temperature: 65,
    lastSeen: 'Just now',
    tags: ['production', 'sensors'],
    osVersion: 'balenaOS 2.98.0',
    supervisorVersion: '14.0.0',
  },
  {
    id: '5',
    name: 'raspberry-pi-05',
    uuid: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    status: 'idle' as const,
    application: 'test-app',
    deviceType: 'Raspberry Pi 4',
    cpuUsage: 12,
    memoryUsage: 25,
    memoryTotal: 4096,
    memoryUsed: 1024,
    storageUsage: 28,
    storageTotal: 32,
    storageUsed: 9.0,
    temperature: 42,
    lastSeen: '5 minutes ago',
    tags: ['development'],
    osVersion: 'balenaOS 2.98.0',
    supervisorVersion: '14.0.0',
  },
];

type DeviceStatus = 'online' | 'offline' | 'idle';

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [applicationFilter, setApplicationFilter] = useState<string>('all');

  const applications = Array.from(new Set(devices.map(d => d.application)));

  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.uuid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesApplication =
      applicationFilter === 'all' || device.application === applicationFilter;

    return matchesSearch && matchesStatus && matchesApplication;
  });

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    idle: devices.filter(d => d.status === 'idle').length,
  };

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
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((device) => (
                    <DeviceRow key={device.id} device={device} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
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
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {device.deviceType}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {device.uuid.substring(0, 12)}...
            </div>
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
        <div className="text-sm text-slate-900 dark:text-white">
          {device.application}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {device.osVersion}
        </div>
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

