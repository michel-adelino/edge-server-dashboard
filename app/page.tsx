import DashboardLayout from './components/DashboardLayout';
import { Server, Activity, Cpu, HardDrive } from 'lucide-react';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Overview of your devices and applications
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Devices"
            value="0"
            icon={Server}
            change="+0"
            description="Active devices"
          />
          <StatCard
            title="Applications"
            value="0"
            icon={Activity}
            change="+0"
            description="Running applications"
          />
          <StatCard
            title="CPU Usage"
            value="0%"
            icon={Cpu}
            change="0%"
            description="Average across devices"
          />
          <StatCard
            title="Storage"
            value="0 GB"
            icon={HardDrive}
            change="0 GB"
            description="Total used"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Devices Section */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Recent Devices
            </h2>
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No devices found. Connect your first device to get started.
              </p>
            </div>
          </div>

          {/* Applications Section */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Applications
            </h2>
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No applications found. Create your first application to deploy.
              </p>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-12">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No recent activity to display.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  change: string;
  description: string;
}

function StatCard({ title, value, icon: Icon, change, description }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {description}
          </p>
        </div>
        <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900/30">
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          {change} from last period
        </span>
      </div>
    </div>
  );
}
