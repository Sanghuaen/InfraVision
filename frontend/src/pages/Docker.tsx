
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  RefreshCw,
  CircleCheck,
  CircleX,
  Clock3,
  Container,
  Search,
  X,
  Server,
  CircleDot,
  Image,
  Network,
} from 'lucide-react';

import {
  getServerSummary,
  getLatestMetric,
} from '../lib/api';

import type {
  DockerContainer,
  LatestMetric,
} from '../lib/api';

import type { ServerSummary } from '../types/server';

type StatusFilter = 'all' | 'running' | 'exited' | 'other';
type SortOption = 'name' | 'status' | 'image';

function formatPorts(
  ports: Record<string, unknown> | null | undefined
): string {
  if (!ports || typeof ports !== 'object') {
    return 'No published ports';
  }

  const entries = Object.entries(ports);

  if (entries.length === 0) {
    return 'No published ports';
  }

  return entries.flatMap(([containerPort, value]) => {
    if (!Array.isArray(value) || value.length === 0) {
      return [`${containerPort} (not published)`];
    }

    return value.map((binding: {
      HostIp?: string;
      HostPort?: string;
    }) => {
      return `${binding.HostIp || '0.0.0.0'}:${binding.HostPort || '-'} → ${containerPort}`;
    });
  }).join(', ');
}

function getContainerStatus(container: DockerContainer): string {
  return (container.status || 'unknown').toLowerCase();
}

