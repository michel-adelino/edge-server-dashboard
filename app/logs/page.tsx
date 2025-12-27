'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Server,
  Activity,
  AlertCircle,
  Info,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';
import { getDeviceLogs, DeviceLog } from '../../lib/balena/logs';
import { getDeviceIp } from '../../lib/balena/tags';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [applicationFilter, setApplicationFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { devices } = useDevices();

  // Load logs from all devices
  useEffect(() => {
    if (!devices || devices.length === 0) {
      setLoading(false);
      return;
    }

    const loadAllLogs = async () => {
      setLoading(true);
      setError(null);
      const allLogs: DeviceLog[] = [];

      for (const device of devices) {
        try {
          // Get device IP from tags
          const deviceIp = await getDeviceIp(device.id, device.uuid);
          if (!deviceIp) {
            console.warn(`No IP found for device ${device.name}, skipping logs`);
            continue;
          }

          // Fetch logs from Supervisor API
          const deviceLogs = await getDeviceLogs(deviceIp, {
            limit: 50,
          });

          // Enrich logs with device information
          const enrichedLogs = deviceLogs.map((log) => ({
            ...log,
            device: device.name,
            deviceId: device.id,
            application: device.application || 'unknown',
          }));

          allLogs.push(...enrichedLogs);
        } catch (err) {
          console.error(`Failed to load logs for device ${device.id}:`, err);
          // Continue with other devices even if one fails
        }
      }

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(allLogs);
      setLoading(false);
    };

    loadAllLogs();
  }, [devices]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesDevice = deviceFilter === 'all' || log.device === deviceFilter;
      const matchesApplication =
        applicationFilter === 'all' || log.application === applicationFilter;

      return matchesSearch && matchesLevel && matchesDevice && matchesApplication;
    });
  }, [logs, searchQuery, levelFilter, deviceFilter, applicationFilter]);

  const deviceNames = useMemo(() => {
    if (!devices) return [];
    return devices.map((d) => d.name);
  }, [devices]);

  const applicationNames = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.application)));
  }, [logs]);

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const stats = {
    total: logs.length,
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
  };

  return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Logs
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              View and monitor application logs from your devices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                // Reload logs
                if (devices) {
                  const allLogs: DeviceLog[] = [];
                  for (const device of devices) {
                    try {
                      const deviceIp = await getDeviceIp(device.id, device.uuid);
                      if (!deviceIp) continue;
                      const deviceLogs = await getDeviceLogs(deviceIp, { limit: 50 });
                      const enrichedLogs = deviceLogs.map((log) => ({
                        ...log,
                        device: device.name,
                        deviceId: device.id,
                        application: device.application || 'unknown',
                      }));
                      allLogs.push(...enrichedLogs);
                    } catch (err) {
                      console.error(`Failed to refresh logs for device ${device.id}:`, err);
                    }
                  }
                  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  setLogs(allLogs);
                }
                setLoading(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Logs" value={stats.total.toString()} />
          <StatCard
            title="Info"
            value={stats.info.toString()}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Warnings"
            value={stats.warn.toString()}
            color="text-yellow-600 dark:text-yellow-400"
          />
          <StatCard
            title="Errors"
            value={stats.error.toString()}
            color="text-red-600 dark:text-red-400"
          />
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Devices</option>
                {deviceNames.map((device) => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))}
              </select>

              <select
                value={applicationFilter}
                onChange={(e) => setApplicationFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Applications</option>
                {applicationNames.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600 mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Loading logs...
              </p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                Error loading logs
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {error.message}
              </p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  isExpanded={expandedLogs.has(log.id)}
                  onToggleExpand={() => toggleExpand(log.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                No logs found
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </div>
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

function LogRow({
  log,
  isExpanded,
  onToggleExpand,
}: {
  log: DeviceLog;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const levelConfig = {
    info: {
      icon: Info,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    warn: {
      icon: AlertCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
    },
    debug: {
      icon: Activity,
      color: 'text-slate-500',
      bg: 'bg-slate-100 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
    },
  };

  const config = levelConfig[log.level];
  const Icon = config.icon;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isExpanded ? config.bg : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 mt-1 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}
                >
                  {log.level.toUpperCase()}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Server className="h-3 w-3" />
                  <span>{log.device}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Activity className="h-3 w-3" />
                  <span>{log.application}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {log.service}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                {log.message}
              </p>
              {isExpanded && (
                <div className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {log.details}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(log.timestamp)}</span>
              </div>
              <button
                onClick={onToggleExpand}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

