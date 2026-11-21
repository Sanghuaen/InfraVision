
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Clock3,
  Activity,
  MemoryStick,
  Terminal,
  Search,
  Cpu,
  X,
  ArrowUpDown,
  Server,
  CircleDot,
} from 'lucide-react';

import {
  getServerSummary,
  getLatestMetric,
} from '../lib/api';

import type {
  ProcessInfo,
  LatestMetric,
} from '../lib/api';

import type { ServerSummary } from '../types/server';

type StatusFilter = 'all' | 'running' | 'stopped';
type SortOption = 'cpu' | 'memory' | 'name' | 'pid';

function Processes() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('cpu');

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

  // Load latest processes
  const loadProcesses = useCallback(async (isRefresh = false) => {
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

      const processData = Array.isArray(data.processes)
        ? data.processes
        : [];

      setProcesses(processData);
      setLastUpdated(data.collectedAt);
    } catch (err) {
      console.error(err);
      setError('Unable to load process information.');
      setProcesses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAgentId]);

  // Reload when server changes
  useEffect(() => {
    if (selectedAgentId) {
      loadProcesses();
    }
  }, [selectedAgentId, loadProcesses]);

  // Process statistics
  const runningCount = processes.filter(
    (process) => process.status?.toLowerCase() === 'running'
  ).length;

  const stoppedCount = processes.length - runningCount;

  const totalMemory = processes.reduce(
    (total, process) =>
      total + (Number(process.memory_mb) || 0),
    0
  );

  const totalCpu = processes.reduce(
    (total, process) =>
      total + (Number(process.cpu_percent) || 0),
    0
  );

  // Search, filter and sort
  const filteredProcesses = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = processes.filter((process) => {
      const matchesSearch =
        String(process.pid).includes(keyword) ||
        (process.name ?? '').toLowerCase().includes(keyword) ||
        (process.username ?? '').toLowerCase().includes(keyword);

      const status = process.status?.toLowerCase() ?? '';

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'running' && status === 'running') ||
        (statusFilter === 'stopped' && status !== 'running');

      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'memory':
          return (
            (Number(b.memory_mb) || 0) -
            (Number(a.memory_mb) || 0)
          );

        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '');

        case 'pid':
          return (Number(a.pid) || 0) - (Number(b.pid) || 0);

        case 'cpu':
        default:
          return (
            (Number(b.cpu_percent) || 0) -
            (Number(a.cpu_percent) || 0)
          );
      }
    });

    return result;
  }, [processes, search, statusFilter, sortBy]);

  const handleRefresh = () => {
    loadProcesses(true);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('cpu');
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
            Process Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor and inspect processes running across your infrastructure.
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
                Unable to load process information
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
          title="Total Processes"
          value={processes.length.toLocaleString()}
          description="Processes detected"
          icon={<Terminal className="h-5 w-5 text-cyan-400" />}
          iconBg="bg-cyan-500/10"
        />

        <SummaryCard
          title="Running"
          value={runningCount.toLocaleString()}
          description={`${processes.length > 0
            ? ((runningCount / processes.length) * 100).toFixed(1)
            : '0.0'
            }% of total processes`}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          title="Total CPU Usage"
          value={`${totalCpu.toFixed(2)}%`}
          description="Combined process CPU usage"
          icon={<Cpu className="h-5 w-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          title="Total Memory"
          value={`${totalMemory.toFixed(2)} MB`}
          description={`${(totalMemory / 1024).toFixed(2)} GB allocated`}
          icon={<MemoryStick className="h-5 w-5 text-purple-400" />}
          iconBg="bg-purple-500/10"
        />
      </div>

      {/* Process Table */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        {/* Section Header */}
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">
                Process List
              </h2>

              <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {filteredProcesses.length}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Process information collected from the operating system.
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
                placeholder="Search processes..."
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
              <option value="stopped">Other Status</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-cyan-500"
            >
              <option value="cpu">Sort: CPU</option>
              <option value="memory">Sort: Memory</option>
              <option value="name">Sort: Name</option>
              <option value="pid">Sort: PID</option>
            </select>
          </div>
        </div>

        {/* Process Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-sm">Loading processes...</p>
          </div>
        ) : processes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="rounded-2xl bg-slate-800/70 p-4">
              <Terminal className="h-8 w-8 text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-200">
              No processes found
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              No process data is available for this server.
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
        ) : filteredProcesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <Search className="h-8 w-8 text-slate-600" />

            <h3 className="mt-3 font-medium text-slate-300">
              No matching processes
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      PID
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Process Name
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Username
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      CPU Usage
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      Memory
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80">
                  {filteredProcesses.map((process, index) => {
                    const isRunning =
                      process.status?.toLowerCase() === 'running';

                    const cpu = Number(process.cpu_percent) || 0;
                    const memory = Number(process.memory_mb) || 0;

                    return (
                      <tr
                        key={`${process.pid}-${index}`}
                        className="transition-colors hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">
                          {process.pid}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-slate-800 p-2">
                              <Terminal className="h-4 w-4 text-cyan-400" />
                            </div>

                            <span className="font-medium text-slate-200">
                              {process.name || 'Unknown'}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-400">
                          {process.username || 'System'}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              isRunning
                                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : 'border border-slate-700 bg-slate-800 text-slate-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isRunning
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-500'
                              }`}
                            />
                            {process.status || 'Unknown'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="w-14 text-right tabular-nums text-slate-300">
                              {cpu.toFixed(2)}%
                            </span>

                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{
                                  width: `${Math.min(Math.max(cpu, 0), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-300">
                          {memory.toFixed(2)} MB
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950/40 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredProcesses.length} of {processes.length} processes
              </span>

              <span>
                {runningCount} running · {stoppedCount} other status
              </span>
            </div>
          </>
        )}
      </section>

      {/* Footer Note */}
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Read-only monitoring. Process termination and management actions
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

export default Processes;
