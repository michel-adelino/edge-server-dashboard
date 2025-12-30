'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Server,
  Wifi,
  WifiOff,
  AlertCircle,
  Thermometer,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Tag,
  MapPin,
  Loader2,
  ArrowLeft,
  X,
  FileText,
  Settings,
  Power,
  RefreshCw,
  Eye,
  Trash2,
  Package,
  Download,
  Play,
  Square,
  Activity,
} from 'lucide-react';
import { getDevice } from '../../../lib/balena/devices';
import { getDeviceIp, getVenueIds, setVenueIds as saveVenueIds } from '../../../lib/balena/tags';
import { getDeviceState, rebootDevice, shutdownDevice, triggerUpdate } from '../../../lib/balena/supervisor';
import { useDeviceMetrics } from '../../../hooks/useDeviceMetrics';
import { Device } from '../../../lib/balena';
import { getDeviceLogs } from '../../../lib/balena/logs';

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [deviceIp, setDeviceIp] = useState<string | null>(null);
  const [deviceState, setDeviceState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'logs' | 'services' | 'settings'>('overview');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // Check URL params for tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'metrics', 'logs', 'services', 'settings'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'metrics' | 'logs' | 'services' | 'settings');
    }
  }, []);

  const { metrics } = useDeviceMetrics(deviceId, deviceIp || undefined, {
    enabled: !!deviceIp && device?.status === 'online',
    refreshInterval: 10000, // 10 seconds
  });

  useEffect(() => {
    const loadDeviceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const deviceData = await getDevice(deviceId);
        setDevice(deviceData);

        const ip = await getDeviceIp(deviceId, deviceData.uuid);
        setDeviceIp(ip);

        if (ip && deviceData.status === 'online') {
          try {
            const state = await getDeviceState(ip);
            setDeviceState(state);
          } catch (err) {
            console.error('Failed to load device state:', err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load device'));
      } finally {
        setLoading(false);
      }
    };

    if (deviceId) {
      loadDeviceData();
    }
  }, [deviceId]);

  const handleAction = async (action: string) => {
    if (!device || !deviceIp) {
      alert('Device IP not found. Please configure device IP in tags.');
      return;
    }

    try {
      switch (action) {
        case 'reboot':
          await rebootDevice(deviceIp);
          alert('Device reboot initiated');
          break;
        case 'shutdown':
          if (confirm('Are you sure you want to shutdown this device?')) {
            await shutdownDevice(deviceIp);
            alert('Device shutdown initiated');
          }
          break;
        case 'update':
          await triggerUpdate(deviceIp);
          alert('Device update triggered');
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Failed to ${action} device:`, err);
      alert(`Failed to ${action} device: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Device Not Found
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {error?.message || 'The device you are looking for does not exist.'}
          </p>
          <button
            onClick={() => router.push('/devices')}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to Devices
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/devices')}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {device.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 font-mono">
                {device.uuid}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {device.status === 'online' && (
              <>
                <button
                  onClick={() => handleAction('update')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Trigger Update
                </button>
                <button
                  onClick={() => handleAction('reboot')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Power className="h-4 w-4" />
                  Reboot
                </button>
                <button
                  onClick={() => handleAction('shutdown')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Power className="h-4 w-4" />
                  Shutdown
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-4">
            {(['overview', 'metrics', 'logs', 'services', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && (
            <DeviceOverviewTab device={device} deviceState={deviceState} deviceIp={deviceIp} />
          )}
          {activeTab === 'metrics' && (
            <DeviceMetricsTab device={device} metrics={metrics} deviceIp={deviceIp} />
          )}
          {activeTab === 'logs' && (
            <DeviceLogsTab device={device} deviceIp={deviceIp} />
          )}
          {activeTab === 'services' && (
            <DeviceServicesTab device={device} deviceIp={deviceIp} deviceId={deviceId} />
          )}
          {activeTab === 'settings' && (
            <DeviceSettingsTab device={device} deviceId={deviceId} />
          )}
        </div>
      </div>
  );
}

function DeviceOverviewTab({
  device,
  deviceState,
  deviceIp,
}: {
  device: Device;
  deviceState: any;
  deviceIp: string | null;
}) {
  const router = useRouter();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [newName, setNewName] = useState(device.name);
  const [renaming, setRenaming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const statusConfig = {
    online: { icon: Wifi, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Online' },
    offline: { icon: WifiOff, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Offline' },
    idle: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Idle' },
  };

  const config = statusConfig[device.status];
  const StatusIcon = config.icon;

  // Calculate uptime
  const calculateUptime = () => {
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
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === device.name) {
      setShowRenameModal(false);
      return;
    }

    setRenaming(true);
    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to rename device');
      }

      setShowRenameModal(false);
      router.refresh();
    } catch (err) {
      alert(`Failed to rename device: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRenaming(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove device');
      }

      router.push('/devices');
    } catch (err) {
      alert(`Failed to remove device: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            setNewName(device.name);
            setShowRenameModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Tag className="h-4 w-4" />
          Rename Device
        </button>
        <button
          onClick={() => setShowRemoveModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
          Remove Device
        </button>
      </div>
      {/* Status Card */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Status</p>
              <p className={`text-sm ${config.color}`}>{config.label}</p>
            </div>
          </div>
          {deviceState && (
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Update Status</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {deviceState.update_pending ? 'Pending' : deviceState.update_downloaded ? 'Downloaded' : 'Up to date'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Device Information */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Device Type" value={device.deviceType} />
        <InfoCard label="Device Category" value={device.deviceTypeCategory} />
        <InfoCard label="Application" value={device.application} />
        <InfoCard label="Current Version" value={device.currentVersion} />
        <InfoCard label="OS Version" value={device.osVersion || 'Unknown'} />
        <InfoCard label="Supervisor Version" value={device.supervisorVersion || 'Unknown'} />
        {device.status === 'online' && (
          <InfoCard label="Uptime" value={calculateUptime()} />
        )}
        <InfoCard label="Last Seen" value={device.lastSeen} />
        <InfoCard label="Device IP" value={deviceIp || 'Not configured'} />
      </div>

      {/* Current Release & Services Info */}
      {device.status === 'online' && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
            Current Release & Services
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Release</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {device.currentVersion}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Services</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                View in Services tab
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Venue IDs */}
      {device.venueIds.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Venue IDs</h3>
          <div className="flex flex-wrap gap-2">
            {device.venueIds.map((venueId) => (
              <span
                key={venueId}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              >
                <MapPin className="h-3 w-3" />
                {venueId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {device.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {device.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Rename Device
              </h2>
            </div>
            <div className="px-6 py-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Device name"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRenameModal(false)}
                disabled={renaming}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={renaming || !newName.trim() || newName === device.name}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {renaming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Renaming...
                  </>
                ) : (
                  'Rename'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Remove Device
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Are you sure you want to remove <strong>{device.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                disabled={removing}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {removing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove Device
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceMetricsTab({
  device,
  metrics,
  deviceIp,
}: {
  device: Device;
  metrics: any;
  deviceIp: string | null;
}) {
  const [metricsHistory, setMetricsHistory] = useState<Array<{ timestamp: number; metrics: any }>>([]);

  useEffect(() => {
    if (metrics) {
      setMetricsHistory((prev) => {
        const newHistory = [...prev, { timestamp: Date.now(), metrics }];
        // Keep last 60 data points (10 minutes at 10s intervals)
        return newHistory.slice(-60);
      });
    }
  }, [metrics]);

  if (!deviceIp || device.status !== 'online') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Device must be online and have IP configured to view metrics
        </p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard
          label="CPU Usage"
          value={`${metrics.cpuUsage}%`}
          icon={Cpu}
          color="text-blue-600 dark:text-blue-400"
          percentage={metrics.cpuUsage}
        />
        <MetricCard
          label="Memory Usage"
          value={`${metrics.memoryUsage}%`}
          subValue={`${metrics.memoryUsed}MB / ${metrics.memoryTotal}MB`}
          icon={MemoryStick}
          color="text-purple-600 dark:text-purple-400"
          percentage={metrics.memoryUsage}
        />
        <MetricCard
          label="Storage Usage"
          value={`${metrics.storageUsage}%`}
          subValue={`${metrics.storageUsed}GB / ${metrics.storageTotal}GB`}
          icon={HardDrive}
          color="text-green-600 dark:text-green-400"
          percentage={metrics.storageUsage}
        />
        <MetricCard
          label="Temperature"
          value={`${metrics.temperature}°C`}
          icon={Thermometer}
          color="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Metrics Charts */}
      {metricsHistory.length > 1 && (
        <div className="grid gap-6 md:grid-cols-2">
          <MetricsChart
            title="CPU Usage Over Time"
            data={metricsHistory.map((h) => ({ time: h.timestamp, value: h.metrics.cpuUsage }))}
            color="blue"
            unit="%"
          />
          <MetricsChart
            title="Memory Usage Over Time"
            data={metricsHistory.map((h) => ({ time: h.timestamp, value: h.metrics.memoryUsage }))}
            color="purple"
            unit="%"
          />
          <MetricsChart
            title="Storage Usage Over Time"
            data={metricsHistory.map((h) => ({ time: h.timestamp, value: h.metrics.storageUsage }))}
            color="green"
            unit="%"
          />
          <MetricsChart
            title="Temperature Over Time"
            data={metricsHistory.map((h) => ({ time: h.timestamp, value: h.metrics.temperature }))}
            color="red"
            unit="°C"
          />
        </div>
      )}
    </div>
  );
}

function DeviceLogsTab({ device, deviceIp }: { device: Device; deviceIp: string | null }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (deviceIp && device.status === 'online') {
      loadLogs();
    }
  }, [deviceIp, device.status]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const deviceLogs = await getDeviceLogs(deviceIp!, { limit: 100 });
      setLogs(deviceLogs);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!streaming || !deviceIp || device.status !== 'online') return;

    // Poll for new logs every 5 seconds
    const interval = setInterval(async () => {
      try {
        const deviceLogs = await getDeviceLogs(deviceIp, { limit: 100 });
        setLogs(deviceLogs);
      } catch (err) {
        console.error('Failed to stream logs:', err);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [streaming, deviceIp, device.status]);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = logFilter === 'all' || log.level === logFilter;
    const matchesService = serviceFilter === 'all' || log.service === serviceFilter;
    return matchesLevel && matchesService;
  });

  const services = Array.from(new Set(logs.map((log) => log.service)));

  if (!deviceIp || device.status !== 'online') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Device must be online and have IP configured to view logs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Log Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const logText = filteredLogs.map(log => 
                `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.service}] ${log.message}`
              ).join('\n');
              const blob = new Blob([logText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${device.name}-logs-${new Date().toISOString()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Logs
          </button>
          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value as typeof logFilter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All Services</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Auto-scroll
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {streaming ? (
            <button
              onClick={() => setStreaming(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Stop Streaming
            </button>
          ) : (
            <button
              onClick={() => setStreaming(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Start Streaming
            </button>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 max-h-[600px] overflow-y-auto p-4">
        {loading && logs.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600 mb-4" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading logs...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <>
            {filteredLogs.map((log, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                log.level === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                log.level === 'warn' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {log.level.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-900 dark:text-white">{log.message}</p>
            {log.details && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{log.details}</p>
            )}
            </div>
          ))}
            <div ref={logsEndRef} />
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-sm text-slate-600 dark:text-slate-400">No logs available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceServicesTab({
  device,
  deviceIp,
  deviceId,
}: {
  device: Device;
  deviceIp: string | null;
  deviceId: string;
}) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      if (!deviceIp || device.status !== 'online') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/devices/${deviceId}/services`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to load services');
        }

        const data = await response.json();
        setServices(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load services'));
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [deviceId, deviceIp, device.status]);

  const handleServiceAction = async (serviceId: string, action: 'restart' | 'stop' | 'start') => {
    setActionLoading(serviceId);
    try {
      const response = await fetch(`/api/devices/${deviceId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ serviceId, action }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} service`);
      }

      // Reload services
      const servicesResponse = await fetch(`/api/devices/${deviceId}/services`, {
        credentials: 'include',
      });
      if (servicesResponse.ok) {
        const data = await servicesResponse.json();
        setServices(data);
      }
    } catch (err) {
      alert(`Failed to ${action} service: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!deviceIp || device.status !== 'online') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Device must be online and have IP configured to view services
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
          Error loading services
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  CPU Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Memory Usage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {services.length > 0 ? (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {service.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {service.image}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        service.status === 'Running' || service.status === 'running'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {service.cpuUsage > 0 ? `${service.cpuUsage}%` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {service.memoryUsage > 0 ? (
                        <div>
                          <div className="text-sm">{service.memoryUsage}MB</div>
                          {service.memoryLimit > 0 && (
                            <div className="text-xs text-slate-500">
                              / {service.memoryLimit}MB
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {service.status === 'Running' || service.status === 'running' ? (
                          <>
                            <button
                              onClick={() => handleServiceAction(service.id, 'restart')}
                              disabled={actionLoading === service.id}
                              className="p-1.5 rounded text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 disabled:opacity-50"
                              title="Restart service"
                            >
                              {actionLoading === service.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleServiceAction(service.id, 'stop')}
                              disabled={actionLoading === service.id}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                              title="Stop service"
                            >
                              {actionLoading === service.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleServiceAction(service.id, 'start')}
                            disabled={actionLoading === service.id}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 disabled:opacity-50"
                            title="Start service"
                          >
                            {actionLoading === service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                      No services found
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Services will appear here when the device is running containers.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeviceSettingsTab({
  device,
  deviceId,
}: {
  device: Device;
  deviceId: string;
}) {
  const [venueIds, setVenueIds] = useState<string[]>(device.venueIds || []);
  const [newVenueId, setNewVenueId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVenueIds = async () => {
      try {
        const ids = await getVenueIds(deviceId);
        setVenueIds(ids);
      } catch (err) {
        console.error('Failed to load venue IDs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVenueIds();
  }, [deviceId]);

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
      await saveVenueIds(deviceId, venueIds);
      alert('Venue IDs saved successfully');
    } catch (err) {
      console.error('Failed to save venue IDs:', err);
      alert(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Device Name</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{device.name}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">UUID</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{device.uuid}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Venue IDs</h3>
        <div className="mb-4">
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
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
        ) : venueIds.length > 0 ? (
          <div className="space-y-2 mb-4">
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No venue IDs configured</p>
        )}
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
            'Save Venue IDs'
          )}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
  percentage,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  color: string;
  percentage?: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`text-lg font-semibold ${color}`}>{value}</p>
            {subValue && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subValue}</p>
            )}
            {percentage !== undefined && (
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                <div
                  className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsChart({
  title,
  data,
  color,
  unit,
}: {
  title: string;
  data: Array<{ time: number; value: number }>;
  color: 'blue' | 'purple' | 'green' | 'red';
  unit: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">{title}</h3>
      <div className="h-32 flex items-end gap-1">
        {data.map((point, index) => {
          const height = ((point.value - minValue) / range) * 100;
          return (
            <div
              key={index}
              className={`flex-1 ${colorClasses[color]} rounded-t transition-all`}
              style={{ height: `${height}%` }}
              title={`${point.value}${unit} at ${new Date(point.time).toLocaleTimeString()}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{new Date(data[0]?.time || 0).toLocaleTimeString()}</span>
        <span>{new Date(data[data.length - 1]?.time || 0).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

