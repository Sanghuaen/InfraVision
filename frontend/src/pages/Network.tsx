
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Clock3,
  Network as NetworkIcon,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';

import {
  getServerSummary,
  getLatestMetric,
} from '../lib/api';

import type { NetworkInterface } from '../types/network';
import type { ServerSummary } from '../types/server';

// Format bytes into readable units
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 Bytes';
  }

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(2)} ${units[index]}`;
}

function Network() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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

  // Load network interfaces
  const loadNetwork = useCallback(async (isRefresh = false) => {
    if (!selectedAgentId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data = await getLatestMetric(selectedAgentId);

      setInterfaces(
        Array.isArray(data.network) ? data.network : [],
      );

      setLastUpdated(data.collectedAt);
    } catch (err) {
      console.error(err);
      setError('Unable to load network information.');
      setInterfaces([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAgentId]);

  // Reload when selected server changes
  useEffect(() => {
    if (selectedAgentId) {
      loadNetwork();
    }
  }, [selectedAgentId, loadNetwork]);

  // Summary calculations
  const activeInterfaces = interfaces.filter(
    (item) =>
      item.bytes_recv > 0 ||
      item.bytes_sent > 0 ||
      item.packets_recv > 0 ||
      item.packets_sent > 0,
  ).length;

  const totalReceived = interfaces.reduce(
    (total, item) => total + (Number(item.bytes_recv) || 0),
    0,
  );

  const totalSent = interfaces.reduce(
    (total, item) => total + (Number(item.bytes_sent) || 0),
    0,
  );

  const handleRefresh = () => {
    loadNetwork(true);
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
            Network Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor network interfaces and traffic statistics.
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
            Unable to load network information
          </p>
          <p className="mt-1 text-sm text-red-400/70">
            {error}
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Interfaces"
          value={interfaces.length}
          icon={<NetworkIcon className="h-5 w-5 text-cyan-400" />}
        />

        <SummaryCard
          title="Interfaces with Traffic"
          value={activeInterfaces}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
        />

        <SummaryCard
          title="Total Received"
          value={formatBytes(totalReceived)}
          icon={<ArrowDownToLine className="h-5 w-5 text-blue-400" />}
        />

        <SummaryCard
          title="Total Sent"
          value={formatBytes(totalSent)}
          icon={<ArrowUpFromLine className="h-5 w-5 text-purple-400" />}
        />

      </div>

      {/* Network Interfaces */}
      <section className="space-y-4">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Network Interfaces
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Network adapters detected by the operating system.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading network interfaces...
          </div>
        ) : interfaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <NetworkIcon className="mx-auto h-10 w-10 text-slate-600" />

            <h3 className="mt-4 font-semibold text-slate-300">
              No network interfaces found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              No network data is available for this server.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">

            <table className="w-full min-w-[950px] text-left text-sm">

              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Interface</th>
                  <th className="px-5 py-4">IP Address</th>
                  <th className="px-5 py-4">MAC Address</th>
                  <th className="px-5 py-4 text-right">Received</th>
                  <th className="px-5 py-4 text-right">Sent</th>
                  <th className="px-5 py-4 text-right">Packets In</th>
                  <th className="px-5 py-4 text-right">Packets Out</th>
                  <th className="px-5 py-4">Activity</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">

                {interfaces.map((item, index) => {
                  const hasTraffic =
                    item.bytes_recv > 0 ||
                    item.bytes_sent > 0 ||
                    item.packets_recv > 0 ||
                    item.packets_sent > 0;

                  return (
                    <tr
                      key={`${item.interface}-${index}`}
                      className="transition hover:bg-slate-800/40"
                    >

                      <td className="px-5 py-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <NetworkIcon className="h-4 w-4 text-cyan-400" />
                          {item.interface || 'Unknown'}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-400">
                        {item.ip_address || 'N/A'}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-400">
                        {item.mac_address || 'N/A'}
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-blue-400">
                        {formatBytes(Number(item.bytes_recv) || 0)}
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-purple-400">
                        {formatBytes(Number(item.bytes_sent) || 0)}
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-slate-300">
                        {(Number(item.packets_recv) || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-slate-300">
                        {(Number(item.packets_sent) || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${hasTraffic
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-700/50 text-slate-400'
                            }`}
                        >
                          {hasTraffic ? 'Traffic detected' : 'No traffic'}
                        </span>
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
        Read-only monitoring. Traffic values represent cumulative network
        counters, not real-time transfer speeds.
      </p>

    </div>
  );
}

// Summary Card
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

      <p className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

export default Network;
