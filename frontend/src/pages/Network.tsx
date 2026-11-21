
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Clock3,
  Network as NetworkIcon,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Database,
} from 'lucide-react';

import {
  getServerSummary,
  getLatestMetric,
  getServerMetrics,
} from '../lib/api';

import type { NetworkInterface } from '../types/network';
import type { ServerSummary } from '../types/server';
import type { MetricHistory } from '../lib/api';

// ==============================
// Helpers
// ==============================

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 Bytes';
  }

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function formatSpeed(mbps: number): string {
  if (!Number.isFinite(mbps) || mbps < 0) {
    return '0 Mbps';
  }

  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  }

  return `${mbps.toFixed(2)} Mbps`;
}

// Safely read network interfaces from historical metrics
function getNetworkInterfaces(
  metric: MetricHistory,
): NetworkInterface[] {
  if (Array.isArray(metric.network)) {
    return metric.network;
  }

  return [];
}

// ==============================
// Network Component
// ==============================

function Network() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);

  const [history, setHistory] = useState<MetricHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // ==============================
  // Load Servers
  // ==============================

  useEffect(() => {
    async function loadServers() {
      try {
        const data = await getServerSummary();

        setServers(data);

        if (data.length > 0) {
          const defaultServer =
            data.find((server) => server.agentId === 'test-server')
            ?? data[0];

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

  // ==============================
  // Load Current + Historical Data
  // ==============================

  const loadNetwork = useCallback(async (isRefresh = false) => {
    if (!selectedAgentId) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setHistoryLoading(true);
    setError(null);
    setHistoryError(null);

    // Load latest network information
    try {
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

    // Load historical metrics separately
    try {
      const historyData = await getServerMetrics(selectedAgentId);
      console.log('NETWORK HISTORY:', historyData);

      console.log(
        'FIRST NETWORK DATA:',
        historyData[0]?.network,
      );

      console.log(
        'NETWORK DATA TYPE:',
        typeof historyData[0]?.network,
        Array.isArray(historyData[0]?.network),
      );
      const sortedHistory = [...historyData].sort(
        (a, b) =>
          new Date(a.collectedAt).getTime()
          - new Date(b.collectedAt).getTime()
      );

      setHistory(sortedHistory);
    } catch (err) {
      console.error(err);
      setHistory([]);
      setHistoryError('Unable to load network history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedAgentId]);

  // ==============================
  // Reload on Server Change
  // ==============================

  useEffect(() => {
    if (selectedAgentId) {
      setInterfaces([]);
      setHistory([]);
      setLastUpdated(null);

      loadNetwork();
    }
  }, [selectedAgentId, loadNetwork]);

  // ==============================
  // Summary Calculations
  // ==============================

  const activeInterfaces = interfaces.filter(
    (item) =>
      Number(item.bytes_recv) > 0
      || Number(item.bytes_sent) > 0
      || Number(item.packets_recv) > 0
      || Number(item.packets_sent) > 0,
  ).length;

  const totalReceived = interfaces.reduce(
    (total, item) =>
      total + (Number(item.bytes_recv) || 0),
    0,
  );

  const totalSent = interfaces.reduce(
    (total, item) =>
      total + (Number(item.bytes_sent) || 0),
    0,
  );

  // Collect interface names from historical metrics
  const historicalInterfaceNames = Array.from(
    new Set(
      history.flatMap((metric) =>
        getNetworkInterfaces(metric)
          .map((item) => item.interface)
          .filter(
            (name): name is string =>
              typeof name === 'string' && name.length > 0
          )
      )
    )
  ).sort();

  // Refresh
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
            Monitor network interfaces, traffic and historical performance.
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
                    Number(item.bytes_recv) > 0
                    || Number(item.bytes_sent) > 0
                    || Number(item.packets_recv) > 0
                    || Number(item.packets_sent) > 0;

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

      {/* Network History */}
      <section className="space-y-4">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Network History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Historical download and upload traffic for each network interface.
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {history.length} snapshots
          </span>
        </div>

        {historyLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading network history...
          </div>
        ) : historyError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {historyError}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <Database className="mx-auto h-9 w-9 text-slate-600" />

            <h3 className="mt-3 font-semibold text-slate-300">
              No network history available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Historical network data will appear after the agent
              collects metrics containing network information.
            </p>
          </div>
        ) : historicalInterfaceNames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <NetworkIcon className="mx-auto h-9 w-9 text-slate-600" />

            <h3 className="mt-3 font-semibold text-slate-300">
              No historical network interfaces found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Metrics exist, but their network fields are empty.
              Check the network data stored by the agent.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {historicalInterfaceNames.map((name) => (
              <NetworkHistoryChart
                key={name}
                interfaceName={name}
                history={history}
              />
            ))}
          </div>
        )}

      </section>

      <p className="text-xs text-slate-500">
        Read-only monitoring. Traffic speed is calculated from differences
        between cumulative network counters in historical metrics.
      </p>

    </div>
  );
}

// ==============================
// Summary Card
// ==============================

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

// ==============================
// Network History Chart
// ==============================

function NetworkHistoryChart({
  interfaceName,
  history,
}: {
  interfaceName: string;
  history: MetricHistory[];
}) {
  const chartWidth = 700;
  const chartHeight = 280;

  const paddingLeft = 58;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 42;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Extract cumulative counters from historical metrics
  const rawPoints = history
    .map((metric) => {
      const item = getNetworkInterfaces(metric).find(
        (network) => network.interface === interfaceName
      );

      if (!item) return null;

      const timestamp = new Date(metric.collectedAt).getTime();
      const received = Number(item.bytes_recv);
      const sent = Number(item.bytes_sent);

      if (
        !Number.isFinite(timestamp)
        || !Number.isFinite(received)
        || !Number.isFinite(sent)
      ) {
        return null;
      }

      return {
        timestamp,
        received,
        sent,
        collectedAt: metric.collectedAt,
      };
    })
    .filter(
      (point): point is {
        timestamp: number;
        received: number;
        sent: number;
        collectedAt: string;
      } => point !== null
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  // Calculate Mbps from counter differences
  const points: {
    timestamp: number;
    download: number;
    upload: number;
    collectedAt: string;
  }[] = [];

  for (let index = 1; index < rawPoints.length; index++) {
    const previous = rawPoints[index - 1];
    const current = rawPoints[index];

    const elapsedSeconds =
      (current.timestamp - previous.timestamp) / 1000;

    if (elapsedSeconds <= 0) continue;

    const receivedDiff = current.received - previous.received;
    const sentDiff = current.sent - previous.sent;

    // Skip counter resets instead of displaying negative speed
    if (receivedDiff < 0 || sentDiff < 0) continue;

    const download =
      (receivedDiff * 8) / elapsedSeconds / 1_000_000;

    const upload =
      (sentDiff * 8) / elapsedSeconds / 1_000_000;

    points.push({
      timestamp: current.timestamp,
      download,
      upload,
      collectedAt: current.collectedAt,
    });
  }

  const maxSpeed = Math.max(
    1,
    ...points.flatMap((point) => [
      point.download,
      point.upload,
    ])
  );

  // Dynamic Y-axis scale
  const axisMax = Math.ceil(maxSpeed * 1.2 * 10) / 10 || 1;

  const getX = (timestamp: number) => {
    const first = points[0]?.timestamp ?? 0;
    const last = points[points.length - 1]?.timestamp ?? 0;
    const range = last - first;

    if (range <= 0) {
      return paddingLeft + plotWidth / 2;
    }

    return paddingLeft
      + ((timestamp - first) / range) * plotWidth;
  };

  const getY = (speed: number) => {
    return paddingTop
      + (1 - speed / axisMax) * plotHeight;
  };

  const createPath = (
    key: 'download' | 'upload',
  ) => {
    return points
      .map((point, index) => {
        const x = getX(point.timestamp);
        const y = getY(point[key]);

        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const downloadPath = createPath('download');
  const uploadPath = createPath('upload');

  const firstTimestamp = points[0]?.timestamp ?? 0;
  const lastTimestamp = points[points.length - 1]?.timestamp ?? 0;

  const averageDownload = points.length > 0
    ? points.reduce((sum, point) => sum + point.download, 0) / points.length
    : 0;

  const averageUpload = points.length > 0
    ? points.reduce((sum, point) => sum + point.upload, 0) / points.length
    : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <NetworkIcon className="h-4 w-4 text-cyan-400" />
            <h3 className="font-semibold text-white">
              {interfaceName}
            </h3>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Network traffic over time
          </p>
        </div>

        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
          {points.length} records
        </span>
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span className="text-slate-400">Download</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
          <span className="text-slate-400">Upload</span>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
          <Activity className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          Not enough valid historical snapshots to calculate traffic speed.
          At least two valid collection records are required.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mt-4 w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Network traffic history for ${interfaceName}`}
            >
              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const value = axisMax * ratio;
                const y = getY(value);

                return (
                  <g key={ratio}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 5"
                    />

                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="11"
                    >
                      {value.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Download Line */}
              {points.length > 1 && (
                <path
                  d={downloadPath}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Upload Line */}
              {points.length > 1 && (
                <path
                  d={uploadPath}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Download Points */}
              {points.map((point, index) => (
                <circle
                  key={`download-${point.timestamp}-${index}`}
                  cx={getX(point.timestamp)}
                  cy={getY(point.download)}
                  r="3.5"
                  fill="#60a5fa"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                >
                  <title>
                    {new Date(point.collectedAt).toLocaleString()}
                    {' — Download: '}
                    {formatSpeed(point.download)}
                  </title>
                </circle>
              ))}

              {/* Upload Points */}
              {points.map((point, index) => (
                <circle
                  key={`upload-${point.timestamp}-${index}`}
                  cx={getX(point.timestamp)}
                  cy={getY(point.upload)}
                  r="3.5"
                  fill="#a78bfa"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                >
                  <title>
                    {new Date(point.collectedAt).toLocaleString()}
                    {' — Upload: '}
                    {formatSpeed(point.upload)}
                  </title>
                </circle>
              ))}

              {/* X Axis Labels */}
              <text
                x={paddingLeft}
                y={chartHeight - 12}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="11"
              >
                {new Date(firstTimestamp).toLocaleString()}
              </text>

              <text
                x={chartWidth - paddingRight}
                y={chartHeight - 12}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {new Date(lastTimestamp).toLocaleString()}
              </text>
            </svg>
          </div>

          {/* Average Speed */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">

            <div className="rounded-lg bg-slate-950/50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ArrowDownToLine className="h-4 w-4 text-blue-400" />
                Average Download
              </div>

              <p className="mt-2 text-lg font-bold text-blue-400">
                {formatSpeed(averageDownload)}
              </p>
            </div>

            <div className="rounded-lg bg-slate-950/50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ArrowUpFromLine className="h-4 w-4 text-purple-400" />
                Average Upload
              </div>

              <p className="mt-2 text-lg font-bold text-purple-400">
                {formatSpeed(averageUpload)}
              </p>
            </div>

          </div>

          {/* Chart Footer */}
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              From: {new Date(firstTimestamp).toLocaleString()}
            </span>

            <span>
              To: {new Date(lastTimestamp).toLocaleString()}
            </span>
          </div>
        </>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Speed is calculated using cumulative byte differences
        divided by the actual elapsed collection time.
      </p>

    </div>
  );
}

export default Network;
