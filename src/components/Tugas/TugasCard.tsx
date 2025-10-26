// src/components/Tugas/TugasCard.tsx
"use client";

import { Tugas } from "@/types/tugas";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Edit,
  Trash2,
  Calendar,
  BookOpen,
  CheckCircle2,
  Circle,
  CalendarPlus,
} from "lucide-react";
import { formatDistanceToNow, parseISO, formatISO } from "date-fns";
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
  const isPastDeadline = new Date() > deadlineDate;

  const getTimeRemaining = () => {
    if (tugas.isCompleted) return "Selesai 🎉";
    if (isPastDeadline) return "Deadline terlewat";
    return formatDistanceToNow(deadlineDate, { addSuffix: true, locale: id });
  };

  const getCategoryVariant = (): "default" | "secondary" | "destructive" => {
    switch (tugas.kategori) {
      case "Tugas Prodi":
        return "destructive";
      case "Kuliah":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleToggleClick = () => {
    onToggleComplete(tugas.id, tugas.isCompleted);
  };

  const handleAddToCalendar = () => {
    // Google Calendar event URL format (all-day event)
    const startTime = formatISO(deadlineDate, {
      representation: "date",
    }).replace(/-/g, "");
    const endTime = formatISO(
      new Date(deadlineDate).setDate(deadlineDate.getDate() + 1),
      { representation: "date" },
    ).replace(/-/g, "");

    const calendarUrl = new URL("https://www.google.com/calendar/render");
    calendarUrl.searchParams.append("action", "TEMPLATE");
    calendarUrl.searchParams.append("text", `Deadline: ${tugas.judul}`);
    calendarUrl.searchParams.append("dates", `${startTime}/${endTime}`);
    calendarUrl.searchParams.append(
      "details",
      `Tugas untuk mata kuliah ${tugas.mataKuliah}.\n\nDeskripsi:\n${tugas.deskripsi}`,
    );

    window.open(calendarUrl.toString(), "_blank");
  };

  return (
    <Card
      className={cn(
        "flex flex-col transition-all duration-300",
        tugas.isCompleted ? "bg-muted/50 border-border" : "bg-card",
      )}
    >
      <CardHeader>
        <div className="flex items-start w-full relative justify-between gap-4">
          <div className="flex-1">
            <Badge variant={getCategoryVariant()}>{tugas.kategori}</Badge>
            <CardTitle
              className={cn(
                "mt-2 min-h-[32px] max-w-full",
                tugas.isCompleted && "text-muted-foreground line-through",
              )}
            >
              {tugas.judul}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 text-sm">
              <BookOpen className="text-teal-muted size-4" /> {tugas.mataKuliah}
            </CardDescription>
          </div>
          <div className="flex flex-shrink-0 absolute right-0 items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleAddToCalendar}
            >
              <CalendarPlus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(tugas)}
              disabled={tugas.isCompleted}
            >
              <Edit className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive size-8"
              onClick={() => onDelete(tugas.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground bg-muted/55 max-h-[250px] overflow-y-auto p-2 rounded-lg text-sm whitespace-pre-wrap">
          {tugas.deskripsi}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap w-full gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            isPastDeadline && !tugas.isCompleted
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          <Calendar className="text-teal-muted size-4" />
          {/* --- PERUBAHAN DI SINI --- */}
          <span>
            {new Date(tugas.deadline).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="text-teal-muted size-4" />
            <span className="font-medium">{getTimeRemaining()}</span>
          </div>
          {/* --- AKHIR PERUBAHAN --- */}
        </div>
        <div className="flex items-center gap-3 w-full">
          <Button
            variant={tugas.isCompleted ? "outline" : "default"}
            size="sm"
            onClick={handleToggleClick}
            className={cn("w-full",
              tugas.isCompleted ? "border-green-500/50 text-green-500" : "",
            )}
          >
            <span className="flex justify-center w-full">
            {tugas.isCompleted ? (
              <Circle className="mr-2 size-4" />
            ) : (
              <CheckCircle2 className="mr-2 size-4" />
            )}
            {tugas.isCompleted ? "Belum Selesai" : "Selesaikan"}
            </span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
