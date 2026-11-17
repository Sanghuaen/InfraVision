import { useCallback, useEffect, useState } from 'react';
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
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

const formatLastUpdated = (date: string | null) => {
  if (!date) {
    return 'Never';
  }

  return new Date(date).toLocaleTimeString('en-US', {
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

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

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

        setServers(data);

        /*
         * ใช้ collectedAt จาก Backend
         * หาเวลาที่ใหม่ที่สุดจาก Server ทั้งหมด
         */

        if (data.length > 0) {
          const latest = data.reduce((latestServer, server) => {
            if (!server.collectedAt) {
              return latestServer;
            }

            if (!latestServer.collectedAt) {
              return server;
            }

            return new Date(server.collectedAt).getTime() >
              new Date(latestServer.collectedAt).getTime()
              ? server
              : latestServer;
          });

          setLastUpdated(latest.collectedAt);
        } else {
          setLastUpdated(null);
        }

      } catch (err) {
        console.error(err);

        setError(
          'Unable to load server information.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /*
   * Initial load
   */
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  /*
   * Auto Refresh
   */
  useEffect(() => {
    if (refreshInterval === 0) {
      return;
    }

    const interval = setInterval(() => {
      loadServers(true);
    }, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval, loadServers]);

  const handleRefresh = () => {
    loadServers(true);
  };

  const onlineServers = servers.filter(
    (server) =>
      server.status.toLowerCase() === 'online',
  ).length;

  const averageCpu =
    servers.length > 0
      ? servers.reduce(
        (sum, server) => sum + server.cpu,
        0,
      ) / servers.length
      : 0;

  const averageMemory =
    servers.length > 0
      ? servers.reduce(
        (sum, server) => sum + server.memory,
        0,
      ) / servers.length
      : 0;

  const totalContainers = servers.reduce(
    (sum, server) =>
      sum + server.dockerContainerCount,
    0,
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <p className="text-sm font-medium text-emerald-400">
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

              <p className="text-xs font-medium text-slate-300">
                {formatLastUpdated(lastUpdated)}
              </p>
            </div>

          </div>

          {/* Auto Refresh */}
          <select
            value={refreshInterval}
            onChange={(event) =>
              setRefreshInterval(
                Number(
                  event.target.value,
                ) as RefreshInterval,
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none transition hover:border-slate-700 focus:border-cyan-500"
          >
            <option value={0}>
              Auto Refresh: Off
            </option>

            <option value={10000}>
              Auto Refresh: 10s
            </option>

            <option value={30000}>
              Auto Refresh: 30s
            </option>

            <option value={60000}>
              Auto Refresh: 1m
            </option>
          </select>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="group inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing
                  ? 'animate-spin'
                  : 'transition-transform duration-500 group-hover:rotate-180'
                }`}
            />

            {refreshing ? 'Updating' : 'Refresh'}
          </button>

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">

          <div className="flex items-center justify-between gap-4">

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
              className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              Retry
            </button>

          </div>

        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
            />
          ))}

        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Servers"
            value={servers.length}
            description={`${onlineServers} online`}
            icon={Server}
            status="healthy"
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
            title="Docker Containers"
            value={totalContainers}
            description="Across all servers"
            icon={HardDrive}
            status="healthy"
          />

        </div>
      )}

      {/* Server Overview */}
      {!loading && (
        <section>

          <div className="mb-5 flex items-end justify-between">

            <div>
              <h2 className="text-xl font-semibold text-white">
                Server Overview
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Current resource usage across your infrastructure.
              </p>
            </div>

            <span className="hidden text-xs text-slate-500 sm:block">
              {onlineServers} of {servers.length} servers online
            </span>

          </div>

          {/* Empty */}
          {servers.length === 0 && !error && (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-16 text-center">

              <Server className="mx-auto h-10 w-10 text-slate-600" />

              <h3 className="mt-4 font-semibold text-slate-300">
                No servers found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Connect an Agent to begin monitoring your infrastructure.
              </p>

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
      )}

    </div>
  );
}