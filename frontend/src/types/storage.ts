
export interface StoragePartition {
  device: string;
  mountpoint: string;
  filesystem: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  usage: number;
  partitions: StoragePartition[];
}
