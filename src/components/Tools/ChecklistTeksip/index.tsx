// src/components/Tools/ChecklistTeksip/index.tsx
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronDown,
  Undo2,
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/cn";
import daftarNama from "@/lib/data/mahasiswa.json";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- TYPES ---
type Student = (typeof daftarNama)[0];
type GroupedStudents = Record<string, Student[]>;

// --- DATA ---
const STORAGE_KEY = "checkedTeksipStudents";
const ROMBELS = [1, 2, 3, 4];

// --- HOOKS ---
const useStudentChecklist = () => {
  const [checkedItems, setCheckedItems] = useState<Map<number, boolean>>(
    new Map(),
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rombelFilter, setRombelFilter] = useState<number | "all">("all");

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setCheckedItems(new Map(JSON.parse(storedData)));
      }
    } catch (error) {
      console.error("Gagal memuat data dari localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToStore = JSON.stringify(Array.from(checkedItems.entries()));
      localStorage.setItem(STORAGE_KEY, dataToStore);
    } catch (error) {
      console.error("Gagal menyimpan data ke localStorage:", error);
    }
  }, [checkedItems]);

  const handleUndo = useCallback(
    (actionToUndo: {
      id: number;
      name: string;
      type: "checked" | "unchecked";
    }) => {
      setCheckedItems((prev) => {
        const newItems = new Map(prev);
        if (actionToUndo.type === "checked") {
          newItems.delete(actionToUndo.id);
        } else {
          newItems.set(actionToUndo.id, true);
        }
        return newItems;
      });
      toast.success(`Aksi untuk "${actionToUndo.name}" dibatalkan.`);
    },
    [],
  );

  const handleCheck = useCallback(
    (id: number, isChecked: boolean, name: string) => {
      const type = isChecked ? "checked" : "unchecked";

      setCheckedItems((prev) => {
        const newItems = new Map(prev);
        if (isChecked) {
          newItems.set(id, true);
        } else {
          newItems.delete(id);
        }
        return newItems;
      });
      // eslint-disable-next-line react/no-unescaped-entities
      toast.info(
        `"${name}" ditandai ${isChecked ? "sudah" : "belum"} selesai.`,
        {
          action: {
            label: "Undo",
            onClick: () => handleUndo({ id, name, type }),
          },
          icon: <Undo2 className="size-4" />,
          duration: 5000,
        },
      );
    },
    [handleUndo],
  );

  const handleClearAll = useCallback(() => {
    setCheckedItems(new Map());
    toast.success("Daftar 'Sudah Foto' telah dibersihkan.");
  }, []);

  const { checkedStudents, uncheckedStudents } = useMemo(() => {
    const groupStudents = (list: Student[]): GroupedStudents =>
      list.reduce((acc, student) => {
        const key = String(student.Rombel);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(student);
        return acc;
      }, {} as GroupedStudents);

    const filtered = daftarNama.filter(
      (item) =>
        (rombelFilter === "all" || item.Rombel === rombelFilter) &&
        (item.Nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.NPM).includes(searchTerm)),
    );

    const checked: Student[] = [];
    const unchecked: Student[] = [];
    for (const student of filtered) {
      if (checkedItems.has(student.No)) {
        checked.push(student);
      } else {
        unchecked.push(student);
      }
    }
    return {
      checkedStudents: groupStudents(checked),
      uncheckedStudents: groupStudents(unchecked),
    };
  }, [searchTerm, rombelFilter, checkedItems]);

  return {
    searchTerm,
    setSearchTerm,
    rombelFilter,
    setRombelFilter,
    checkedStudents,
    uncheckedStudents,
    handleCheck,
    handleClearAll,
  };
};

// --- COMPONENTS ---

const StudentListItem: React.FC<{
  student: Student;
  isChecked: boolean;
  onCheck: (id: number, isChecked: boolean, name: string) => void;
}> = ({ student, isChecked, onCheck }) => (
  <li
    className={cn(
      "flex items-center gap-3 rounded-md p-3 shadow-sm transition-all duration-200",
      isChecked
        ? "bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50"
        : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-700 dark:hover:bg-neutral-600",
    )}
  >
    <Checkbox
      id={`checkbox-${student.No}`}
      checked={isChecked}
      onCheckedChange={(checked) =>
        onCheck(student.No, checked as boolean, student.Nama)
      }
      className="flex-shrink-0"
    />
    <label
      htmlFor={`checkbox-${student.No}`}
      className={cn(
        "flex-1 cursor-pointer font-medium text-neutral-800 dark:text-neutral-300",
        isChecked && "dark:line-through-neutral-500 line-through",
      )}
    >
      <span className="mr-2 font-bold text-neutral-500 dark:text-neutral-400">
        {student.No}.
      </span>
      {student.Nama}
      <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
        ({student.NPM})
      </span>
    </label>
  </li>
);

