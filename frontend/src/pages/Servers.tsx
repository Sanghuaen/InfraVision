
import { useCallback, useEffect, useState } from 'react';
import {
  Server,
  RefreshCw,
  Cpu,
  MemoryStick,
  HardDrive,
  Container,
  Activity,
  Clock3,
} from 'lucide-react';

import { getServerSummary } from '../lib/api';
import type { ServerSummary } from '../types/server';

function formatDate(date: string | null) {
  if (!date) return 'No metrics received';

  return new Date(date).toLocaleString();
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
  const percentage = Math.min(100, Math.max(0, value || 0));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          {label}
        </div>
        <span className="font-semibold text-white">
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
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

  const loadServers = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data = await getServerSummary();
      setServers(data);
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

  const onlineCount = servers.filter(
    (server) =>
      ['online', 'connected'].includes(
        (server.status || '').toLowerCase(),
      ),
  ).length;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-400">
            Infrastructure
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Servers
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor your infrastructure servers and system resources.
          </p>
        </div>

        <button
          onClick={() => loadServers(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Total Servers"
          value={servers.length}
          icon={<Server className="h-5 w-5 text-cyan-400" />}
        />

        <SummaryCard
          label="Connected Servers"
          value={onlineCount}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="font-medium text-red-400">{error}</p>
          <p className="mt-1 text-sm text-red-400/70">
            Please check whether the Backend API is running.
          </p>
        </div>
      )}

      {/* Server List */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Server List
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Server information collected by InfraVision Agent.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading servers...
          </div>
        ) : error ? null : servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <Server className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-4 font-semibold text-slate-300">
              No servers found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              No server information is available yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {servers.map((server) => (
              <div
                key={server.serverId}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                {/* Server Identity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-cyan-500/10 p-3">
                      <Server className="h-6 w-6 text-cyan-400" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {server.name || server.agentId}
                      </h3>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {server.hostname || 'Unknown hostname'}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {server.status || 'Unknown'}
                  </span>
                </div>

                {/* System Information */}
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-md bg-slate-800 px-3 py-2">
                    {server.platform || 'Unknown OS'}
                  </span>
                  <span className="rounded-md bg-slate-800 px-3 py-2">
                    Agent ID: {server.agentId}
                  </span>
                </div>

                {/* Resources */}
                <div className="mt-6 space-y-5 border-t border-slate-800 pt-5">
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

                {/* Activity */}
                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {server.processCount}
                      </p>
                      <p className="text-xs text-slate-500">Processes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Container className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {server.dockerContainerCount}
                      </p>
                      <p className="text-xs text-slate-500">Containers</p>
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="mt-5 flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Last Updated: {formatDate(server.collectedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default Servers;
