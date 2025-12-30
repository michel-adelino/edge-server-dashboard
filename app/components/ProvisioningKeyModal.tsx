'use client';

import { useState } from 'react';
import {
  X,
  Copy,
  CheckCircle2,
  Loader2,
  Key,
  AlertCircle,
  Info,
} from 'lucide-react';

interface ProvisioningKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProvisioningKeyModal({
  isOpen,
  onClose,
}: ProvisioningKeyModalProps) {
  const [provisioningKey, setProvisioningKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateKey = async () => {
    setLoading(true);
    setError(null);
    setProvisioningKey(null);

    try {
      const response = await fetch('/api/devices/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate provisioning key');
      }

      const data = await response.json();
      setProvisioningKey(data.key || data.provisioningKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate provisioning key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!provisioningKey) return;

    try {
      await navigator.clipboard.writeText(provisioningKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
              <Key className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Device Provisioning Key
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate a key to register new devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {!provisioningKey ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      How it works
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      A provisioning key allows you to register new devices to your OpenBalena instance.
                      Generate a key and use it during device setup to automatically register the device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateKey}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Generate Provisioning Key
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Your Provisioning Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                    <code className="text-sm font-mono text-slate-900 dark:text-white break-all">
                      {provisioningKey}
                    </code>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>Copy the provisioning key above</li>
                  <li>During device setup, use this key when prompted</li>
                  <li>The device will automatically register to your OpenBalena instance</li>
                  <li>Once registered, you can assign the device to an application</li>
                </ol>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Security Note:</strong> Keep your provisioning key secure. Anyone with this key can register devices to your instance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {provisioningKey ? 'Close' : 'Cancel'}
          </button>
          {provisioningKey && (
            <button
              onClick={generateKey}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors dark:text-primary-400 dark:hover:bg-primary-900/20 disabled:opacity-50"
            >
              Generate New Key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

