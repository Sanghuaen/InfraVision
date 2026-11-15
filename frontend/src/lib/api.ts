
import type { ServerSummary } from '../types/server';

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

export interface LatestMetric {
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