function Docker() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [containers, setContainers] = useState<DockerContainer[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Load server list
  useEffect(() => {
    async function loadServers() {
      try {
        const data = await getServerSummary();

        setServers(data);

        if (data.length > 0) {
          const defaultServer =
            data.find((server) => server.agentId === 'test-server') ??
            data[0];

          setSelectedAgentId((current) =>
            current || defaultServer.agentId
          );
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load server information.');
        setLoading(false);
      }
    }

    loadServers();
  }, []);

  // Load Docker containers
  const loadContainers = useCallback(async (isRefresh = false) => {
    if (!selectedAgentId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data: LatestMetric =
        await getLatestMetric(selectedAgentId);

      setContainers(
        Array.isArray(data.docker) ? data.docker : []
      );

      setLastUpdated(data.collectedAt);
    } catch (err) {
      console.error(err);
      setError('Unable to load Docker containers.');
      setContainers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAgentId]);

  // Reload when server changes
  useEffect(() => {
    if (selectedAgentId) {
      loadContainers();
    }
  }, [selectedAgentId, loadContainers]);

  // Container statistics
  const runningContainers = containers.filter(
    (container) => getContainerStatus(container) === 'running'
  );

  const exitedContainers = containers.filter(
    (container) => getContainerStatus(container) === 'exited'
  );

  const otherContainers = containers.length -
    runningContainers.length -
    exitedContainers.length;

  // Search, filter and sort
  const filteredContainers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = containers.filter((container) => {
      const status = getContainerStatus(container);
      const ports = formatPorts(container.ports);

      const matchesSearch =
        (container.name ?? '').toLowerCase().includes(keyword) ||
        (container.id ?? '').toLowerCase().includes(keyword) ||
        (container.image ?? '').toLowerCase().includes(keyword) ||
        status.includes(keyword) ||
        ports.toLowerCase().includes(keyword);

      let matchesStatus = true;

      if (statusFilter === 'running') {
        matchesStatus = status === 'running';
      } else if (statusFilter === 'exited') {
        matchesStatus = status === 'exited';
      } else if (statusFilter === 'other') {
        matchesStatus = status !== 'running' && status !== 'exited';
      }

      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'image':
          return (a.image ?? '').localeCompare(b.image ?? '');

        case 'status':
          return getContainerStatus(a).localeCompare(
            getContainerStatus(b)
          );

        case 'name':
        default:
          return (a.name ?? '').localeCompare(b.name ?? '');
      }
    });

    return result;
  }, [containers, search, statusFilter, sortBy]);

  const handleRefresh = () => {
    loadContainers(true);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('name');
  };

  const hasActiveFilters =
    search.length > 0 || statusFilter !== 'all';

  const selectedServer = servers.find(
    (server) => server.agentId === selectedAgentId
  );

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">
              Infrastructure
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Docker Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Explore and monitor Docker containers across your infrastructure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Server Selector */}
          <div className="relative min-w-[190px]">
            <Server className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <select
              value={selectedAgentId}
              onChange={(event) =>
                setSelectedAgentId(event.target.value)
              }
              disabled={servers.length === 0}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-9 text-sm text-slate-200 outline-none transition hover:border-slate-700 focus:border-cyan-500 disabled:opacity-50"
            >
              {servers.length === 0 && (
                <option value="">No servers available</option>
              )}

              {servers.map((server, index) => (
                <option
                  key={`${server.agentId || server.name}-${index}`}
                  value={server.agentId}
                >
                  {server.name || server.agentId}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing || !selectedAgentId}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Server Information */}
      {selectedServer && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Server className="h-4 w-4 text-cyan-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                {selectedServer.name || selectedServer.agentId}
              </p>
              <p className="text-xs text-slate-500">
                Agent ID: {selectedServer.agentId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            Last Updated:{' '}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : 'Never'}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <CircleDot className="mt-0.5 h-5 w-5 text-red-400" />

            <div>
              <p className="font-medium text-red-400">
                Unable to load Docker information
              </p>

              <p className="mt-1 text-sm text-red-400/70">
                {error}
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 text-sm font-medium text-red-300 underline underline-offset-4 hover:text-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Containers"
          value={containers.length}
          description="Containers detected"
          icon={<Container className="h-5 w-5 text-cyan-400" />}
          iconBg="bg-cyan-500/10"
        />

        <SummaryCard
          title="Running"
          value={runningContainers.length}
          description="Currently running"
          icon={<CircleCheck className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          title="Exited"
          value={exitedContainers.length}
          description="Stopped containers"
          icon={<CircleX className="h-5 w-5 text-slate-400" />}
          iconBg="bg-slate-700/50"
        />

        <SummaryCard
          title="Other Status"
          value={otherContainers}
          description="Created or other states"
          icon={<Box className="h-5 w-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Container Section */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        {/* Section Header */}
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">
                Container List
              </h2>

              <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {filteredContainers.length}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Container information collected from Docker Engine.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search containers..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-9 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-500 sm:w-64"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="exited">Exited</option>
              <option value="other">Other Status</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-cyan-500"
            >
              <option value="name">Sort: Name</option>
              <option value="status">Sort: Status</option>
              <option value="image">Sort: Image</option>
            </select>
          </div>
        </div>

        {/* Container Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-sm">Loading containers...</p>
          </div>
        ) : containers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="rounded-2xl bg-slate-800/70 p-4">
              <Box className="h-8 w-8 text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-200">
              No containers found
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              No Docker container data is available for this server.
              Try refreshing to collect the latest information.
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        ) : filteredContainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <Search className="h-8 w-8 text-slate-600" />

            <h3 className="mt-3 font-medium text-slate-300">
              No matching containers
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter settings.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Container Cards */}
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              {filteredContainers.map((container, index) => {
                const status = getContainerStatus(container);
                const isRunning = status === 'running';
                const isExited = status === 'exited';

                const containerKey =
                  `${container.id || container.name || 'container'}-${index}`;

                const ports = formatPorts(container.ports);

                return (
                  <div
                    key={containerKey}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition-colors hover:border-slate-700"
                  >
                    {/* Container Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-xl bg-cyan-500/10 p-3">
                          <Container className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-white">
                            {container.name || 'Unnamed container'}
                          </h3>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {container.image || 'Unknown image'}
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        status={status}
                        isRunning={isRunning}
                        isExited={isExited}
                      />
                    </div>

                    {/* Container Details */}
                    <div className="mt-5 space-y-4 border-t border-slate-800 pt-4">

                      {/* Image */}
                      <div className="flex items-start gap-3">
                        <Image className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">
                            Docker Image
                          </p>

                          <p className="mt-1 break-all text-sm text-slate-300">
                            {container.image || 'Unavailable'}
                          </p>
                        </div>
                      </div>

                      {/* Container ID */}
                      <div className="flex items-start gap-3">
                        <Box className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">
                            Container ID
                          </p>

                          <p className="mt-1 break-all font-mono text-xs text-slate-300">
                            {container.id || 'Unavailable'}
                          </p>
                        </div>
                      </div>

                      {/* Ports */}
                      <div className="flex items-start gap-3">
                        <Network className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">
                            Published Ports
                          </p>

                          <p className="mt-1 break-words text-sm leading-relaxed text-slate-300">
                            {ports}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950/40 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredContainers.length} of {containers.length} containers
              </span>

              <span>
                {runningContainers.length} running · {exitedContainers.length} exited · {otherContainers} other
              </span>
            </div>
          </>
        )}
      </section>

      {/* Footer Note */}
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Read-only monitoring. Container start, stop, and delete actions
          are not available.
        </p>
      </div>
    </div>
  );
}

// Summary Card
function SummaryCard({
  title,
  value,
  description,
  icon,
  iconBg,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

// Container Status Badge
function StatusBadge({
  status,
  isRunning,
  isExited,
}: {
  status: string;
  isRunning: boolean;
  isExited: boolean;
}) {
  const style = isRunning
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
    : isExited
      ? 'border-slate-700 bg-slate-800 text-slate-400'
      : 'border-amber-500/20 bg-amber-500/10 text-amber-400';

  const dot = isRunning
    ? 'bg-emerald-400'
    : isExited
      ? 'bg-slate-500'
      : 'bg-amber-400';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

export default Docker;
