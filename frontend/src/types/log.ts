
export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export type LogChannel = 'Application' | 'System';

export interface WindowsLog {
  id: number;
  agentId: string;
  recordId: number;
  timestamp: string;
  level: LogLevel;
  source: string;
  eventId: number;
  channel: LogChannel;
  message: string;
  createdAt: string;
}
