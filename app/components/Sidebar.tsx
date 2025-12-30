'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Activity,
  Settings,
  Logs,
  Package,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Devices', href: '/devices', icon: Server },
  { name: 'Applications', href: '/applications', icon: Activity },
  { name: 'Releases', href: '/images', icon: Package },
  { name: 'Logs', href: '/logs', icon: Logs },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar-bg border-r border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Server className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Edge Server</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                }
              `}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="text-xs text-sidebar-text">
          <div className="font-medium text-white mb-1">Edge Server Dashboard</div>
          <div className="text-slate-400">v1.0.0</div>
        </div>
      </div>
    </div>
  );
}

