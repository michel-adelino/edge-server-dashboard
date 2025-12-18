'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Key,
  Globe,
  Database,
  Save,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'api' | 'general'>('profile');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'general', label: 'General', icon: SettingsIcon },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                        isActive
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'api' && <APISettings />}
              {activeTab === 'general' && <GeneralSettings theme={theme} setTheme={setTheme} />}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileSettings() {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'Example Corp',
    timezone: 'UTC',
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Profile Information
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Update your personal information and preferences
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    email: {
      deviceOffline: true,
      deploymentSuccess: true,
      deploymentFailure: true,
      highCpuUsage: false,
      errors: true,
    },
    push: {
      deviceOffline: false,
      deploymentSuccess: false,
      deploymentFailure: true,
      highCpuUsage: false,
      errors: true,
    },
  });

  const toggleNotification = (type: 'email' | 'push', key: string) => {
    setNotifications({
      ...notifications,
      [type]: {
        ...notifications[type],
        [key]: !notifications[type][key as keyof typeof notifications.email],
      },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Notification Preferences
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Configure how you receive notifications
        </p>
      </div>

      <div className="space-y-8">
        {/* Email Notifications */}
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
            Email Notifications
          </h3>
          <div className="space-y-4">
            {Object.entries(notifications.email).map(([key, value]) => (
              <NotificationToggle
                key={key}
                label={formatLabel(key)}
                enabled={value}
                onChange={() => toggleNotification('email', key)}
              />
            ))}
          </div>
        </div>

        {/* Push Notifications */}
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
            Push Notifications
          </h3>
          <div className="space-y-4">
            {Object.entries(notifications.push).map(([key, value]) => (
              <NotificationToggle
                key={key}
                label={formatLabel(key)}
                enabled={value}
                onChange={() => toggleNotification('push', key)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    deviceOffline: 'Device Goes Offline',
    deploymentSuccess: 'Deployment Success',
    deploymentFailure: 'Deployment Failure',
    highCpuUsage: 'High CPU Usage',
    errors: 'Application Errors',
  };
  return labels[key] || key;
}

function APISettings() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'Production API Key',
      key: 'balena_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      createdAt: '2024-01-01T00:00:00Z',
      lastUsed: '2024-01-20T14:30:00Z',
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'balena_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      createdAt: '2024-01-10T00:00:00Z',
      lastUsed: '2024-01-19T10:15:00Z',
    },
  ]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            API Keys
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your API keys for programmatic access
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          <Key className="h-4 w-4" />
          Create API Key
        </button>
      </div>

      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                    {apiKey.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <code className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded">
                    {apiKey.key.substring(0, 20)}...
                  </code>
                  <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                  <span>Last used {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Security Note:</strong> Keep your API keys secure and never share them publicly.
          Rotate keys regularly for better security.
        </p>
      </div>
    </div>
  );
}

function GeneralSettings({
  theme,
  setTheme,
}: {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          General Settings
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Configure your application preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption
              icon={Sun}
              label="Light"
              value="light"
              selected={theme === 'light'}
              onClick={() => setTheme('light')}
            />
            <ThemeOption
              icon={Moon}
              label="Dark"
              value="dark"
              selected={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <ThemeOption
              icon={Monitor}
              label="System"
              value="system"
              selected={theme === 'system'}
              onClick={() => setTheme('system')}
            />
          </div>
        </div>

        {/* Data Management */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
            Data Management
          </h3>
          <div className="space-y-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <Download className="h-4 w-4" />
              Export Data
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <Upload className="h-4 w-4" />
              Import Data
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h3>
          <div className="space-y-3">
            <button className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  value,
  selected,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
      }`}
    >
      <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </button>
  );
}

