
import { useEffect, useMemo, useState } from 'react';
import { 
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  FileText,
  Activity,
} from 'lucide-react';

import { getServerLogs } from '../lib/api';
import type { WindowsLog } from '../types/log';

export default function Logs() {
  const [logs, setLogs] = useState<WindowsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');

  // TODO: เปลี่ยนเป็น Server ID จากระบบเลือก Server
const agentId = 'test-server';
  async function fetchLogs() {
    try {
      setLoading(true);
      setError('');

      const data = await getServerLogs(agentId);
      setLogs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load logs',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [agentId]);

  // Overview statistics
  const stats = useMemo(() => ({
    total: logs.length,
    information: logs.filter(
      (log) => log.level.toLowerCase() === 'information',
    ).length,
    warning: logs.filter(
      (log) => log.level.toLowerCase() === 'warning',
    ).length,
    error: logs.filter(
      (log) =>
        ['error', 'critical'].includes(log.level.toLowerCase()),
    ).length,
  }), [logs]);

  // Search and filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        log.message?.toLowerCase().includes(keyword) ||
        log.source?.toLowerCase().includes(keyword) ||
        String(log.eventId).includes(keyword);

      const matchesLevel =
        levelFilter === 'All' ||
        log.level.toLowerCase() === levelFilter.toLowerCase();

      const matchesChannel =
        channelFilter === 'All' ||
        log.channel.toLowerCase() === channelFilter.toLowerCase();

      return matchesSearch && matchesLevel && matchesChannel;
    });
  }, [logs, search, levelFilter, channelFilter]);

  function getLevelStyle(level: string) {
    switch (level.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';

      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';

      case 'information':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';

      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">
              Logs Explorer
            </h1>
          </div>

          <p className="text-sm text-gray-400 mt-1">
            Monitor and explore system events and application logs
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-sm text-white disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Total Logs"
          value={stats.total}
          icon={<Activity className="w-5 h-5" />}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
        />

        <StatCard
          title="Information"
          value={stats.information}
          icon={<Info className="w-5 h-5" />}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />

        <StatCard
          title="Warnings"
          value={stats.warning}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-yellow-400"
          bg="bg-yellow-500/10"
        />

        <StatCard
          title="Errors"
          value={stats.error}
          icon={<AlertCircle className="w-5 h-5" />}
          color="text-red-400"
          bg="bg-red-500/10"
        />

      </div>

      {/* Logs Explorer */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60">

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-800 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Event Logs
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {filteredLogs.length} of {logs.length} events
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

              <input
                type="text"
                placeholder="Search message, source, event ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Levels</option>
              <option value="Information">Information</option>
              <option value="Warning">Warning</option>
              <option value="Error">Error</option>
              <option value="Critical">Critical</option>
            </select>

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Channels</option>
              <option value="Application">Application</option>
              <option value="System">System</option>
            </select>

          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">

          <table className="w-full text-sm text-left">

            <thead className="bg-gray-800/70 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">Level</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Event ID</th>
                <th className="px-5 py-4">Channel</th>
                <th className="px-5 py-4 min-w-[300px]">Message</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800">

              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-red-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    {error}
                    <div className="mt-3">
                      <button
                        onClick={fetchLogs}
                        className="text-cyan-400 hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-gray-400 text-xs">
                      {formatDate(log.timestamp)}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getLevelStyle(log.level)}`}>
                        {log.level}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-300 whitespace-nowrap">
                      {log.source}
                    </td>

                    <td className="px-5 py-4 text-gray-400 font-mono">
                      {log.eventId}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-400 text-xs">
                        {log.channel}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-400 max-w-md">
                      <p className="line-clamp-2" title={log.message}>
                        {log.message}
                      </p>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {filteredLogs.length} events
          </span>
          <span>
            Auto refresh: Off
          </span>
        </div>

      </div>
    </div>
  );
}

// Statistics Card
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function StatCard({
  title,
  value,
  icon,
  color,
  bg,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2">
            {value.toLocaleString()}
          </h3>
        </div>

        <div className={`p-3 rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
