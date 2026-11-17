
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
} from '../lib/api';

import type { StoragePartition } from '../types/storage';
import type { ServerSummary } from '../types/server';

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

    // Load storage information
    const loadStorage = useCallback(async (isRefresh = false) => {
        if (!selectedAgentId) return;

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

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
    }, [selectedAgentId]);

    // Reload when selected server changes
    useEffect(() => {
        if (selectedAgentId) {
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
                                                className={`h-full rounded-full transition-all ${usage >= 90
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

export default Storage;
