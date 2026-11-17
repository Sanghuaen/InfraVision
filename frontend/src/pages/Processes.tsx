
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Clock3,
  Activity,
  MemoryStick,
  Terminal,
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

function Processes() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Load server list
  useEffect(() => {
    async function loadServers() {
      try {
        const data = await getServerSummary();
        setServers(data);

        if (data.length > 0) {
          const defaultServer = data.find(
            (server) => server.agentId === 'test-server'
          ) ?? data[0];

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

  // Load processes from latest metric
  const loadProcesses = useCallback(async (isRefresh = false) => {
    if (!selectedAgentId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data: LatestMetric = await getLatestMetric(selectedAgentId);

      setProcesses(
        Array.isArray(data.processes) ? data.processes : [],
      );

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

  // Reload when selected server changes
  useEffect(() => {
    if (selectedAgentId) {
      loadProcesses();
    }
  }, [selectedAgentId, loadProcesses]);

  const runningCount = processes.filter(
    (process) => process.status?.toLowerCase() === 'running',
  ).length;

  const filteredProcesses = processes.filter((process) => {
    const keyword = search.toLowerCase();

    return (
      String(process.pid).includes(keyword) ||
      (process.name ?? '').toLowerCase().includes(keyword) ||
      (process.username ?? '').toLowerCase().includes(keyword)
    );
  });

  const handleRefresh = () => {
    loadProcesses(true);
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <p className="text-sm font-medium text-cyan-400">
              Infrastructure
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Process Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor running processes across your infrastructure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Server Selector */}
          <select
            value={selectedAgentId}
            onChange={(event) => setSelectedAgentId(event.target.value)}
            disabled={servers.length === 0}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-500"
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

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing || !selectedAgentId}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Updating' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock3 className="h-4 w-4" />
        Last Updated:{' '}
        {lastUpdated
          ? new Date(lastUpdated).toLocaleString()
          : 'Never'}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="font-medium text-red-400">
            Unable to load process information
          </p>
          <p className="mt-1 text-sm text-red-400/70">
            {error}
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Processes"
          value={processes.length}
          icon={<Terminal className="h-5 w-5 text-cyan-400" />}
        />

        <SummaryCard
          title="Running"
          value={runningCount}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
        />

        <SummaryCard
          title="Total Memory"
          value={`${processes.reduce(
            (total, process) => total + (Number(process.memory_mb) || 0),
            0,
          ).toFixed(2)} MB`}
          icon={<MemoryStick className="h-5 w-5 text-blue-400" />}
        />
      </div>

      {/* Process List */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Processes
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Process information collected from the operating system.
            </p>
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search PID, name or username..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 sm:w-72"
          />
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading processes...
          </div>
        ) : processes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <Terminal className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-4 font-semibold text-slate-300">
              No processes found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              No process data is available for this server.
            </p>
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            No matching processes found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">PID</th>
                  <th className="px-5 py-4">Process Name</th>
                  <th className="px-5 py-4">Username</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">CPU</th>
                  <th className="px-5 py-4 text-right">Memory</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredProcesses.map((process, index) => {
                  const isRunning =
                    process.status?.toLowerCase() === 'running';

                  return (
                    <tr
                      key={`${process.pid}-${index}`}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {process.pid}
                      </td>

                      <td className="px-5 py-4 font-medium text-white">
                        {process.name || 'Unknown'}
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {process.username || 'System'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${isRunning
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-700/50 text-slate-400'
                            }`}
                        >
                          {process.status || 'Unknown'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-slate-300">
                        {(Number(process.cpu_percent) || 0).toFixed(2)}%
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-slate-300">
                        {(Number(process.memory_mb) || 0).toFixed(2)} MB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Read-only monitoring. Process termination and management actions are not available.
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default Processes;
