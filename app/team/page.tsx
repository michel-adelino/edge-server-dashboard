'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  User,
  Crown,
  Eye,
} from 'lucide-react';

// Dummy team data
const teamMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'owner' as const,
    avatar: null,
    joinedAt: '2024-01-01T00:00:00Z',
    lastActive: '2024-01-20T14:30:00Z',
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'admin' as const,
    avatar: null,
    joinedAt: '2024-01-05T00:00:00Z',
    lastActive: '2024-01-20T13:15:00Z',
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'developer' as const,
    avatar: null,
    joinedAt: '2024-01-10T00:00:00Z',
    lastActive: '2024-01-19T18:45:00Z',
    status: 'active' as const,
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    role: 'viewer' as const,
    avatar: null,
    joinedAt: '2024-01-15T00:00:00Z',
    lastActive: '2024-01-20T10:20:00Z',
    status: 'active' as const,
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    role: 'developer' as const,
    avatar: null,
    joinedAt: '2024-01-12T00:00:00Z',
    lastActive: '2024-01-18T16:30:00Z',
    status: 'inactive' as const,
  },
];

type Role = 'owner' | 'admin' | 'developer' | 'viewer';
type Status = 'active' | 'inactive';

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === 'active').length,
    owners: teamMembers.filter((m) => m.role === 'owner').length,
    admins: teamMembers.filter((m) => m.role === 'admin').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Team
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage team members and their permissions
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Members" value={stats.total.toString()} />
          <StatCard
            title="Active"
            value={stats.active.toString()}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Owners"
            value={stats.owners.toString()}
            color="text-primary-600 dark:text-primary-400"
          />
          <StatCard
            title="Admins"
            value={stats.admins.toString()}
            color="text-blue-600 dark:text-blue-400"
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
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="viewer">Viewer</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <TeamMemberRow key={member.id} member={member} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                        No team members found
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Try adjusting your filters or invite a new member.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

function TeamMemberRow({ member }: { member: typeof teamMembers[0] }) {
  const roleConfig = {
    owner: {
      icon: Crown,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      label: 'Owner',
    },
    admin: {
      icon: Shield,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      label: 'Admin',
    },
    developer: {
      icon: User,
      color: 'text-primary-600',
      bg: 'bg-primary-100 dark:bg-primary-900/30',
      label: 'Developer',
    },
    viewer: {
      icon: Eye,
      color: 'text-slate-600',
      bg: 'bg-slate-100 dark:bg-slate-800',
      label: 'Viewer',
    },
  };

  const config = roleConfig[member.role];
  const RoleIcon = config.icon;

  const statusConfig = {
    active: {
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
      label: 'Active',
    },
    inactive: {
      color: 'text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
      label: 'Inactive',
    },
  };

  const status = statusConfig[member.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {member.name}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {member.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
        >
          <RoleIcon className="h-3 w-3" />
          {config.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
        >
          {status.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
        {formatDate(member.joinedAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
        {formatLastActive(member.lastActive)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <MoreVertical className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

