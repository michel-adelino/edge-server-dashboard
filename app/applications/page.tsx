'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Activity,
  Server,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Tag,
  Package,
  Cpu,
  MemoryStick,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useApplications } from '../../hooks/useApplications';
import { Application, ApplicationFilters } from '../../lib/balena';

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'running' | 'stopped' | 'all'>('all');

  // Build filters for API
  const apiFilters: ApplicationFilters | undefined = useMemo(() => {
    const filters: ApplicationFilters = {};
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    if (searchQuery) {
      filters.search = searchQuery;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [statusFilter, searchQuery]);

  const { applications, loading, error } = useApplications(apiFilters);

  // Applications are already filtered by the API, but we can do additional client-side filtering if needed
  const filteredApplications = useMemo(() => {
    return applications || [];
  }, [applications]);

  const stats = useMemo(() => ({
    total: applications.length,
    running: applications.filter((a) => a.status === 'running').length,
    stopped: applications.filter((a) => a.status === 'stopped').length,
    totalDevices: applications.reduce((sum, a) => sum + a.deviceCount, 0),
  }), [applications]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Applications
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage your applications and fleets
            </p>
          </div>
          <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            Create Application
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Applications" value={stats.total.toString()} />
          <StatCard
            title="Running"
            value={stats.running.toString()}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Stopped"
            value={stats.stopped.toString()}
            color="text-slate-400"
          />
          <StatCard
            title="Total Devices"
            value={stats.totalDevices.toString()}
            color="text-primary-600 dark:text-primary-400"
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
                  placeholder="Search applications by name..."
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
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredApplications.length > 0 ? (
            filteredApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))
          ) : (
            <div className="col-span-full rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Activity className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                No applications found
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your filters or create a new application.
              </p>
            </div>
          )}
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

function ApplicationCard({ application }: { application: typeof applications[0] }) {
  const statusConfig = {
    running: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30',
      label: 'Running',
    },
    stopped: {
      icon: XCircle,
      color: 'text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
      label: 'Stopped',
    },
  };

  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {application.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {application.deviceType}
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* Device Count */}
      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="flex items-center text-slate-600 dark:text-slate-400">
          <Server className="h-4 w-4 mr-1.5" />
          <span className="font-medium">{application.deviceCount}</span>
          <span className="ml-1">device{application.deviceCount !== 1 ? 's' : ''}</span>
        </div>
        {application.deviceCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 font-medium">
              {application.onlineDevices} online
            </span>
            {application.offlineDevices > 0 && (
              <span className="text-slate-400">
                • {application.offlineDevices} offline
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metrics */}
      {application.status === 'running' && application.deviceCount > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <Cpu className="h-4 w-4 mr-1.5" />
              CPU
            </div>
            <span className="font-medium text-slate-900 dark:text-white">
              {application.avgCpuUsage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${application.avgCpuUsage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <MemoryStick className="h-4 w-4 mr-1.5" />
              Memory
            </div>
            <span className="font-medium text-slate-900 dark:text-white">
              {application.avgMemoryUsage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${application.avgMemoryUsage}%` }}
            />
          </div>
        </div>
      )}

      {/* Release Info */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <div className="flex items-center text-slate-600 dark:text-slate-400">
          <Package className="h-4 w-4 mr-1.5" />
          Release {application.release}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-500">
          {application.commit.substring(0, 7)}
        </div>
      </div>

      {/* Tags */}
      {application.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {application.tags.map((tag) => (
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

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Updated {new Date(application.updatedAt).toLocaleDateString()}
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          View Details
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

