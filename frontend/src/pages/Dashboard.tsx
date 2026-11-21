
import { useCallback, useEffect, useState } from 'react';
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Container,
  RefreshCw,
  Clock3,
} from 'lucide-react';

import { SummaryCard } from '../components/dashboard/SummaryCard';
import { ServerCard } from '../components/dashboard/ServerCard';
import { getServerSummary } from '../lib/api';
import type { ServerSummary } from '../types/server';

type UsageStatus = 'healthy' | 'warning' | 'critical';

type RefreshInterval = 0 | 10000 | 30000 | 60000;

const getUsageStatus = (value: number): UsageStatus => {
  if (value >= 90) return 'critical';
  if (value >= 75) return 'warning';
  return 'healthy';
};

const getSafeNumber = (value: number | null | undefined) => {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : 0;
};

const isServerOnline = (status?: string | null) => {
  return ['online', 'connected'].includes(
    (status || '').toLowerCase(),
  );
};

const formatLastUpdated = (date: string | null) => {
  if (!date) return 'Never';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown';
  }

  return parsedDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export default function Dashboard() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(0);

  const loadServers = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const data = await getServerSummary();
        const safeData = Array.isArray(data) ? data : [];

        setServers(safeData);

        // Find the newest collectedAt from all servers.
        if (safeData.length > 0) {
          const latest = safeData.reduce((latestServer, server) => {
            if (!server.collectedAt) return latestServer;
            if (!latestServer.collectedAt) return server;

            return new Date(server.collectedAt).getTime() >
              new Date(latestServer.collectedAt).getTime()
              ? server
              : latestServer;
          });

          setLastUpdated(latest.collectedAt || null);
        } else {
          setLastUpdated(null);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Unable to load server information.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // Auto Refresh
  useEffect(() => {
    if (refreshInterval === 0) return;

    const interval = setInterval(() => {
      loadServers(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, loadServers]);

  const handleRefresh = () => {
    loadServers(true);
  };

  // Server statistics
  const onlineServers = servers.filter((server) =>
    isServerOnline(server.status),
  ).length;

  const offlineServers = servers.length - onlineServers;

  // Average resource usage
  const averageCpu =
    servers.length > 0
      ? servers.reduce(
          (sum, server) => sum + getSafeNumber(server.cpu),
          0,
        ) / servers.length
      : 0;

  const averageMemory =
    servers.length > 0
      ? servers.reduce(
          (sum, server) => sum + getSafeNumber(server.memory),
          0,
        ) / servers.length
      : 0;

  const averageDisk =
    servers.length > 0
      ? servers.reduce(
          (sum, server) => sum + getSafeNumber(server.disk),
          0,
        ) / servers.length
      : 0;

  const totalContainers = servers.reduce(
    (sum, server) =>
      sum + getSafeNumber(server.dockerContainerCount),
    0,
  );

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                onlineServers > 0
                  ? 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
            />

            <p className="text-sm font-medium text-cyan-400">
              Infrastructure Overview
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor your infrastructure from one place.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Last Updated */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            <Clock3 className="h-4 w-4 text-slate-500" />

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Last Updated
              </p>

              <p className="text-xs font-medium tabular-nums text-slate-300">
                {formatLastUpdated(lastUpdated)}
              </p>
            </div>
          </div>

          {/* Auto Refresh */}
          <select
            value={refreshInterval}
            onChange={(event) =>
              setRefreshInterval(
                Number(event.target.value) as RefreshInterval,
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none transition hover:border-slate-700 focus:border-cyan-500"
          >
            <option value={0}>Auto Refresh: Off</option>
            <option value={10000}>Auto Refresh: 10s</option>
            <option value={30000}>Auto Refresh: 30s</option>
            <option value={60000}>Auto Refresh: 1m</option>
          </select>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="group inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? 'animate-spin'
                  : 'transition-transform duration-500 group-hover:rotate-180'
              }`}
            />

            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-red-400">
                Unable to load infrastructure
              </p>

              <p className="mt-1 text-sm text-red-400/70">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
            />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* Summary */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Infrastructure Summary
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Overall status and resource utilization.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Total Servers"
                value={servers.length}
                description={`${onlineServers} connected`}
                icon={Server}
                status="healthy"
              />

              <SummaryCard
                title="Offline / Unknown"
                value={offlineServers}
                description="Servers not connected"
                icon={Server}
                status={offlineServers > 0 ? 'warning' : 'healthy'}
              />

              <SummaryCard
                title="Average CPU"
                value={`${averageCpu.toFixed(1)}%`}
                description="Across all servers"
                icon={Cpu}
                progress={averageCpu}
                status={getUsageStatus(averageCpu)}
              />

              <SummaryCard
                title="Average Memory"
                value={`${averageMemory.toFixed(1)}%`}
                description="Across all servers"
                icon={MemoryStick}
                progress={averageMemory}
                status={getUsageStatus(averageMemory)}
              />

              <SummaryCard
                title="Average Disk"
                value={`${averageDisk.toFixed(1)}%`}
                description="Across all servers"
                icon={HardDrive}
                progress={averageDisk}
                status={getUsageStatus(averageDisk)}
              />

              <SummaryCard
                title="Docker Containers"
                value={totalContainers}
                description="Across all servers"
                icon={Container}
                status="healthy"
              />
            </div>
          </section>

          {/* Server Overview */}
          <section className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Server Overview
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Current resource usage across your infrastructure.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {onlineServers} Online
                </span>

                <span className="text-slate-700">|</span>

                <span>
                  {offlineServers} Offline / Unknown
                </span>
              </div>
            </div>

            {/* Empty State */}
            {servers.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-16 text-center">
                <Server className="mx-auto h-10 w-10 text-slate-600" />

                <h3 className="mt-4 font-semibold text-slate-300">
                  No servers found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Connect an Agent to begin monitoring your infrastructure.
                </p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            )}

            {/* Server Cards */}
            {servers.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {servers.map((server) => (
                  <ServerCard
                    key={server.serverId}
                    server={server}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
