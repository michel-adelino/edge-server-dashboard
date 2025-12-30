'use client';

import { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useReleasesApi, Release } from '../../hooks/useReleasesApi';
import { useApplications } from '../../hooks/useApplications';

export default function ImagesPage() {
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch applications for the selector
  const { applications } = useApplications();
  
  // Fetch releases for the selected application
  const { releases, loading, error } = useReleasesApi(selectedAppId || undefined);

  // Filter releases by search query
  const filteredReleases = useMemo(() => {
    if (!releases) return [];
    
    if (!searchQuery) return releases;
    
    const query = searchQuery.toLowerCase();
    return releases.filter((release) => 
      release.commit.toLowerCase().includes(query) ||
      release.version.toLowerCase().includes(query) ||
      release.applicationName.toLowerCase().includes(query) ||
      release.status.toLowerCase().includes(query)
    );
  }, [releases, searchQuery]);

  const stats = useMemo(() => {
    if (!releases) {
      return { total: 0, success: 0, failed: 0, final: 0 };
    }
    return {
      total: releases.length,
      success: releases.filter((r) => r.status === 'success').length,
      failed: releases.filter((r) => r.status === 'failed').length,
      final: releases.filter((r) => r.isFinal).length,
    };
  }, [releases]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Error Loading Releases
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
            Releases
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            View and manage application releases
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Releases" value={stats.total.toString()} />
        <StatCard
          title="Success"
          value={stats.success.toString()}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Failed"
          value={stats.failed.toString()}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Final"
          value={stats.final.toString()}
          color="text-primary-600 dark:text-primary-400"
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Application Selector */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Applications</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search by commit, version, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Releases Table */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  COMMIT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  CREATED AT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  VERSION
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  IS FINAL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  APPLICATION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
                  </td>
                </tr>
              ) : filteredReleases.length > 0 ? (
                filteredReleases.map((release) => (
                  <ReleaseRow key={release.id} release={release} />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                      {selectedAppId ? 'No releases found for this application' : 'No releases found'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedAppId ? 'Select a different application or create a new release.' : 'Select an application to view its releases.'}
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

function ReleaseRow({ release }: { release: Release }) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return dateString;
    }
  };

  const formatCommit = (commit: string) => {
    if (commit.length > 12) {
      return commit.substring(0, 12);
    }
    return commit;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    } else if (status === 'failed') {
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    return <Clock className="h-4 w-4 text-slate-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'success') {
      return 'text-green-600 dark:text-green-400';
    } else if (status === 'failed') {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 dark:text-white">
          {release.id}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Tag className="h-3 w-3 text-slate-400" />
          <span className="text-sm font-mono text-slate-900 dark:text-white">
            {formatCommit(release.commit)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          {formatDate(release.createdAt)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {getStatusIcon(release.status)}
          <span className={`text-sm font-medium capitalize ${getStatusColor(release.status)}`}>
            {release.status}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
          {release.version}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {release.isFinal ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            true
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            false
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900 dark:text-white">
          {release.applicationName}
        </div>
      </td>
    </tr>
  );
}
