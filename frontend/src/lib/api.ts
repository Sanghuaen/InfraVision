
import type { ServerSummary } from '../types/server';
import type { NetworkInterface } from '../types/network';
import type { DiskInfo } from '../types/storage';
import type { WindowsLog } from '../types/log';

const API_BASE_URL = 'http://localhost:3000';

// ==============================
// Server Summary
// ==============================

export async function getServerSummary(): Promise<ServerSummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/servers/summary`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch server summary: ${response.status}`,
    );
  }

  return response.json();
}

// ==============================
// Docker Containers
// ==============================

export interface DockerContainer {
  id: string;
  name: string;
  status?: string;
  image: string | null;
  ports: Record<string, unknown>;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  username: string | null;
  status: string;
  cpu_percent: number;
  memory_mb: number;
}

export interface LatestMetric {
  disk: DiskInfo;
  docker: DockerContainer[];
  processes: ProcessInfo[];
  network: NetworkInterface[];
  collectedAt: string;
}


export interface MetricHistory {
  id: number;
  cpu: Record<string, unknown>;
  memory: Record<string, unknown>;
  disk: DiskInfo;
  network: NetworkInterface[];
  processes: ProcessInfo[];
  docker: DockerContainer[];
  collectedAt: string;
}


export async function getLatestMetric(
  agentId: string,
): Promise<LatestMetric> {
  const response = await fetch(
    `${API_BASE_URL}/servers/${encodeURIComponent(agentId)}/metrics/latest`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest metrics: ${response.status}`,
    );
  }

  return response.json();
}


export async function getServerMetrics(
  agentId: string,
): Promise<MetricHistory[]> {
  const response = await fetch(
    `${API_BASE_URL}/servers/${encodeURIComponent(agentId)}/metrics`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch metric history: ${response.status}`,
    );
  }

  return response.json();
}



// ==============================
// Windows Event Logs
// ==============================

export async function getServerLogs(
  agentId: string,
): Promise<WindowsLog[]> {
  const response = await fetch(
    `${API_BASE_URL}/servers/${encodeURIComponent(agentId)}/logs`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch server logs: ${response.status}`,
    );
  }

  return response.json();
}

