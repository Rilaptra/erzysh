import {
	ArrowUp,
	RefreshCw,
	Terminal,
	Upload,
	HardDrive,
	Folder,
	Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";
import type { Disk, FileEntry } from "../types";
import { joinPath } from "../utils";
import { FileIcon } from "./FileIcon";

interface FileExplorerProps {
	currentPath: string;
	files: FileEntry[];
	disks: Disk[];
	isLoadingFiles: boolean;
	fileSearch: string;
	setFileSearch: (val: string) => void;
	fetchDirectory: (path: string, force?: boolean) => void;
	handleUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleDownloadFile: (fileName: string) => void;
	isUploading: boolean;
}

export const FileExplorer = ({
	currentPath,
	files,
	disks,
	isLoadingFiles,
	fileSearch,
	setFileSearch,
	fetchDirectory,
	handleUploadFile,
	handleDownloadFile,
	isUploading,
}: FileExplorerProps) => {
	const filteredFiles = files.filter((f) =>
		f.name.toLowerCase().includes(fileSearch.toLowerCase()),
	);

	return (
		<div className="relative z-10 flex flex-1 flex-col overflow-hidden p-6 lg:p-10">
			{/* Navigation & Controls */}
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
				<div className="flex flex-1 items-center gap-1.5 overflow-hidden rounded-xl border border-white/5 bg-neutral-900/30 p-1.5 backdrop-blur-md">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => fetchDirectory("THIS_PC")}
						className="h-8 w-8 text-neutral-500 hover:text-white"
					>
						<Home className="h-4 w-4" />
					</Button>
					<div className="mx-1 h-4 w-px bg-white/5" />
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							const parts = currentPath.split("\\").filter((p) => p !== "");
							if (parts.length <= 1) {
								fetchDirectory("THIS_PC");
								return;
							}
							parts.pop();
							const newPath = `${parts.join("\\")}\\`;
							fetchDirectory(newPath);
						}}
						className="h-8 w-8 text-neutral-500 hover:text-white"
						disabled={currentPath === "THIS_PC"}
					>
						<ArrowUp className="h-4 w-4" />
					</Button>

					{/* Breadcrumbs Path Display */}
					<div className="scrollbar-none no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto px-2">
						{currentPath === "THIS_PC" ? (
							<span className="text-[11px] font-black tracking-widest whitespace-nowrap text-teal-500 uppercase">
								ROOT_FS://THIS_PC
							</span>
						) : (
							<div className="flex items-center gap-1 whitespace-nowrap">
								{currentPath
									.split("\\")
									.filter((p) => p)
									.map((part, idx, arr) => (
										<div key={idx} className="flex items-center gap-1">
											<span
												className={cn(
													"cursor-pointer font-mono text-[10px] transition-colors",
													idx === arr.length - 1
														? "font-bold text-white"
														: "text-neutral-500 hover:text-neutral-300",
												)}
												onClick={() => {
													const p = `${arr.slice(0, idx + 1).join("\\")}\\`;
													fetchDirectory(p);
												}}
											>
												{part}
											</span>
											{idx < arr.length - 1 && (
												<span className="font-mono text-[10px] text-neutral-700">
													/
												</span>
											)}
										</div>
									))}
							</div>
						)}
					</div>

					<div className="mx-1 h-4 w-px bg-white/5" />
					<Button
						size="icon"
						variant="ghost"
						onClick={() => fetchDirectory(currentPath, true)}
						className="h-8 w-8 text-neutral-500 hover:text-teal-400"
					>
						<RefreshCw
							className={cn("h-3.5 w-3.5", isLoadingFiles && "animate-spin")}
						/>
					</Button>
				</div>

				{/* File Search & Toggle */}
				<div className="flex items-center gap-2">
					<div className="group relative min-w-[200px]">
						<Terminal className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 text-neutral-600 group-focus-within:text-teal-500" />
						<input
							type="text"
							placeholder="Filter protocol..."
							className="h-9 w-full rounded-xl border border-white/5 bg-neutral-900/30 pr-4 pl-9 font-mono text-xs text-neutral-400 outline-hidden transition-all focus:border-teal-500/50"
							value={fileSearch}
							onChange={(e) => setFileSearch(e.target.value)}
						/>
					</div>

					{currentPath !== "THIS_PC" && (
						<>
							<input
								type="file"
								id="file-upload"
								className="hidden"
								onChange={handleUploadFile}
							/>
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-teal-500/20 bg-teal-500/5 text-[10px] font-black tracking-widest text-teal-400 uppercase hover:bg-teal-500/20"
								onClick={() => document.getElementById("file-upload")?.click()}
								disabled={isUploading}
							>
								<Upload
									className={cn(
										"mr-2 h-3.5 w-3.5",
										isUploading && "animate-bounce",
									)}
								/>
								{isUploading ? "Uploading..." : "Inject File"}
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Files Display Container */}
			<div className="flex-1 overflow-hidden rounded-2xl border border-white/4 bg-neutral-950/40 p-2 shadow-2xl backdrop-blur-xs">
				<ScrollArea className="h-full">
					<div className="p-4">
						{isLoadingFiles &&
						(currentPath === "THIS_PC"
							? disks.length === 0
							: files.length === 0) ? (
							<div className="flex h-64 flex-col items-center justify-center text-neutral-600">
								<div className="relative mb-6">
									<RefreshCw className="h-10 w-10 animate-spin text-teal-500/50" />
									<div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full bg-teal-500/10 blur-xl" />
								</div>
								<p className="font-mono text-[11px] tracking-[0.2em] uppercase transition-all">
									Synchronizing Data Streams...
								</p>
							</div>
						) : (
							<div className="relative">
								{isLoadingFiles && (
									<div className="absolute -top-2 right-0 z-50 flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 backdrop-blur-md">
										<RefreshCw className="h-3 w-3 animate-spin text-teal-500" />
										<span className="font-mono text-[9px] font-black tracking-widest text-teal-500 uppercase">
											Refreshing
										</span>
									</div>
								)}
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
									{currentPath === "THIS_PC" ? (
										(disks || []).map((disk, i) => (
											<div
												key={i}
												className="group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-xl border border-white/3 bg-neutral-900/30 px-3 py-6 text-center transition-all duration-300 hover:border-teal-500/20 hover:bg-teal-500/2 hover:shadow-[0_0_20px_rgba(20,184,166,0.05)] active:scale-95"
												onClick={() => fetchDirectory(disk.mount_point)}
											>
												<div className="relative">
													<HardDrive className="h-10 w-10 text-teal-400/80 transition-transform duration-500 group-hover:scale-110 group-hover:text-teal-400" />
													<div className="absolute inset-0 bg-teal-500/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
												</div>
												<div className="space-y-1">
													<span className="block w-full truncate text-[11px] font-black tracking-tight text-white uppercase">
														{disk.name ||
															`DRIVE_${disk.mount_point.replace(":", "")}`}
													</span>
													<div className="mx-auto mt-1 h-1 w-full max-w-[40px] overflow-hidden rounded-full bg-neutral-800">
														<div className="h-full w-[60%] bg-teal-500 opacity-50" />
													</div>
													<span className="block font-mono text-[9px] tracking-tighter text-neutral-500 uppercase">
														{disk.available_space} / {disk.total_space}
													</span>
												</div>
											</div>
										))
									) : (
										<>
											{filteredFiles.map((file, i) => (
												<div
													key={i}
													className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-transparent px-2 py-5 text-center transition-all duration-300 hover:border-white/5 hover:bg-white/2 active:scale-95"
													onClick={() => {
														if (file.kind === "dir")
															fetchDirectory(joinPath(currentPath, file.name));
														else handleDownloadFile(file.name);
													}}
												>
													<div className="relative">
														{file.kind === "dir" ? (
															<Folder className="h-10 w-10 text-amber-400/80 transition-transform duration-300 group-hover:scale-110 group-hover:text-amber-400" />
														) : (
															<FileIcon name={file.name} />
														)}
														<div
															className={cn(
																"absolute inset-0 opacity-0 blur-xl transition-opacity group-hover:opacity-30",
																file.kind === "dir"
																	? "bg-amber-500"
																	: "bg-blue-500",
															)}
														/>
													</div>
													<div className="w-full space-y-1">
														<span className="block w-full truncate text-[11px] font-medium text-neutral-300 transition-colors group-hover:text-white">
															{file.name}
														</span>
														{file.kind === "file" && (
															<span className="block font-mono text-[9px] tracking-tighter text-neutral-600 uppercase">
																{file.size}
															</span>
														)}
													</div>
												</div>
											))}
											{filteredFiles.length === 0 && (
												<div className="col-span-full py-20 text-center">
													<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-neutral-900">
														<Terminal className="h-5 w-5 text-neutral-700" />
													</div>
													<p className="font-mono text-[10px] tracking-[0.3em] text-neutral-600 uppercase">
														No valid signatures found
													</p>
												</div>
											)}
										</>
									)}
								</div>
							</div>
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
};
