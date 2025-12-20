export interface DeviceStatus {
  id: string;
  name: string;
  ram_usage: number;
  ram_total: number;
  cpu_usage: number;
  cpu_brand: string;
  platform: string;
  os_type: string;
  user: string;
  version: string;
  last_seen: number;
  is_online: boolean;
}

export type FileEntry = {
  name: string;
  kind: "file" | "dir";
  size: string;
};

export interface DeviceCache {
  lastPath: string;
  disks: any[];
  folders: Record<string, FileEntry[]>;
}

export type DeviceCaches = Record<string, DeviceCache>;
