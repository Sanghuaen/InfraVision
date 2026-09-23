export interface ServerSummary {
  serverId: number;
  agentId: string;
  name: string;
  hostname: string;
  platform: string | null;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  processCount: number;
  dockerContainerCount: number;
  collectedAt: string;
}
