
import { useCallback, useEffect, useState } from 'react';
import {
    RefreshCw,
    Clock3,
    HardDrive,
    Database,
    HardDriveDownload,
    HardDriveUpload,
} from 'lucide-react';

import {
    getServerSummary,
    getLatestMetric,
    getServerMetrics,
} from '../lib/api';

import type { StoragePartition } from '../types/storage';
import type { ServerSummary } from '../types/server';
import type { MetricHistory } from '../lib/api';

// Format bytes into readable units
function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return '0 Bytes';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );

    const value = bytes / Math.pow(1024, index);

    return `${value.toFixed(2)} ${units[index]}`;
}

function Storage() {
    const [servers, setServers] = useState<ServerSummary[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [partitions, setPartitions] = useState<StoragePartition[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const [history, setHistory] = useState<MetricHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

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

    // Load current storage information and historical metrics
    const loadStorage = useCallback(async (isRefresh = false) => {
        if (!selectedAgentId) return;

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setHistoryLoading(true);
            setError(null);
            setHistoryError(null);

            // Load latest storage information
            const data = await getLatestMetric(selectedAgentId);

            setPartitions(
                Array.isArray(data.disk?.partitions)
                    ? data.disk.partitions
                    : [],
            );

            setLastUpdated(data.collectedAt);

        } catch (err) {
            console.error(err);
            setError('Unable to load storage information.');
            setPartitions([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }

        // Load historical metrics separately
        try {
            const historyData = await getServerMetrics(selectedAgentId);

            const sortedHistory = [...historyData].sort(
                (a, b) =>
                    new Date(a.collectedAt).getTime() -
                    new Date(b.collectedAt).getTime()
            );

            setHistory(sortedHistory);
        } catch (err) {
            console.error(err);
            setHistory([]);
            setHistoryError('Unable to load storage history.');
        } finally {
            setHistoryLoading(false);
        }
    }, [selectedAgentId]);

    // Reload when selected server changes
    useEffect(() => {
        if (selectedAgentId) {
            setHistory([]);
            setPartitions([]);
            setLastUpdated(null);
            loadStorage();
        }
    }, [selectedAgentId, loadStorage]);

    // Summary calculations
    const totalCapacity = partitions.reduce(
        (total, item) => total + (Number(item.total) || 0),
        0,
    );

    const totalUsed = partitions.reduce(
        (total, item) => total + (Number(item.used) || 0),
        0,
    );

    const totalFree = partitions.reduce(
        (total, item) => total + (Number(item.free) || 0),
        0,
    );

    const handleRefresh = () => {
        loadStorage(true);
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
                        Storage Explorer
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Monitor disk partitions and storage utilization.
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
                        Unable to load storage information
                    </p>
                    <p className="mt-1 text-sm text-red-400/70">
                        {error}
                    </p>
                </div>
            )}

            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <SummaryCard
                    title="Total Drives"
                    value={partitions.length}
                    icon={<HardDrive className="h-5 w-5 text-cyan-400" />}
                />

                <SummaryCard
                    title="Total Capacity"
                    value={formatBytes(totalCapacity)}
                    icon={<Database className="h-5 w-5 text-blue-400" />}
                />

                <SummaryCard
                    title="Used Space"
                    value={formatBytes(totalUsed)}
                    icon={<HardDriveUpload className="h-5 w-5 text-purple-400" />}
                />

                <SummaryCard
                    title="Free Space"
                    value={formatBytes(totalFree)}
                    icon={<HardDriveDownload className="h-5 w-5 text-emerald-400" />}
                />

            </div>

            {/* Storage Partitions */}
            <section className="space-y-4">

                <div>
                    <h2 className="text-xl font-semibold text-white">
                        Disk Partitions
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Storage devices and their current capacity usage.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                        Loading storage information...
                    </div>
                ) : partitions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
                        <HardDrive className="mx-auto h-10 w-10 text-slate-600" />

                        <h3 className="mt-4 font-semibold text-slate-300">
                            No storage partitions found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            No disk partition data is available for this server.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">

                        {partitions.map((item, index) => {
                            const usage = Math.min(
                                Math.max(Number(item.usage) || 0, 0),
                                100,
                            );

                            return (
                                <div
                                    key={`${item.device}-${index}`}
                                    className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                                >

                                    {/* Drive Header */}
                                    <div className="flex items-start justify-between gap-3">

                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-cyan-500/10 p-3">
                                                <HardDrive className="h-6 w-6 text-cyan-400" />
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-white">
                                                    {item.device || 'Unknown Drive'}
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {item.filesystem || 'Unknown filesystem'}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                                            {item.mountpoint || 'N/A'}
                                        </span>

                                    </div>

                                    {/* Usage */}
                                    <div className="mt-6">

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-400">
                                                Storage Usage
                                            </span>

                                            <span className="text-lg font-bold tabular-nums text-white">
                                                {usage.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    usage >= 90
                                                        ? 'bg-red-400'
                                                        : usage >= 75
                                                            ? 'bg-amber-400'
                                                            : 'bg-cyan-400'
                                                }`}
                                                style={{ width: `${usage}%` }}
                                            />
                                        </div>

                                    </div>

                                    {/* Capacity Details */}
                                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Used
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-white">
                                                {formatBytes(item.used)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Free
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-emerald-400">
                                                {formatBytes(item.free)}
                                            </p>
                                        </div>

                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-500">
                                                Total Capacity
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-300">
                                                {formatBytes(item.total)}
                                            </p>
                                        </div>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}
            </section>

            {/* Storage History */}
            <section className="space-y-4">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Storage History
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Historical disk utilization for each drive.
                        </p>
                    </div>

                    <span className="text-xs text-slate-500">
                        {history.length} snapshots
                    </span>
                </div>

                {historyLoading ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                        Loading storage history...
                    </div>
                ) : historyError ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                        {historyError}
                    </div>
                ) : history.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
                        <Database className="mx-auto h-9 w-9 text-slate-600" />

                        <h3 className="mt-3 font-semibold text-slate-300">
                            No storage history available
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Historical storage data will appear after the agent
                            collects metrics.
                        </p>
                    </div>
                ) : partitions.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-500">
                        No current drives are available to display.
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {partitions.map((partition, index) => (
                            <StorageHistoryChart
                                key={`${partition.device}-${index}`}
                                drive={partition.device}
                                history={history}
                            />
                        ))}
                    </div>
                )}

            </section>

            <p className="text-xs text-slate-500">
                Read-only monitoring. Storage information is collected from the
                operating system through the InfraVision Agent.
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

// Storage History Chart
function StorageHistoryChart({
    drive,
    history,
}: {
    drive: string;
    history: MetricHistory[];
}) {
    const chartWidth = 700;
    const chartHeight = 260;

    const paddingLeft = 48;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 42;

    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const points = history
        .map((metric) => {
            const partition = metric.disk?.partitions?.find(
                (item) => item.device === drive
            );

            if (!partition) return null;

            const timestamp = new Date(metric.collectedAt).getTime();
            const usage = Number(partition.usage);

            if (!Number.isFinite(timestamp) || !Number.isFinite(usage)) {
                return null;
            }

            return {
                timestamp,
                usage: Math.min(Math.max(usage, 0), 100),
                collectedAt: metric.collectedAt,
            };
        })
        .filter(
            (point): point is {
                timestamp: number;
                usage: number;
                collectedAt: string;
            } => point !== null
        )
        .sort((a, b) => a.timestamp - b.timestamp);

    const firstTimestamp = points[0]?.timestamp ?? 0;
    const lastTimestamp = points[points.length - 1]?.timestamp ?? 0;
    const timeRange = lastTimestamp - firstTimestamp;

    const getX = (timestamp: number) => {
        if (timeRange <= 0) {
            return paddingLeft + plotWidth / 2;
        }

        return paddingLeft +
            ((timestamp - firstTimestamp) / timeRange) * plotWidth;
    };

    const getY = (usage: number) => {
        return paddingTop + (1 - usage / 100) * plotHeight;
    };

    const path = points
        .map((point, index) => {
            const x = getX(point.timestamp);
            const y = getY(point.usage);

            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    const firstDate = points.length > 0
        ? new Date(firstTimestamp).toLocaleString()
        : '';

    const lastDate = points.length > 0
        ? new Date(lastTimestamp).toLocaleString()
        : '';

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

            {/* Chart Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-white">
                        {drive}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Disk utilization over time
                    </p>
                </div>

                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
                    {points.length} records
                </span>
            </div>

            {points.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
                    No historical data available for this drive.
                </div>
            ) : (
                <>
                    {/* Chart */}
                    <div className="mt-5 w-full overflow-hidden">
                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            className="h-auto w-full"
                            role="img"
                            aria-label={`Storage usage history for ${drive}`}
                        >
                            {/* Horizontal Grid Lines */}
                            {[0, 25, 50, 75, 100].map((value) => {
                                const y = getY(value);

                                return (
                                    <g key={value}>
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
                                            fontSize="12"
                                        >
                                            {value}%
                                        </text>
                                    </g>
                                );
                            })}

                            {/* History Line */}
                            {points.length > 1 && (
                                <path
                                    d={path}
                                    fill="none"
                                    stroke="#22d3ee"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {/* Data Points */}
                            {points.map((point, index) => {
                                const x = getX(point.timestamp);
                                const y = getY(point.usage);

                                return (
                                    <circle
                                        key={`${point.timestamp}-${index}`}
                                        cx={x}
                                        cy={y}
                                        r="4.5"
                                        fill="#22d3ee"
                                        stroke="#0f172a"
                                        strokeWidth="2"
                                    >
                                        <title>
                                            {new Date(point.collectedAt).toLocaleString()}
                                            {' — '}
                                            {point.usage.toFixed(1)}%
                                        </title>
                                    </circle>
                                );
                            })}

                            {/* X Axis Labels */}
                            <text
                                x={paddingLeft}
                                y={chartHeight - 12}
                                textAnchor="start"
                                fill="#94a3b8"
                                fontSize="11"
                            >
                                {new Date(firstTimestamp).toLocaleDateString()}
                            </text>

                            <text
                                x={chartWidth - paddingRight}
                                y={chartHeight - 12}
                                textAnchor="end"
                                fill="#94a3b8"
                                fontSize="11"
                            >
                                {new Date(lastTimestamp).toLocaleDateString()}
                            </text>
                        </svg>
                    </div>

                    {/* Chart Footer */}
                    <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            From: {firstDate}
                        </span>

                        <span>
                            To: {lastDate}
                        </span>
                    </div>
                </>
            )}

            <p className="mt-3 text-xs text-slate-500">
                Points are positioned by actual collection time. Gaps indicate
                periods without collected data.
            </p>

        </div>
    );
}

export default Storage;
