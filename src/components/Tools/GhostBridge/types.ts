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

export interface Disk {
	name: string;
	mount_point: string;
	total_space: string;
	available_space: string;
}

export interface FileEntry {
	name: string;
	kind: "file" | "dir";
	size: string;
}

export interface DeviceCache {
	lastPath: string;
	disks: Disk[];
	folders: Record<string, FileEntry[]>;
}

export interface DeviceCaches extends Record<string, DeviceCache> {}
