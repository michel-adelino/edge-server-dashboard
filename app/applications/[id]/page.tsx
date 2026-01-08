'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Server,
  Package,
  Settings,
  Loader2,
  AlertCircle,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Tag as TagIcon,
  Key,
  Save,
  X,
} from 'lucide-react';

interface FleetDevice {
  id: string;
  name: string;
  uuid: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

interface FleetRelease {
  id: string;
  commit: string;
  createdAt: string;
  status: string;
  version: string;
  isFinal: boolean;
  isDeployed?: boolean;
  deployedDeviceCount?: number;
}

interface EnvVar {
  id: string;
  name: string;
  value: string;
}

interface FleetTag {
  id: string;
  key: string;
  value: string;
}

interface FleetData {
  id: string;
  name: string;
  slug: string;
  deviceType: string;
  deviceCount: number;
  devices: FleetDevice[];
  releases: FleetRelease[];
  envVars: EnvVar[];
  tags: FleetTag[];
  createdAt: string;
  updatedAt: string;
}

export default function FleetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fleetId = params.id as string;
  
  const [fleet, setFleet] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'devices' | 'releases' | 'config'>('details');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadFleet = async () => {
      if (!fleetId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/applications/${fleetId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to load fleet');
        }
        
        const data = await response.json();
        
        setFleet(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load fleet'));
      } finally {
        setLoading(false);
      }
    };

    loadFleet();
  }, [fleetId, refreshTrigger]);

  const refreshFleet = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/applications/${fleetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete fleet');
      }
      
      router.push('/applications');
    } catch (err) {
      alert(`Failed to delete fleet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !fleet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {error?.message || 'Fleet Not Found'}
          </h2>
          <button
            onClick={() => router.push('/applications')}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to Applications
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
            onClick={() => router.push('/applications')}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {fleet.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {fleet.deviceType} • {fleet.deviceCount} device{fleet.deviceCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Export config functionality
              const config = {
                name: fleet.name,
                deviceType: fleet.deviceType,
                envVars: fleet.envVars,
                tags: fleet.tags,
              };
              const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${fleet.slug}-config.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Config
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete Fleet
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-4">
          {(['details', 'devices', 'releases', 'config'] as const).map((tab) => (
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

      {/* Tab Content */}
      <div>
        {activeTab === 'details' && <DetailsTab fleet={fleet} />}
        {activeTab === 'devices' && <DevicesTab devices={fleet.devices} />}
        {activeTab === 'releases' && <ReleasesTab releases={fleet.releases} fleetId={fleetId} onDeploySuccess={refreshFleet} />}
        {activeTab === 'config' && <ConfigTab envVars={fleet.envVars} tags={fleet.tags} fleetId={fleetId} onUpdateSuccess={refreshFleet} />}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Delete Fleet
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Are you sure you want to delete <strong>{fleet.name}</strong>? This action cannot be undone and will affect all devices in this fleet.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  handleDelete();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Fleet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsTab({ fleet }: { fleet: FleetData }) {
  const onlineDevices = fleet.devices.filter(d => d.status === 'online').length;
  const offlineDevices = fleet.devices.filter(d => d.status === 'offline').length;
  const latestRelease = fleet.releases.length > 0 ? fleet.releases[0] : null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Devices</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{fleet.deviceCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Online Devices</p>
          <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{onlineDevices}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Releases</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{fleet.releases.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Environment Variables</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{fleet.envVars.length}</p>
        </div>
      </div>

      {/* Fleet Information */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fleet Information</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Fleet ID</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white font-mono">{fleet.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Slug</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white font-mono">{fleet.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Device Type</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">{fleet.deviceType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Devices</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">{fleet.deviceCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Online Devices</dt>
              <dd className="mt-1 text-sm text-green-600 dark:text-green-400">{onlineDevices}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Offline Devices</dt>
              <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{offlineDevices}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Releases</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">{fleet.releases.length}</dd>
            </div>
            {latestRelease && (
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Latest Release</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                  {latestRelease.version} ({latestRelease.commit.substring(0, 7)})
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Environment Variables</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">{fleet.envVars.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Tags</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">{fleet.tags.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Created At</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(fleet.createdAt)}
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(fleet.updatedAt)}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Device Status Summary */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Device Status</h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">Online</span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">{onlineDevices} devices</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">Offline</span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">{offlineDevices} devices</span>
            </div>
            {fleet.deviceCount > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status Distribution</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {Math.round((onlineDevices / fleet.deviceCount) * 100)}% online
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                  <div
                    className="bg-green-600 h-2 rounded-full dark:bg-green-500 transition-all"
                    style={{ width: `${(onlineDevices / fleet.deviceCount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DevicesTab({ devices }: { devices: FleetDevice[] }) {
  return (
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
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {devices.length > 0 ? (
              devices.map((device) => (
                <tr key={device.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Server className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {device.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {device.uuid.substring(0, 12)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      device.status === 'online'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {device.status === 'online' ? (
                        <Wifi className="h-3 w-3" />
                      ) : (
                        <WifiOff className="h-3 w-3" />
                      )}
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(device.lastSeen).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <Server className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    No devices in this fleet
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReleasesTab({ releases, fleetId, onDeploySuccess }: { releases: FleetRelease[]; fleetId: string; onDeploySuccess?: () => void }) {
  const [deploying, setDeploying] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');
  const [deployMessage, setDeployMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDeploy = async () => {
    if (!selectedReleaseId) {
      setDeployMessage({ type: 'error', text: 'Please select a release to deploy' });
      return;
    }

    setDeploying(true);
    setDeployMessage(null);
    try {
      const response = await fetch(`/api/applications/${fleetId}/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ releaseId: selectedReleaseId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to deploy release');
      }

      setDeployMessage({ type: 'success', text: 'Release deployed successfully!' });
      setShowDeployModal(false);
      setSelectedReleaseId('');
      
      // Refresh fleet data after successful deployment
      if (onDeploySuccess) {
        setTimeout(() => {
          onDeploySuccess();
          setDeployMessage(null);
        }, 1500);
      }
    } catch (err) {
      setDeployMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to deploy release' });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      {deployMessage && (
        <div className={`rounded-lg border p-4 ${
          deployMessage.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {deployMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{deployMessage.text}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Release History
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {releases.length} total releases
          </p>
        </div>
        <button
          onClick={() => {
            if (releases.length > 0) {
              setSelectedReleaseId(releases[0].id);
            }
            setShowDeployModal(true);
            setDeployMessage(null);
          }}
          disabled={deploying || releases.length === 0}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {deploying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Package className="h-4 w-4" />
              Deploy Release
            </>
          )}
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Commit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Deployed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {releases.length > 0 ? (
                releases.map((release) => (
                  <tr 
                    key={release.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      release.isDeployed ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {release.version}
                        {release.isDeployed && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {release.commit.substring(0, 12)}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(release.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        release.status === 'success'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : release.status === 'failed'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {release.status === 'success' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : release.status === 'failed' ? (
                          <XCircle className="h-3 w-3" />
                        ) : null}
                        {release.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {release.isDeployed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                          {release.deployedDeviceCount !== undefined && release.deployedDeviceCount > 0 && (
                            <span className="ml-1 text-xs opacity-75">
                              ({release.deployedDeviceCount} {release.deployedDeviceCount === 1 ? 'device' : 'devices'})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {release.isFinal ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          Yes
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">No</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                      No releases found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deploy Release Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Deploy Release
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Select a release to deploy to all devices in this fleet:
              </p>
              <select
                value={selectedReleaseId}
                onChange={(e) => setSelectedReleaseId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.version} ({release.commit.substring(0, 7)}) - {new Date(release.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {deployMessage && (
                <div className={`mt-4 rounded-lg border p-3 ${
                  deployMessage.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {deployMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="text-xs">{deployMessage.text}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeployModal(false);
                  setSelectedReleaseId('');
                  setDeployMessage(null);
                }}
                disabled={deploying}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying || !selectedReleaseId}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigTab({ envVars, tags, fleetId, onUpdateSuccess }: { envVars: EnvVar[]; tags: FleetTag[]; fleetId: string; onUpdateSuccess?: () => void }) {
  const [editingEnvVar, setEditingEnvVar] = useState<string | null>(null);
  const [editingEnvVarValue, setEditingEnvVarValue] = useState('');
  const [newEnvVarName, setNewEnvVarName] = useState('');
  const [newEnvVarValue, setNewEnvVarValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingEnvVar, setDeletingEnvVar] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tag management state
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  const handleSaveEnvVar = async (envVarId: string, name: string, value: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/applications/${fleetId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          envVars: [{
            id: envVarId,
            name,
            value,
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update environment variable');
      }

      setMessage({ type: 'success', text: 'Environment variable updated successfully!' });
      setEditingEnvVar(null);
      setEditingEnvVarValue('');
      
      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update environment variable' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEnvVar = async () => {
    if (!newEnvVarName.trim() || !newEnvVarValue.trim()) {
      setMessage({ type: 'error', text: 'Please provide both name and value' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/applications/${fleetId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          envVars: [{
            name: newEnvVarName.trim(),
            value: newEnvVarValue.trim(),
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add environment variable');
      }

      setMessage({ type: 'success', text: 'Environment variable added successfully!' });
      setEditingEnvVar(null);
      setNewEnvVarName('');
      setNewEnvVarValue('');
      
      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add environment variable' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnvVar = async (envVarId: string) => {
    if (!confirm('Are you sure you want to delete this environment variable?')) {
      return;
    }

    setDeletingEnvVar(envVarId);
    setMessage(null);
    try {
      const response = await fetch(`/api/applications/${fleetId}/config`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          envVarIds: [envVarId],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete environment variable');
      }

      setMessage({ type: 'success', text: 'Environment variable deleted successfully!' });
      
      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete environment variable' });
    } finally {
      setDeletingEnvVar(null);
    }
  };

  const handleSaveTag = async (tagId: string, key: string, value: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/applications/${fleetId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tags: [{
            id: tagId,
            key,
            value,
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update tag');
      }

      setMessage({ type: 'success', text: 'Tag updated successfully!' });
      setEditingTag(null);
      setEditingTagValue('');
      
      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update tag' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagKey.trim() || !newTagValue.trim()) {
      setMessage({ type: 'error', text: 'Please provide both key and value' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/applications/${fleetId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tags: [{
            key: newTagKey.trim(),
            value: newTagValue.trim(),
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add tag');
      }

      setMessage({ type: 'success', text: 'Tag added successfully!' });
      setEditingTag(null);
      setNewTagKey('');
      setNewTagValue('');
      
      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add tag' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    setDeletingTag(tagId);
    setMessage(null);
    try {
      const response = await fetch(`/api/applications/${fleetId}/config`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tagIds: [tagId],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete tag');
      }

      setMessage({ type: 'success', text: 'Tag deleted successfully!' });
      
      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete tag' });
    } finally {
      setDeletingTag(null);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg border p-4 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Environment Variables */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Environment Variables
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Configure environment variables for this fleet
            </p>
          </div>
          <button
            onClick={() => {
              setNewEnvVarName('');
              setNewEnvVarValue('');
              setEditingEnvVar('new');
              setMessage(null);
            }}
            disabled={editingEnvVar === 'new' || editingEnvVar !== null}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Key className="h-4 w-4" />
            Add Variable
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {envVars.length > 0 || editingEnvVar === 'new' ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {envVars.map((envVar) => (
                <div key={envVar.id} className="px-6 py-4">
                  {editingEnvVar === envVar.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={envVar.name}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        readOnly
                      />
                      <input
                        type="text"
                        value={editingEnvVarValue}
                        onChange={(e) => setEditingEnvVarValue(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveEnvVar(envVar.id, envVar.name, editingEnvVarValue)}
                        disabled={saving}
                        className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingEnvVar(null);
                          setEditingEnvVarValue('');
                        }}
                        disabled={saving}
                        className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {envVar.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                          {envVar.value}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEnvVar(envVar.id);
                            setEditingEnvVarValue(envVar.value);
                          }}
                          disabled={editingEnvVar !== null || deletingEnvVar === envVar.id}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEnvVar(envVar.id)}
                          disabled={editingEnvVar !== null || deletingEnvVar === envVar.id || saving}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingEnvVar === envVar.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {editingEnvVar === 'new' && (
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Variable name"
                      value={newEnvVarName}
                      onChange={(e) => setNewEnvVarName(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={newEnvVarValue}
                      onChange={(e) => setNewEnvVarValue(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      onClick={handleAddEnvVar}
                      disabled={saving || !newEnvVarName.trim() || !newEnvVarValue.trim()}
                      className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingEnvVar(null);
                        setNewEnvVarName('');
                        setNewEnvVarValue('');
                      }}
                      disabled={saving}
                      className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Key className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                No environment variables
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Tags & Labels
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage tags and labels for this fleet
            </p>
          </div>
          <button
            onClick={() => {
              setNewTagKey('');
              setNewTagValue('');
              setEditingTag('new');
              setMessage(null);
            }}
            disabled={editingTag === 'new' || editingTag !== null}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <TagIcon className="h-4 w-4" />
            Add Tag
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {tags.length > 0 || editingTag === 'new' ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {tags.map((tag) => (
                <div key={tag.id} className="px-6 py-4">
                  {editingTag === tag.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tag.key}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        readOnly
                      />
                      <input
                        type="text"
                        value={editingTagValue}
                        onChange={(e) => setEditingTagValue(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveTag(tag.id, tag.key, editingTagValue)}
                        disabled={saving}
                        className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingTag(null);
                          setEditingTagValue('');
                        }}
                        disabled={saving}
                        className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {tag.key}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {tag.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTag(tag.id);
                            setEditingTagValue(tag.value);
                          }}
                          disabled={editingTag !== null || deletingTag === tag.id}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          disabled={editingTag !== null || deletingTag === tag.id || saving}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingTag === tag.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {editingTag === 'new' && (
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tag key"
                      value={newTagKey}
                      onChange={(e) => setNewTagKey(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Tag value"
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={saving || !newTagKey.trim() || !newTagValue.trim()}
                      className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTag(null);
                        setNewTagKey('');
                        setNewTagValue('');
                      }}
                      disabled={saving}
                      className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <TagIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                No tags configured
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

