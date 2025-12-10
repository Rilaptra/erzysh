// src/components/Tugas/TugasCard.tsx
"use client";

import { Tugas } from "@/types/tugas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/cn";

interface TugasCardProps {
  tugas: Tugas;
  onEdit: (tugas: Tugas) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, currentState: boolean) => void;
}

export const TugasCard = ({
  tugas,
  onEdit,
  onDelete,
  onToggleComplete,
}: TugasCardProps) => {
  const deadlineDate = parseISO(tugas.deadline);
  const daysLeft = differenceInDays(deadlineDate, new Date());
  const isPastDeadline = new Date() > deadlineDate;

  // Tentukan status urgensi
  let statusColor = "bg-blue-500";
  let borderColor = "border-blue-500/20";
  let statusText = "Aman";

  if (tugas.isCompleted) {
    statusColor = "bg-green-500";
    borderColor = "border-green-500/20";
    statusText = "Selesai";
  } else if (isPastDeadline) {
    statusColor = "bg-red-600";
    borderColor = "border-red-600/50";
    statusText = "Telat";
  } else if (daysLeft < 2) {
    statusColor = "bg-orange-500";
    borderColor = "border-orange-500/50";
    statusText = "Urgent";
  }

  const handleAddToCalendar = () => {
    // ... (Logika kalender sama seperti sebelumnya)
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(tugas.judul)}&details=${encodeURIComponent(tugas.deskripsi)}&dates=${tugas.deadline.replace(/[-:]/g, "").split(".")[0]}Z/${tugas.deadline.replace(/[-:]/g, "").split(".")[0]}Z`;
    window.open(googleUrl, "_blank");
  };

  return (
    <div
      className={cn(
        "group bg-card relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        borderColor,
        tugas.isCompleted &&
          "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0",
      )}
    >
      {/* Indikator Garis Warna di Kiri */}
      <div
        className={cn(
          "absolute top-4 bottom-4 left-0 w-1 rounded-r-full",
          statusColor,
        )}
      />

      <div className="pl-3">
        {/* HEADER: Kategori & Actions */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] font-medium opacity-80"
            >
              {tugas.kategori}
            </Badge>
            {!tugas.isCompleted && daysLeft < 2 && !isPastDeadline && (
              <Badge
                variant="outline"
                className="flex gap-1 border-orange-500 text-[10px] text-orange-500"
              >
                <AlertTriangle className="h-3 w-3" />{" "}
                {daysLeft === 0 ? "Hari ini!" : "Besok!"}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground -mr-2 h-6 w-6"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddToCalendar}>
                <Calendar className="mr-2 h-4 w-4" /> Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(tugas)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(tugas.id)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* CONTENT: Judul & Deskripsi */}
        <div className="mb-4">
          <h3
            className={cn(
              "text-lg leading-tight font-bold transition-colors",
              tugas.isCompleted
                ? "text-muted-foreground line-through decoration-2"
                : "text-foreground group-hover:text-primary",
            )}
          >
            {tugas.judul}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {tugas.mataKuliah}
          </p>
          {tugas.deskripsi && (
            <p className="text-muted-foreground/70 mt-2 line-clamp-2 text-xs">
              {tugas.deskripsi}
            </p>
          )}
        </div>
      </div>

      {/* FOOTER: Deadline & Check Button */}
      <div className="mt-auto flex items-center justify-between border-t border-dashed pt-4 pl-3">
        <div className="flex flex-col gap-0.5 text-xs">
          <div
            className={cn(
              "flex items-center gap-1.5 font-medium",
              isPastDeadline && !tugas.isCompleted
                ? "text-red-500"
                : "text-muted-foreground",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {formatDistanceToNow(deadlineDate, { addSuffix: true, locale: id })}
          </div>
          <div className="text-muted-foreground/60 text-[10px]">
            {new Date(tugas.deadline).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <Button
          size="sm"
          variant={tugas.isCompleted ? "secondary" : "default"}
          onClick={() => onToggleComplete(tugas.id, tugas.isCompleted)}
          className={cn(
            "h-8 rounded-full px-4 text-xs font-semibold shadow-sm transition-all",
            tugas.isCompleted
              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
              : "bg-primary hover:bg-primary/90",
          )}
        >
          {tugas.isCompleted ? (
            <>
              Selesai <CheckCircle2 className="ml-1.5 h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Tandai Selesai <Circle className="ml-1.5 h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
