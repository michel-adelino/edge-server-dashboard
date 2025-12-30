'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  Wifi,
  WifiOff,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Thermometer,
  Clock,
  Tag,
  Package,
  Upload,
  MapPin,
  Loader2,
  Power,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';
import { Device, DeviceFilters } from '../../lib/balena';
import { getVenueIds, setVenueIds, getDeviceIp } from '../../lib/balena/tags';
import { rebootDevice, shutdownDevice, triggerUpdate } from '../../lib/balena/supervisor';

type DeviceStatus = 'online' | 'offline' | 'idle';
type DeviceTypeCategory = 'Raspberry Pi' | 'Compute Module';

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'online' | 'offline' | 'idle' | 'all'>('all');
  const [applicationFilter, setApplicationFilter] = useState<string>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<'Raspberry Pi' | 'Compute Module' | 'all'>('all');
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'reboot' | 'shutdown' | 'update' | 'move' | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

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

  const { devices: apiDevices, loading, error, refetch } = useDevices(apiFilters);

  // Dummy data for when API fails
  const dummyDevices: Device[] = useMemo(() => [
    {
      id: '1',
      name: 'Edge Server 1',
      uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      status: 'online' as const,
      application: 'Production Fleet',
      applicationId: 'app-1',
      deviceType: 'raspberrypi4',
      deviceTypeCategory: 'Raspberry Pi' as const,
      currentVersion: 'v2.1.0',
      cpuUsage: 45,
      memoryUsage: 62,
      memoryTotal: 4096,
      memoryUsed: 2540,
      storageUsage: 38,
      storageTotal: 64,
      storageUsed: 24.3,
      temperature: 52,
      lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
      tags: ['venue_id:venue-001', 'venue_id:venue-002'],
      osVersion: 'BalenaOS 2.98.0',
      supervisorVersion: '14.0.0',
      venueIds: ['venue-001', 'venue-002'],
    },
    {
      id: '2',
      name: 'Edge Server 2',
      uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      status: 'online' as const,
      application: 'Production Fleet',
      applicationId: 'app-1',
      deviceType: 'raspberrypi4',
      deviceTypeCategory: 'Raspberry Pi' as const,
      currentVersion: 'v2.1.0',
      cpuUsage: 32,
      memoryUsage: 48,
      memoryTotal: 4096,
      memoryUsed: 1966,
      storageUsage: 42,
      storageTotal: 64,
      storageUsed: 26.9,
      temperature: 48,
      lastSeen: new Date(Date.now() - 2 * 60000).toISOString(),
      tags: ['venue_id:venue-003'],
      osVersion: 'BalenaOS 2.98.0',
      supervisorVersion: '14.0.0',
      venueIds: ['venue-003'],
    },
    {
      id: '3',
      name: 'Edge Server 3',
      uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      status: 'offline' as const,
      application: 'Staging Fleet',
      applicationId: 'app-2',
      deviceType: 'raspberry-pi-cm4',
      deviceTypeCategory: 'Compute Module' as const,
      currentVersion: 'v2.0.5',
      cpuUsage: 0,
      memoryUsage: 0,
      memoryTotal: 4096,
      memoryUsed: 0,
      storageUsage: 35,
      storageTotal: 32,
      storageUsed: 11.2,
      temperature: 0,
      lastSeen: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      tags: ['venue_id:venue-004', 'venue_id:venue-005'],
      osVersion: 'BalenaOS 2.97.0',
      supervisorVersion: '13.9.0',
      venueIds: ['venue-004', 'venue-005'],
    },
    {
      id: '4',
      name: 'Edge Server 4',
      uuid: 'd4e5f6a7-b8c9-0123-def0-234567890123',
      status: 'idle' as const,
      application: 'Production Fleet',
      applicationId: 'app-1',
      deviceType: 'raspberrypi4',
      deviceTypeCategory: 'Raspberry Pi' as const,
      currentVersion: 'v2.1.0',
      cpuUsage: 12,
      memoryUsage: 28,
      memoryTotal: 4096,
      memoryUsed: 1147,
      storageUsage: 25,
      storageTotal: 64,
      storageUsed: 16.0,
      temperature: 42,
      lastSeen: new Date(Date.now() - 15 * 60000).toISOString(),
      tags: [],
      osVersion: 'BalenaOS 2.98.0',
      supervisorVersion: '14.0.0',
      venueIds: [],
    },
    {
      id: '5',
      name: 'Edge Server 5',
      uuid: 'e5f6a7b8-c9d0-1234-ef01-345678901234',
      status: 'online' as const,
      application: 'Development Fleet',
      applicationId: 'app-3',
      deviceType: 'raspberrypi4',
      deviceTypeCategory: 'Raspberry Pi' as const,
      currentVersion: 'v2.2.0-beta',
      cpuUsage: 78,
      memoryUsage: 85,
      memoryTotal: 4096,
      memoryUsed: 3482,
      storageUsage: 55,
      storageTotal: 64,
      storageUsed: 35.2,
      temperature: 65,
      lastSeen: new Date(Date.now() - 1 * 60000).toISOString(),
      tags: ['venue_id:venue-006'],
      osVersion: 'BalenaOS 2.99.0',
      supervisorVersion: '14.1.0',
      venueIds: ['venue-006'],
    },
  ], []);

  // Use dummy data if API fails, otherwise use real data
  const devices = error ? dummyDevices : (apiDevices || []);

  // Listen for venue modal open event from DeviceRow
  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvent = event as CustomEvent<Device>;
      setSelectedDevice(customEvent.detail);
      setVenueModalOpen(true);
    };
    window.addEventListener('openVenueModal', handleOpenModal);
    return () => window.removeEventListener('openVenueModal', handleOpenModal);
  }, []);


  const handleCloseVenueModal = () => {
    setVenueModalOpen(false);
    setSelectedDevice(null);
  };

  const handleSelectDevice = (deviceId: string) => {
    const newSelected = new Set(selectedDeviceIds);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDeviceIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDeviceIds.size === filteredDevices.length) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(filteredDevices.map((d) => d.id)));
    }
  };

  const handleBulkAction = async (action: 'reboot' | 'shutdown' | 'update' | 'move') => {
    if (selectedDeviceIds.size === 0) return;

    setBulkActionType(action);
    setBulkActionModalOpen(true);
  };

  const executeBulkAction = async () => {
    if (!bulkActionType || selectedDeviceIds.size === 0) return;

    setBulkActionLoading(true);
    const selectedDevices = filteredDevices.filter((d) => selectedDeviceIds.has(d.id));
    const onlineDevices = selectedDevices.filter((d) => d.status === 'online');

    try {
      for (const device of onlineDevices) {
        const deviceIp = await getDeviceIp(device.id, device.uuid);
        if (!deviceIp) continue;

        switch (bulkActionType) {
          case 'reboot':
            await rebootDevice(deviceIp);
            break;
          case 'shutdown':
            await shutdownDevice(deviceIp);
            break;
          case 'update':
            await triggerUpdate(deviceIp);
            break;
          case 'move':
            // Move to application - would need application selection
            break;
        }
      }

      alert(`Bulk ${bulkActionType} initiated for ${onlineDevices.length} device(s)`);
      setBulkActionModalOpen(false);
      setBulkActionType(null);
      setSelectedDeviceIds(new Set());
      refetch();
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert(`Failed to execute bulk action: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBulkActionLoading(false);
    }
  };


  // Calculate stats from devices
  const stats = useMemo(() => {
    if (!devices) {
      return { total: 0, online: 0, offline: 0, idle: 0 };
    }
    return {
      total: devices.length,
      online: devices.filter((d) => d.status === 'online').length,
      offline: devices.filter((d) => d.status === 'offline').length,
      idle: devices.filter((d) => d.status === 'idle').length,
    };
  }, [devices]);

  // Get unique applications for filter
  const applications = useMemo(() => {
    if (!devices) return [];
    return Array.from(new Set(devices.map((d) => d.application).filter(Boolean))).sort();
  }, [devices]);

  // Helper function to calculate uptime
  const calculateUptime = (lastSeen: string): string => {
    try {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
      if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
      return `${diffMinutes}m`;
    } catch {
      return 'Unknown';
    }
  };

  // Filter devices based on search and filters
  const filteredDevices = useMemo(() => {
    if (!devices) return [];
    return devices.filter((device) => {
      const matchesSearch =
        !searchQuery ||
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.application.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calculateUptime(device.lastSeen).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesApplication =
        applicationFilter === 'all' || device.application === applicationFilter;
      const matchesDeviceType =
        deviceTypeFilter === 'all' || device.deviceTypeCategory === deviceTypeFilter;

      return matchesSearch && matchesStatus && matchesApplication && matchesDeviceType;
    });
  }, [devices, searchQuery, statusFilter, applicationFilter, deviceTypeFilter]);

  // Show warning banner if using dummy data
  const showDummyDataWarning = error && !loading;

  return (
      <div className="space-y-6">
        {/* Dummy Data Warning */}
        {showDummyDataWarning && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  API Request Failed - Showing Dummy Data
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  {error?.message || 'Unable to connect to the API. Displaying sample data for demonstration.'}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
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

        {/* Bulk Actions Toolbar */}
        {selectedDeviceIds.size > 0 && (
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  {selectedDeviceIds.size} device{selectedDeviceIds.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedDeviceIds(new Set())}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMoveModal(true)}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary-300 bg-white text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50 dark:border-primary-700 dark:bg-slate-800 dark:text-primary-400"
                >
                  <Activity className="h-4 w-4" />
                  Move to Fleet
                </button>
                <button
                  onClick={() => handleBulkAction('update')}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary-300 bg-white text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50 dark:border-primary-700 dark:bg-slate-800 dark:text-primary-400"
                >
                  <RefreshCw className="h-4 w-4" />
                  Update
                </button>
                <button
                  onClick={() => handleBulkAction('reboot')}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary-300 bg-white text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50 dark:border-primary-700 dark:bg-slate-800 dark:text-primary-400"
                >
                  <Power className="h-4 w-4" />
                  Reboot
                </button>
                <button
                  onClick={() => handleBulkAction('shutdown')}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-700 dark:bg-slate-800 dark:text-red-400"
                >
                  <Power className="h-4 w-4" />
                  Shutdown
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Devices Table */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center"
                    >
                      {selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </th>
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
                    Uptime
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
                    <td colSpan={12} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
                    </td>
                  </tr>
                ) : filteredDevices.length > 0 ? (
                  filteredDevices.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      isSelected={selectedDeviceIds.has(device.id)}
                      onSelect={() => handleSelectDevice(device.id)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center">
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

        {/* Venue IDs Management Modal */}
        {venueModalOpen && selectedDevice && (
          <VenueModal
            device={selectedDevice}
            onClose={handleCloseVenueModal}
            onSave={async (venueIds: string[]) => {
              try {
                await setVenueIds(selectedDevice.id, venueIds);
                refetch();
                handleCloseVenueModal();
              } catch (err) {
                console.error('Failed to save venue IDs:', err);
                alert(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }
            }}
          />
        )}

        {/* Bulk Action Confirmation Modal */}
        {bulkActionModalOpen && bulkActionType && (
          <BulkActionModal
            action={bulkActionType}
            deviceCount={selectedDeviceIds.size}
            onConfirm={executeBulkAction}
            onCancel={() => {
              setBulkActionModalOpen(false);
              setBulkActionType(null);
            }}
            loading={bulkActionLoading}
          />
        )}

        {/* Move to Fleet Modal */}
        {showMoveModal && (
          <MoveToFleetModal
            deviceIds={Array.from(selectedDeviceIds)}
            applications={applications}
            onClose={() => setShowMoveModal(false)}
            onSuccess={() => {
              setShowMoveModal(false);
              setSelectedDeviceIds(new Set());
              refetch();
            }}
          />
        )}

      </div>
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

function DeviceRow({
  device,
  isSelected,
  onSelect,
}: {
  device: Device;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusConfig: Record<'online' | 'offline' | 'idle', { icon: typeof Wifi; color: string; bg: string; label: string }> = {
    online: { icon: Wifi, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Online' },
    offline: { icon: WifiOff, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Offline' },
    idle: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Idle' },
  };

  const config = statusConfig[device.status];
  const StatusIcon = config.icon;

  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={onSelect}
          className="flex items-center justify-center"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          ) : (
            <Square className="h-5 w-5 text-slate-400" />
          )}
        </button>
      </td>
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
            {device.tags.map((tag: string) => (
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
            device.venueIds.map((venueId: string) => (
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
        <button 
          onClick={() => {
            const event = new CustomEvent('openVenueModal', { detail: device });
            window.dispatchEvent(event);
          }}
          className="mt-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
        {device.status === 'online' ? (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {(() => {
              try {
                const lastSeenDate = new Date(device.lastSeen);
                const now = new Date();
                const diffMs = now.getTime() - lastSeenDate.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
                if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
                return `${diffMinutes}m`;
              } catch {
                return 'Unknown';
              }
            })()}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          {device.lastSeen}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <DeviceActionsMenu device={device} />
      </td>
    </tr>
  );
}

function VenueModal({
  device,
  onClose,
  onSave,
}: {
  device: Device;
  onClose: () => void;
  onSave: (venueIds: string[]) => Promise<void>;
}) {
  const [venueIds, setVenueIds] = useState<string[]>(device.venueIds || []);
  const [newVenueId, setNewVenueId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current venue IDs
    const loadVenueIds = async () => {
      try {
        const ids = await getVenueIds(device.id);
        setVenueIds(ids);
      } catch (err) {
        console.error('Failed to load venue IDs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVenueIds();
  }, [device.id]);

  const handleAdd = () => {
    if (newVenueId.trim() && !venueIds.includes(newVenueId.trim())) {
      setVenueIds([...venueIds, newVenueId.trim()]);
      setNewVenueId('');
    }
  };

  const handleRemove = (venueId: string) => {
    setVenueIds(venueIds.filter((id) => id !== venueId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(venueIds);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Manage Venue IDs
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {device.name}
          </p>
        </div>
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Add Venue ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVenueId}
                    onChange={(e) => setNewVenueId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Enter venue ID"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newVenueId.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Venue IDs ({venueIds.length})
                </label>
                {venueIds.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {venueIds.map((venueId) => (
                      <div
                        key={venueId}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {venueId}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemove(venueId)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <span className="text-sm">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No venue IDs configured
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeviceActionsMenu({
  device,
}: {
  device: Device;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setMenuOpen(false);
    setActionLoading(action);

    try {
      const deviceIp = await getDeviceIp(device.id, device.uuid);
      if (!deviceIp) {
        alert('Device IP not found. Please configure device IP in tags.');
        return;
      }

      switch (action) {
        case 'reboot':
          await rebootDevice(deviceIp);
          alert('Device reboot initiated');
          break;
        case 'shutdown':
          await shutdownDevice(deviceIp);
          alert('Device shutdown initiated');
          break;
        case 'update':
          await triggerUpdate(deviceIp);
          alert('Device update triggered');
          break;
        case 'details':
          router.push(`/devices/${device.id}`);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Failed to ${action} device:`, err);
      alert(`Failed to ${action} device: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded"
        disabled={actionLoading !== null}
      >
        {actionLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MoreVertical className="h-5 w-5" />
        )}
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-20 dark:border-slate-700 dark:bg-slate-800">
            <div className="py-1">
              <button
                onClick={() => handleAction('details')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
              <button
                onClick={() => {
                  router.push(`/devices/${device.id}?tab=logs`);
                  setMenuOpen(false);
                }}
                disabled={device.status !== 'online'}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="h-4 w-4" />
                View Logs
              </button>
              <button
                onClick={() => {
                  const event = new CustomEvent('openVenueModal', { detail: device });
                  window.dispatchEvent(event);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Manage Venues
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              <button
                onClick={() => handleAction('update')}
                disabled={device.status !== 'online' || actionLoading !== null}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4" />
                Trigger Update
              </button>
              <button
                onClick={() => handleAction('reboot')}
                disabled={device.status !== 'online' || actionLoading !== null}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Power className="h-4 w-4" />
                Reboot Device
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to shutdown this device?')) {
                    handleAction('shutdown');
                  } else {
                    setMenuOpen(false);
                  }
                }}
                disabled={device.status !== 'online' || actionLoading !== null}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Power className="h-4 w-4" />
                Shutdown Device
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BulkActionModal({
  action,
  deviceCount,
  onConfirm,
  onCancel,
  loading,
}: {
  action: 'reboot' | 'shutdown' | 'update' | 'move';
  deviceCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const actionLabels = {
    reboot: 'Reboot',
    shutdown: 'Shutdown',
    update: 'Trigger Update',
    move: 'Move to Application',
  };

  const actionDescriptions = {
    reboot: 'This will reboot the selected devices. They will come back online after restart.',
    shutdown: 'This will shutdown the selected devices. They will need to be manually powered on.',
    update: 'This will trigger an update check on the selected devices.',
    move: 'This will move the selected devices to a different application.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {actionLabels[action]} Devices
          </h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {actionDescriptions[action]}
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {deviceCount} device{deviceCount !== 1 ? 's' : ''} will be affected.
          </p>
          {action === 'shutdown' && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-xs text-red-600 dark:text-red-400">
                <strong>Warning:</strong> Shutting down devices will require manual power-on to bring them back online.
              </p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              action === 'shutdown'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm ${actionLabels[action]}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MoveToFleetModal({
  deviceIds,
  applications,
  onClose,
  onSuccess,
}: {
  deviceIds: string[];
  applications: Application[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedAppId, setSelectedAppId] = useState('');
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMove = async () => {
    if (!selectedAppId) {
      setError('Please select an application');
      return;
    }

    setMoving(true);
    setError(null);

    try {
      // Move each device to the selected application
      for (const deviceId of deviceIds) {
        const response = await fetch(`/api/devices/${deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            applicationId: selectedAppId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to move device ${deviceId}`);
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move devices');
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Move Devices to Fleet
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Move {deviceIds.length} device{deviceIds.length !== 1 ? 's' : ''} to a different fleet
          </p>
        </div>
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Application
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select an application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={moving}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={moving || !selectedAppId}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {moving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              'Move Devices'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
