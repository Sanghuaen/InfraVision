import { useCallback, useEffect, useState } from 'react';
import {
    Box,
    RefreshCw,
    CircleCheck,
    CircleX,
    Clock3,
    Container,
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

function formatPorts(ports: Record<string, unknown>) {
    const entries = Object.entries(ports ?? {});

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

function Docker() {
    const [servers, setServers] = useState<ServerSummary[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [containers, setContainers] = useState<DockerContainer[]>([]);

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

    // Load Docker containers from latest metric
    const loadContainers = useCallback(async (isRefresh = false) => {
        if (!selectedAgentId) return;

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            const data: LatestMetric = await getLatestMetric(selectedAgentId);

            setContainers(
                Array.isArray(data.docker) ? data.docker : [],
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

    useEffect(() => {
        if (selectedAgentId) {
            loadContainers();
        }
    }, [selectedAgentId, loadContainers]);

    const runningContainers = containers.filter(
        (container) =>
            (container.status ?? '').toLowerCase() === 'running',
    );

    const exitedContainers = containers.filter(
        (container) =>
            (container.status ?? '').toLowerCase() === 'exited',
    );

    const handleRefresh = () => {
        loadContainers(true);
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
                        Docker Explorer
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Explore Docker containers across your infrastructure.
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
                                key={`${server.agentId || server.name || 'server'}-${index}`}
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
                        Unable to load Docker information
                    </p>
                    <p className="mt-1 text-sm text-red-400/70">
                        {error}
                    </p>
                </div>
            )}

            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard
                    title="Total Containers"
                    value={containers.length}
                    icon={<Container className="h-5 w-5 text-cyan-400" />}
                />

                <SummaryCard
                    title="Running"
                    value={runningContainers.length}
                    icon={<CircleCheck className="h-5 w-5 text-emerald-400" />}
                />

                <SummaryCard
                    title="Exited"
                    value={exitedContainers.length}
                    icon={<CircleX className="h-5 w-5 text-slate-400" />}
                />
            </div>

            {/* Container List */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">
                        Containers
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Container information collected from Docker Engine.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                        Loading containers...
                    </div>
                ) : containers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
                        <Box className="mx-auto h-10 w-10 text-slate-600" />
                        <h3 className="mt-4 font-semibold text-slate-300">
                            No containers found
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            No Docker container data is available for this server.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {containers.map((container, index) => {
                            const status = container.status ?? 'unknown';
                            const isRunning = status.toLowerCase() === 'running';

                            // Use an index fallback so every rendered item has a unique key,
                            // even if an incoming Docker record has a missing/duplicate ID.
                            const containerKey =
                                `${container.id || container.name || 'container'}-${index}`;

                            return (
                                <div
                                    key={containerKey}
                                    className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="rounded-lg bg-cyan-500/10 p-3">
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

                                        <span
                                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${isRunning
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-slate-700/50 text-slate-400'
                                                }`}
                                        >
                                            {status}
                                        </span>
                                    </div>

                                    <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Container ID
                                            </p>
                                            <p className="mt-1 break-all font-mono text-xs text-slate-300">
                                                {container.id || 'Unavailable'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Ports
                                            </p>
                                            <p className="mt-1 break-words text-xs text-slate-300">
                                                {formatPorts(container.ports)}
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
                Read-only monitoring. Container start, stop, and delete actions are not available.
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
    value: number;
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

export default Docker;
