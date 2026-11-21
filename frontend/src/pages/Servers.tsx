
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Server,
  RefreshCw,
  Cpu,
  MemoryStick,
  HardDrive,
  Container,
  Activity,
  Clock3,
  Search,
  X,
  CircleCheck,
  CircleX,
  Monitor,
  Filter,
} from 'lucide-react';

import { getServerSummary } from '../lib/api';
import type { ServerSummary } from '../types/server';

function formatDate(date: string | null) {
  if (!date) return 'No metrics received';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown';
  }

  return parsedDate.toLocaleString();
}

function isServerOnline(status?: string | null) {
  return ['online', 'connected'].includes(
    (status || '').toLowerCase(),
  );
}

function ResourceBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const percentage = Math.min(100, Math.max(0, safeValue));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          <span>{label}</span>
        </div>

        <span className="font-semibold tabular-nums text-white">
          {safeValue.toFixed(1)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function Servers() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'connected' | 'offline'
  >('all');

  const loadServers = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data = await getServerSummary();
      setServers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load servers:', err);
      setError('Unable to connect to the server API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const onlineCount = servers.filter((server) =>
    isServerOnline(server.status),
  ).length;

  const offlineCount = servers.length - onlineCount;

  const filteredServers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return servers.filter((server) => {
      const matchesSearch =
        !query ||
        [
          server.name,
          server.hostname,
          server.agentId,
          server.platform,
        ].some((value) =>
          (value || '').toLowerCase().includes(query),
        );

      const online = isServerOnline(server.status);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'connected' && online) ||
        (statusFilter === 'offline' && !online);

      return matchesSearch && matchesStatus;
    });
  }, [servers, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-400">
            Infrastructure
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Servers
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor your infrastructure servers and system resources.
          </p>
        </div>

        <button
          onClick={() => loadServers(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? 'animate-spin' : ''
            }`}
          />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total Servers"
          value={servers.length}
          icon={<Server className="h-5 w-5 text-cyan-400" />}
          description="Registered infrastructure"
        />

        <SummaryCard
          label="Connected"
          value={onlineCount}
          icon={<CircleCheck className="h-5 w-5 text-emerald-400" />}
          description="Online and reporting"
        />

        <SummaryCard
          label="Offline / Unknown"
          value={offlineCount}
          icon={<CircleX className="h-5 w-5 text-slate-400" />}
          description="Not currently connected"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-red-400">{error}</p>
            <p className="mt-1 text-sm text-red-400/70">
              Please check whether the Backend API is running.
            </p>
          </div>

          <button
            onClick={() => loadServers(true)}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      )}

      {/* Server List */}
      <section className="space-y-5">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Server List
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Server information collected by InfraVision Agent.
            </p>
          </div>

          {!loading && (
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-300">
                {filteredServers.length}
              </span>
              {' '}of {servers.length} servers
            </p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search server name, hostname, Agent ID or OS..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/50"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-slate-500" />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'all'
                    | 'connected'
                    | 'offline',
                )
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-cyan-500/50 sm:w-44"
            >
              <option value="all">All Status</option>
              <option value="connected">Connected</option>
              <option value="offline">Offline / Unknown</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-12 text-slate-400">
            <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />
            <p className="mt-4 text-sm">Loading servers...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <Server className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-4 font-semibold text-slate-300">
              No servers found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              No server information is available yet.
            </p>
            <button
              onClick={() => loadServers(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-600" />
            <h3 className="mt-3 font-semibold text-slate-300">
              No matching servers
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or status filter.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredServers.map((server) => {
              const online = isServerOnline(server.status);

              return (
                <div
                  key={server.serverId}
                  className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
                >
                  {/* Server Identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/10 p-3">
                        <Server className="h-6 w-6 text-cyan-400" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">
                          {server.name || server.agentId}
                        </h3>

                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                          <Monitor className="h-3.5 w-3.5 shrink-0" />
                          {server.hostname || 'Unknown hostname'}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={server.status}
                      online={online}
                    />
                  </div>

                  {/* System Information */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-md border border-slate-800 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300">
                      {server.platform || 'Unknown OS'}
                    </span>

                    <span className="max-w-full truncate rounded-md border border-slate-800 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
                      ID: {server.agentId}
                    </span>
                  </div>

                  {/* Resource Usage */}
                  <div className="mt-6 space-y-5 border-t border-slate-800 pt-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-300">
                        Resource Usage
                      </p>
                      <Activity className="h-4 w-4 text-slate-500" />
                    </div>

                    <ResourceBar
                      label="CPU Usage"
                      value={server.cpu}
                      icon={<Cpu className="h-4 w-4" />}
                    />

                    <ResourceBar
                      label="Memory Usage"
                      value={server.memory}
                      icon={<MemoryStick className="h-4 w-4" />}
                    />

                    <ResourceBar
                      label="Disk Usage"
                      value={server.disk}
                      icon={<HardDrive className="h-4 w-4" />}
                    />
                  </div>

                  {/* Activity Summary */}
                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
                    <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-3">
                      <div className="rounded-lg bg-cyan-500/10 p-2">
                        <Activity className="h-4 w-4 text-cyan-400" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-semibold tabular-nums text-white">
                          {server.processCount ?? 0}
                        </p>
                        <p className="text-xs text-slate-500">
                          Processes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-3">
                      <div className="rounded-lg bg-cyan-500/10 p-2">
                        <Container className="h-4 w-4 text-cyan-400" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-semibold tabular-nums text-white">
                          {server.dockerContainerCount ?? 0}
                        </p>
                        <p className="text-xs text-slate-500">
                          Containers
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      <span>Last Updated</span>
                    </div>

                    <span className="text-right tabular-nums text-slate-400">
                      {formatDate(server.collectedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({
  status,
  online,
}: {
  status?: string | null;
  online: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        online
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          : 'border-slate-700 bg-slate-800 text-slate-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          online ? 'bg-emerald-400' : 'bg-slate-500'
        }`}
      />
      {status || 'Unknown'}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        {icon}
      </div>

      <p className="mt-3 text-3xl font-bold tabular-nums text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default Servers;
