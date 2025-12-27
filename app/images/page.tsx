'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Package,
  Search,
  Filter,
  Upload,
  Server,
  CheckCircle2,
  Clock,
  Tag,
  Download,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useReleases } from '../../hooks/useReleases';
import { useDevices } from '../../hooks/useDevices';
import { Release, ReleaseFilters, Device } from '../../lib/balena';
import { deployReleaseToDevice } from '../../lib/balena/releases';

export default function ImagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [nameFilter, setNameFilter] = useState<string>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [deploying, setDeploying] = useState(false);

  // Build filters for API
  const apiFilters: ReleaseFilters | undefined = useMemo(() => {
    const filters: ReleaseFilters = {};
    if (nameFilter !== 'all') {
      filters.name = nameFilter;
    }
    if (deviceTypeFilter !== 'all') {
      filters.deviceType = deviceTypeFilter;
    }
    if (searchQuery) {
      filters.search = searchQuery;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [nameFilter, deviceTypeFilter, searchQuery]);

  const { releases, loading, error } = useReleases(apiFilters);
  const { devices } = useDevices();

  // Releases are already filtered by the API, but we can do additional client-side filtering if needed
  const filteredImages = useMemo(() => {
    return releases || [];
  }, [releases]);

  // Get unique image names and device types for filters
  const imageNames = useMemo(() => {
    if (!releases) return [];
    return Array.from(new Set(releases.map((r) => r.name))).sort();
  }, [releases]);

  const deviceTypes = useMemo(() => {
    if (!releases) return [];
    return Array.from(new Set(releases.map((r) => r.deviceType))).sort();
  }, [releases]);

  // Filter devices by selected release's device type
  const compatibleDevices = useMemo(() => {
    if (!selectedRelease || !devices) return [];
    return devices.filter((d) => d.deviceType === selectedRelease.deviceType);
  }, [selectedRelease, devices]);

  const handleDeploy = async (deviceId: string) => {
    if (!selectedRelease) return;

    try {
      setDeploying(true);
      await deployReleaseToDevice(deviceId, selectedRelease.id);
      setDeployModalOpen(false);
      setSelectedRelease(null);
      // Optionally refresh releases to update deployed counts
      window.location.reload();
    } catch (err) {
      console.error('Failed to deploy release:', err);
      alert(`Failed to deploy: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeploying(false);
    }
  };

  const stats = useMemo(() => {
    if (!releases) {
      return { total: 0, available: 0, deployed: 0 };
    }
    return {
      total: releases.length,
      available: releases.filter((img) => img.status === 'available').length,
      deployed: releases.reduce((sum, img) => sum + img.deployedDevices, 0),
    };
  }, [releases]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Error Loading Images
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
              Container Images
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage available container images and deploy to devices
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            <Upload className="h-4 w-4" />
            Push Image
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Images" value={stats.total.toString()} />
          <StatCard
            title="Available"
            value={stats.available.toString()}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Deployed Devices"
            value={stats.deployed.toString()}
            color="text-primary-600 dark:text-primary-400"
          />
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search images by name, tag, or repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Name Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Images</option>
                {imageNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Type Filter */}
            <select
              value={deviceTypeFilter}
              onChange={(e) => setDeviceTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Device Types</option>
              {deviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Images Table */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Device Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Deployed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
                    </td>
                  </tr>
                ) : filteredImages.length > 0 ? (
                  filteredImages.map((image) => (
                    <ImageRow key={image.id} image={image} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                        No images found
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Try adjusting your filters or push a new image.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deploy Modal */}
        {deployModalOpen && selectedRelease && (
          <DeployModal
            release={selectedRelease}
            devices={compatibleDevices}
            onClose={() => {
              setDeployModalOpen(false);
              setSelectedRelease(null);
            }}
            onDeploy={handleDeploy}
            deploying={deploying}
          />
        )}
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

function DeployModal({
  release,
  devices,
  onClose,
  onDeploy,
  deploying,
}: {
  release: Release;
  devices: Device[];
  onClose: () => void;
  onDeploy: (deviceId: string) => void;
  deploying: boolean;
}) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Deploy {release.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select a device to deploy this image to
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Device
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Choose a device...</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.status}) - {device.application}
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No compatible devices found for {release.deviceType}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div>
                <span className="font-medium">Image:</span> {release.name}:{release.tag}
              </div>
              <div>
                <span className="font-medium">Device Type:</span> {release.deviceType}
              </div>
              <div>
                <span className="font-medium">Repository:</span> {release.repository}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deploying}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedDeviceId && onDeploy(selectedDeviceId)}
            disabled={!selectedDeviceId || deploying}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deploying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Deploy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageRow({ image }: { image: Release }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {image.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {image.repository}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
          <Tag className="h-3 w-3" />
          {image.tag}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">
          {image.repository}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900 dark:text-white">
          {image.deviceType}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {image.size}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {image.deployedDevices} device{image.deployedDevices !== 1 ? 's' : ''}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          {formatDate(image.updatedAt)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedRelease(image);
              setDeployModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
            title="Deploy to Device"
          >
            <Upload className="h-3 w-3" />
            Deploy
          </button>
        </div>
      </td>
    </tr>
  );
}

