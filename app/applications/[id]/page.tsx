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
  const [activeTab, setActiveTab] = useState<'devices' | 'releases' | 'config'>('devices');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const loadFleet = async () => {
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

    if (fleetId) {
      loadFleet();
    }
  }, [fleetId]);

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
          {(['devices', 'releases', 'config'] as const).map((tab) => (
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
        {activeTab === 'devices' && <DevicesTab devices={fleet.devices} />}
        {activeTab === 'releases' && <ReleasesTab releases={fleet.releases} fleetId={fleetId} />}
        {activeTab === 'config' && <ConfigTab envVars={fleet.envVars} tags={fleet.tags} fleetId={fleetId} />}
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

function ReleasesTab({ releases, fleetId }: { releases: FleetRelease[]; fleetId: string }) {
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async () => {
    // This would trigger a deployment - for now just show a message
    setDeploying(true);
    try {
      // TODO: Implement actual deployment logic
      alert('Deployment functionality will be implemented');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
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
          onClick={handleDeploy}
          disabled={deploying}
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
                  Final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {releases.length > 0 ? (
                releases.map((release) => (
                  <tr key={release.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {release.version}
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
                  <td colSpan={5} className="px-6 py-12 text-center">
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
    </div>
  );
}

function ConfigTab({ envVars, tags, fleetId }: { envVars: EnvVar[]; tags: FleetTag[]; fleetId: string }) {
  const [editingEnvVar, setEditingEnvVar] = useState<string | null>(null);
  const [newEnvVarName, setNewEnvVarName] = useState('');
  const [newEnvVarValue, setNewEnvVarValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveEnvVar = async (envVarId: string, name: string, value: string) => {
    setSaving(true);
    try {
      // TODO: Implement API call to update env var
      alert('Environment variable update will be implemented');
      setEditingEnvVar(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
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
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
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
                        value={envVar.value}
                        onChange={(e) => {
                          // Update logic
                        }}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveEnvVar(envVar.id, envVar.name, envVar.value)}
                        disabled={saving}
                        className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingEnvVar(null)}
                        className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
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
                      <button
                        onClick={() => setEditingEnvVar(envVar.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
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
                      onClick={() => {
                        // TODO: Implement add logic
                        setEditingEnvVar(null);
                      }}
                      className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingEnvVar(null)}
                      className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
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
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tags & Labels
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage tags and labels for this fleet
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {tags.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {tags.map((tag) => (
                <div key={tag.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {tag.key}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {tag.value}
                    </span>
                  </div>
                </div>
              ))}
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