const RombelGroup: React.FC<{
  rombel: string;
  students: Student[];
  isChecked: boolean;
  onCheck: (id: number, isChecked: boolean, name: string) => void;
}> = ({ rombel, students, isChecked, onCheck }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!students || students.length === 0) return null;

  return (
    <div className="mt-4 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="font-semibold text-neutral-600 dark:text-neutral-300">
          Rombel {rombel} ({students.length})
        </h3>
        <ChevronDown
          className={cn(
            "transform transition-transform duration-200",
            isCollapsed && "-rotate-180",
          )}
        />
      </button>
      {!isCollapsed && (
        <ul className="animate-in fade-in mt-3 space-y-2 duration-300">
          {students.map((student) => (
            <StudentListItem
              key={student.No}
              student={student}
              isChecked={isChecked}
              onCheck={onCheck}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const CollapsibleStudentList: React.FC<{
  title: string;
  groupedStudents: GroupedStudents;
  checkedState: "checked" | "unchecked";
  onCheck: (id: number, isChecked: boolean, name: string) => void;
  onClearAll?: () => void;
  headerId: string;
}> = ({
  title,
  groupedStudents,
  checkedState,
  onCheck,
  onClearAll,
  headerId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const totalStudents = Object.values(groupedStudents).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  return (
    <div
      id={headerId}
      className="scroll-mt-4 rounded-lg bg-white p-4 shadow-md dark:bg-neutral-800"
    >
      <div className="flex w-full items-center justify-between text-left">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex flex-1 items-center justify-between"
        >
          <h2
            className={cn(
              "text-lg font-semibold",
              checkedState === "checked"
                ? "text-green-700 dark:text-green-300"
                : "text-neutral-700 dark:text-neutral-200",
            )}
          >
            {title} ({totalStudents})
          </h2>
          <ChevronDown
            className={cn(
              "transform transition-transform duration-200",
              isCollapsed && "-rotate-180",
            )}
          />
        </button>
        {onClearAll && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-4 text-red-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                disabled={totalStudents === 0}
              >
                <Trash2 className="mr-1.5 size-4" /> Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Aksi ini akan menghapus semua centang pada daftar "Sudah
                  Foto". Data yang dihapus tidak bisa dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll}>
                  Ya, Hapus Semua
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {!isCollapsed && (
        <div className="animate-in fade-in mt-2 duration-300">
          {totalStudents > 0 ? (
            Object.keys(groupedStudents)
              .sort()
              .map((rombel) => (
                <RombelGroup
                  key={rombel}
                  rombel={rombel}
                  students={groupedStudents[rombel]}
                  isChecked={checkedState === "checked"}
                  onCheck={onCheck}
                />
              ))
          ) : (
            <p className="pt-4 text-center text-neutral-500 italic dark:text-neutral-400">
              {checkedState === "checked" ? "Belum ada." : "Semua sudah foto!"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const ScrollButtons = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowButton(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (!showButton) return null;

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
      <Button
        size="icon"
        onClick={() => scrollTo("unchecked-header")}
        className="rounded-full shadow-lg"
        aria-label="Scroll to Unchecked List"
      >
        <ArrowUpToLine />
      </Button>
      <Button
        size="icon"
        onClick={() => scrollTo("checked-header")}
        className="rounded-full shadow-lg"
        aria-label="Scroll to Checked List"
      >
        <ArrowDownToLine />
      </Button>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ChecklistTeksipPage() {
  const {
    searchTerm,
    setSearchTerm,
    rombelFilter,
    setRombelFilter,
    checkedStudents,
    uncheckedStudents,
    handleCheck,
    handleClearAll,
  } = useStudentChecklist();

  return (
    <>
      <div className="min-h-screen bg-neutral-50 py-6 sm:py-8 lg:py-12 dark:bg-neutral-900">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-center text-2xl font-bold text-neutral-800 sm:text-3xl dark:text-neutral-100">
            Checklist Tugas Foto Mahasiswa Teknik Sipil 2025
          </h1>

          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <Input
              type="text"
              placeholder="Cari nama atau NPM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            />
          </div>
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <Button
              variant={rombelFilter === "all" ? "default" : "outline"}
              onClick={() => setRombelFilter("all")}
            >
              Semua Rombel
            </Button>
            {ROMBELS.map((r) => (
              <Button
                key={r}
                variant={rombelFilter === r ? "default" : "outline"}
                onClick={() => setRombelFilter(r)}
              >
                Rombel {r}
              </Button>
            ))}
          </div>

          <div className="space-y-6">
            <CollapsibleStudentList
              headerId="unchecked-header"
              title="Belum Foto"
              groupedStudents={uncheckedStudents}
              checkedState="unchecked"
              onCheck={handleCheck}
            />
            <CollapsibleStudentList
              headerId="checked-header"
              title="Sudah Foto"
              groupedStudents={checkedStudents}
              checkedState="checked"
              onCheck={handleCheck}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      </div>
      <ScrollButtons />
    </>
  );
}
