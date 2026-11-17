
export interface NetworkInterface {
  interface: string;
  bytes_recv: number;
  bytes_sent: number;
  packets_recv: number;
  packets_sent: number;
  ip_address: string | null;
  mac_address: string | null;
}
