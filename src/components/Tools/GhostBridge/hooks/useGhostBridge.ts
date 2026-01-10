/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation: biome-ignore> */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDevMode } from "@/lib/hooks/useDevMode";
import { zyLog } from "@/lib/zylog";
import type { DeviceCaches, DeviceStatus, Disk, FileEntry } from "../types";
import { joinPath, normalizePath, urlBase64ToUint8Array } from "../utils";

export function useGhostBridge() {
	const { isDevMode, unlockDevMode } = useDevMode();
	const [devices, setDevices] = useState<DeviceStatus[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<DeviceStatus | null>(
		null,
	);
	const [currentPath, setCurrentPath] = useState("THIS_PC");
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [disks, setDisks] = useState<Disk[]>([]);
	const [isLoadingFiles, setIsLoadingFiles] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");
	const [screenshot, setScreenshot] = useState<string | null>(null);
	const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
	const [deviceSearch, setDeviceSearch] = useState("");
	const [fileSearch, setFileSearch] = useState("");
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedInfoDevice, setSelectedInfoDevice] =
		useState<DeviceStatus | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
	const [isSubscribing, setIsSubscribing] = useState(false);

	const latestRequestedPath = useRef<string>("THIS_PC");
	const knownOnlineDevicesRef = useRef<Set<string>>(new Set());
	const isFirstLoadRef = useRef(true);

	const [deviceCaches, setDeviceCaches] = useState<DeviceCaches>(() => {
		if (typeof window !== "undefined") {
			try {
				const saved = localStorage.getItem("ghost_bridge_cache_v2");
				return saved ? JSON.parse(saved) : {};
			} catch (_e) {
				return {};
			}
		}
		return {};
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		isMounted &&
			localStorage.setItem(
				"ghost_bridge_cache_v2",
				JSON.stringify(deviceCaches),
			);
	}, [deviceCaches, isMounted]);

	useEffect(() => {
		if ("serviceWorker" in navigator && "PushManager" in window) {
			navigator.serviceWorker.ready.then((reg) => {
				reg.pushManager.getSubscription().then((sub) => {
					if (sub) setIsNotificationEnabled(true);
				});
			});
		}
	}, []);

	// --- 1. DEVICE POLLING ---
	useEffect(() => {
		if (!isDevMode) return;

		const fetchDevices = async () => {
			try {
				const res = await fetch("/api/ghost?action=list_devices");
				if (res.ok) {
					const data: DeviceStatus[] = await res.json();
					setDevices(data);

					// Check for new online devices
					const currentOnline = new Set(
						data.filter((d) => d.is_online).map((d) => d.id),
					);

					if (!isFirstLoadRef.current) {
						for (const device of data) {
							if (
								device.is_online &&
								!knownOnlineDevicesRef.current.has(device.id)
							) {
								// 1. Toast Notification
								// 1. Toast Notification
								toast.success(`👻 Node Detected: ${device.name}`, {
									description: "Device is now online and ready for uplink.",
									duration: 4000,
								});

								// 2. Trigger Push Notification (Local) if enabled and tab is background/foreground
								if (isNotificationEnabled && "serviceWorker" in navigator) {
									navigator.serviceWorker.ready.then((reg) => {
										reg.showNotification(`👻 Node Online: ${device.name}`, {
											body: "Device is now online and ready for uplink.",
											icon: "/icons/ghost-icon-192.png",
											badge: "/icons/ghost-badge.png",
											data: { url: window.location.href },
										});
									});
								}
							}
						}
					}

					knownOnlineDevicesRef.current = currentOnline;
					isFirstLoadRef.current = false;
				}
			} catch (e) {
				console.error(e);
			}
		};

		fetchDevices();
		const interval = setInterval(fetchDevices, 5000);
		return () => clearInterval(interval);
	}, [isDevMode, isNotificationEnabled]);

	// --- 2. COMMAND HANDLER (WITH POLLING) ---
	const sendCommand = async (cmd: string, args: string | null = null) => {
		if (!selectedDevice) return null;

		const startTime = Date.now();

		try {
			await fetch("/api/ghost", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "queue_command",
					deviceId: selectedDevice.id,
					command: cmd,
					args: args,
				}),
			});

			for (let i = 0; i < 20; i++) {
				await new Promise((r) => setTimeout(r, 1000));

				const res = await fetch(
					`/api/ghost?action=get_result&deviceId=${selectedDevice.id}`,
				);
				if (res.ok) {
					const result = await res.json();
					if (result && result.timestamp > startTime) {
						return result;
					}
				}
			}
			throw new Error("Agent connection timeout");
		} catch (error) {
			toast.error((error as Error).message || "Failed to execute command");
			return null;
		}
	};

	const fetchDisks = useCallback(async () => {
		if (!selectedDevice) return;
		latestRequestedPath.current = "THIS_PC";

		const cache = deviceCaches[selectedDevice.id];
		if (cache?.disks?.length > 0) {
			setDisks(cache.disks);
			setCurrentPath("THIS_PC");
		} else {
			setDisks([]);
		}

		setIsLoadingFiles(true);
		const toastId = toast.loading("Syncing disks...");

		try {
			const result = await sendCommand("LIST_DISKS");
			if (result && result.status === "DONE") {
				setDisks(result.data.disks);
				setCurrentPath("THIS_PC");

				setDeviceCaches((prev) => ({
					...prev,
					[selectedDevice.id]: {
						...(prev[selectedDevice.id] || {
							folders: {},
							lastPath: "THIS_PC",
						}),
						disks: result.data.disks,
						lastPath: "THIS_PC",
					},
				}));

				toast.success("Disks sync complete", { id: toastId });
			} else {
				toast.error("Failed to sync disks", { id: toastId });
			}
		} catch (_e) {
			toast.error("An error occurred", { id: toastId });
		} finally {
			setIsLoadingFiles(false);
		}
	}, [selectedDevice, deviceCaches]);

	const fetchDirectory = useCallback(
		async (path: string, force: boolean = false) => {
			if (!selectedDevice) return;
			latestRequestedPath.current = path;

			if (path === "THIS_PC") {
				fetchDisks();
				return;
			}

			const devCache = deviceCaches[selectedDevice.id];
			const normPath = normalizePath(path);
			const cachedFiles = devCache?.folders?.[normPath];

			if (cachedFiles) {
				setFiles(cachedFiles);
				setCurrentPath(path);
			} else {
				setFiles([]);
			}

			setIsLoadingFiles(true);
			const toastId = toast.loading(
				force ? `Force Refreshing: ${path}` : `Scanning: ${path}`,
			);

			try {
				const args = force ? { path, force: true } : path;
				const result = await sendCommand(
					"LS",
					typeof args === "string" ? args : JSON.stringify(args),
				);

				if (result && result.status === "DONE") {
					const newFiles = result.data.files;
					const newPath = result.data.current_path;

					if (latestRequestedPath.current !== path) return;

					setFiles(newFiles);
					setCurrentPath(newPath);

					const normNewPath = normalizePath(newPath);
					setDeviceCaches((prev) => {
						const currentDev = prev[selectedDevice.id] || {
							disks: [],
							folders: {},
							lastPath: "THIS_PC",
						};
						return {
							...prev,
							[selectedDevice.id]: {
								...currentDev,
								lastPath: newPath,
								folders: {
									...currentDev.folders,
									[normNewPath]: newFiles,
								},
							},
						};
					});

					toast.success(force ? "Sector refreshed" : "Sector synced", {
						id: toastId,
					});
				} else if (result && result.status === "ERROR") {
					toast.error(result.data.message, { id: toastId });
				} else {
					toast.error("Handshake failed. Protocol error.", { id: toastId });
				}
			} catch (_e) {
				toast.error("An error occurred during scan", { id: toastId });
			} finally {
				setIsLoadingFiles(false);
			}
		},
		[selectedDevice, fetchDisks, deviceCaches, sendCommand],
	);

	useEffect(() => {
		if (selectedDevice && isMounted) {
			const cache = deviceCaches[selectedDevice.id];
			if (cache) {
				const lastPath = cache.lastPath || "THIS_PC";
				const cachedDisks = Array.isArray(cache.disks) ? cache.disks : [];
				const cachedFiles =
					cache.folders && Array.isArray(cache.folders[lastPath])
						? cache.folders[lastPath]
						: [];

				setCurrentPath(lastPath);
				setDisks(cachedDisks);
				setFiles(cachedFiles);

				if (lastPath === "THIS_PC") {
					fetchDisks();
				} else {
					fetchDirectory(lastPath);
				}
			} else {
				setDisks([]);
				setFiles([]);
				fetchDisks();
			}
		}
	}, [
		selectedDevice?.id,
		isMounted,
		fetchDisks,
		deviceCaches[selectedDevice?.id || ""],
		selectedDevice,
		fetchDirectory,
	]);

	const handleScreenshot = async () => {
		if (!selectedDevice) return;
		const toastId = toast.loading("Capturing remote screen...");

		try {
			const result = await sendCommand("SCREENSHOT");
			if (result && result.status === "DONE") {
				setScreenshot(result.data.image || result.data.url);
				setIsScreenshotOpen(true);
				toast.success("Screenshot captured", { id: toastId });
			} else {
				toast.error(result?.data?.message || "Capture failed", { id: toastId });
			}
		} catch (_e) {
			toast.error("Capture failed", { id: toastId });
		}
	};

	const handleDownloadFile = async (fileName: string) => {
		if (!selectedDevice || !currentPath) return;
		const fullPath = joinPath(currentPath, fileName);
		const toastId = toast.loading(`Preparing file: ${fileName}...`);

		try {
			const result = await sendCommand("GET_FILE", fullPath);
			if (result && result.status === "DONE") {
				const downloadUrl = result.data.url;
				if (downloadUrl) {
					const win = window.open(downloadUrl, "_blank");
					if (!win) {
						toast.error("Popup blocked! Please allow popups.", { id: toastId });
					} else {
						toast.success("Download started", { id: toastId });
					}
				}
			} else {
				toast.error(result?.data?.message || "Download failed", {
					id: toastId,
				});
			}
		} catch (_e) {
			toast.error("Download failed", { id: toastId });
		}
	};

	const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !selectedDevice || !currentPath) return;

		const toastId = toast.loading(`Uploading ${file.name} to remote node...`);
		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const uploadResp = await fetch("/api/ghost/upload", {
				method: "POST",
				body: formData,
			});

			if (!uploadResp.ok)
				throw new Error(`Transfer failed: ${uploadResp.statusText}`);

			const uploadJson = await uploadResp.json();
			if (!uploadJson.success)
				throw new Error(uploadJson.message || "Upload failed");

			const fileUrl = uploadJson.link;
			const destPath = joinPath(currentPath, file.name);
			zyLog.debug("File URL", fileUrl);
			zyLog.debug("Destination path", destPath);

			const result = await sendCommand(
				"PUT_FILE",
				JSON.stringify({
					url: fileUrl,
					dest: destPath,
				}),
			);

			if (result && result.status === "DONE") {
				toast.success(`${file.name} deployed successfully`, { id: toastId });
				fetchDirectory(currentPath);
			} else {
				toast.error(result?.data?.message || "Remote deployment failed", {
					id: toastId,
				});
			}
		} catch (err) {
			toast.error(`Upload error: ${(err as Error).message}`, { id: toastId });
		} finally {
			setIsUploading(false);
			e.target.value = "";
		}
	};

	const handleDeleteDevice = async (e: React.MouseEvent, deviceId: string) => {
		e.stopPropagation();
		if (!confirm("Are you sure you want to remove this device registry?"))
			return;

		try {
			const res = await fetch("/api/ghost", {
				method: "POST",
				body: JSON.stringify({ action: "delete_device", deviceId }),
			});
			if (res.ok) {
				toast.success("Device removed");
				setDevices((prev) => prev.filter((d) => d.id !== deviceId));
				if (selectedDevice?.id === deviceId) setSelectedDevice(null);
			}
		} catch (_e) {
			toast.error("Failed to delete");
		}
	};

	const handleRenameDevice = async (e: React.MouseEvent, deviceId: string) => {
		e.stopPropagation();
		const newName = prompt("Enter new device name:");
		if (!newName) return;

		try {
			const res = await fetch("/api/ghost", {
				method: "POST",
				body: JSON.stringify({ action: "update_device", deviceId, newName }),
			});
			if (res.ok) {
				toast.success("Device renamed");
				setDevices((prev) =>
					prev.map((d) => (d.id === deviceId ? { ...d, name: newName } : d)),
				);
			}
		} catch (_e) {
			toast.error("Failed to rename");
		}
	};

	const handleSubscribe = async () => {
		if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
			return toast.error("VAPID Key missing");
		setIsSubscribing(true);
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(
					process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
				),
			});
			await fetch("/api/notifications/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(sub),
			});

			setIsNotificationEnabled(true);
			toast.success("Ghost Notifications Enabled!");
		} catch (e) {
			console.error(e);
			toast.error("Failed to enable notifications.");
		} finally {
			setIsSubscribing(false);
		}
	};

	const handleUnsubscribe = async () => {
		setIsSubscribing(true);
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) {
				await sub.unsubscribe();
				setIsNotificationEnabled(false);
				toast.info("Ghost Notifications Disabled.");
			}
		} catch (e) {
			console.error(e);
		} finally {
			setIsSubscribing(false);
		}
	};

	return {
		isDevMode,
		unlockDevMode,
		devices,
		selectedDevice,
		setSelectedDevice,
		currentPath,
		files,
		disks,
		isLoadingFiles,
		passwordInput,
		setPasswordInput,
		screenshot,
		isScreenshotOpen,
		setIsScreenshotOpen,
		deviceSearch,
		setDeviceSearch,
		fileSearch,
		setFileSearch,
		isInfoOpen,
		setIsInfoOpen,
		isUploading,
		selectedInfoDevice,
		setSelectedInfoDevice,
		isSidebarOpen,
		setIsSidebarOpen,
		isMounted,
		fetchDirectory,
		fetchDisks,
		handleScreenshot,
		handleDownloadFile,
		handleUploadFile,
		handleDeleteDevice,
		handleRenameDevice,
		sendCommand,
		isNotificationEnabled,
		isSubscribing,
		handleSubscribe,
		handleUnsubscribe,
	};
}
