import type { ServerSummary } from '../types/server';

const API_BASE_URL = 'http://localhost:3000';

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