import {
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  FileArchive,
  FileCode,
  FileJson,
  File,
} from "lucide-react";

export const FileIcon = ({ name }: { name: string }) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
    case "docx":
    case "pdf":
      return (
        <FileText className="h-8 w-8 text-blue-400 transition-transform group-hover:scale-110" />
      );
    case "mp3":
    case "wav":
    case "flac":
      return (
        <Music className="h-8 w-8 text-purple-400 transition-transform group-hover:scale-110" />
      );
    case "mp4":
    case "mkv":
    case "avi":
      return (
        <Video className="h-8 w-8 text-rose-400 transition-transform group-hover:scale-110" />
      );
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return (
        <ImageIcon className="h-8 w-8 text-emerald-400 transition-transform group-hover:scale-110" />
      );
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return (
        <FileArchive className="h-8 w-8 text-amber-400 transition-transform group-hover:scale-110" />
      );
    case "js":
    case "ts":
    case "py":
    case "rs":
    case "cpp":
    case "cs":
    case "html":
    case "css":
      return (
        <FileCode className="h-8 w-8 text-orange-400 transition-transform group-hover:scale-110" />
      );
    case "json":
      return (
        <FileJson className="h-8 w-8 text-yellow-400 transition-transform group-hover:scale-110" />
      );
    default:
      return (
        <File className="h-8 w-8 text-blue-500 transition-transform group-hover:scale-110" />
      );
  }
};
