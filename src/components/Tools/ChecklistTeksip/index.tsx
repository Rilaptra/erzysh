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
// --- DATA ---
const STORAGE_KEY = "checkedTeksipStudents";

// --- HOOKS ---
const useStudentChecklist = () => {
  const [checkedItems, setCheckedItems] = useState<Map<number, boolean>>(
    new Map(),
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [, setLastAction] = useState<{
    id: number;
    name: string;
    type: "checked" | "unchecked";
  } | null>(null);

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
      setLastAction(null);
    },
    [],
  );

  const handleCheck = useCallback(
    (id: number, isChecked: boolean, name: string) => {
      const type = isChecked ? "checked" : "unchecked";
      setLastAction({ id, name, type });

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
  }, []); // Dependency array kosong karena setCheckedItems stabil

  const filteredStudents = useMemo(
    () =>
      daftarNama.filter(
        (item) =>
          item.Nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.NPM).includes(searchTerm),
      ),
    [searchTerm],
  );

  const { checkedStudents, uncheckedStudents } = useMemo(() => {
    const checked: typeof daftarNama = [];
    const unchecked: typeof daftarNama = [];
    for (const student of filteredStudents) {
      if (checkedItems.has(student.No)) {
        checked.push(student);
      } else {
        unchecked.push(student);
      }
    }
    return { checkedStudents: checked, uncheckedStudents: unchecked };
  }, [filteredStudents, checkedItems]);

  return {
    searchTerm,
    setSearchTerm,
    checkedStudents,
    uncheckedStudents,
    handleCheck,
    handleClearAll,
  };
};

// --- COMPONENTS ---

interface StudentListItemProps {
  student: (typeof daftarNama)[0];
  isChecked: boolean;
  onCheck: (id: number, isChecked: boolean, name: string) => void;
}

const StudentListItem: React.FC<StudentListItemProps> = ({
  student,
  isChecked,
  onCheck,
}) => (
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
        {" "}
        ({student.NPM})
      </span>
    </label>
  </li>
);

interface CollapsibleStudentListProps {
  title: string;
  students: typeof daftarNama;
  checkedState: "checked" | "unchecked";
  onCheck: (id: number, isChecked: boolean, name: string) => void;
  onClearAll?: () => void;
  headerId: string;
}

const CollapsibleStudentList: React.FC<CollapsibleStudentListProps> = ({
  title,
  students,
  checkedState,
  onCheck,
  onClearAll,
  headerId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            {title} ({students.length})
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
              <Button variant="ghost" size="sm" /* ...props lainnya */>
                <Trash2 className="mr-1.5 size-4" />
                Clear All
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
        <div className="animate-in fade-in mt-4 duration-300">
          {students.length > 0 ? (
            <ul className="space-y-3">
              {students.map((student) => (
                <StudentListItem
                  key={student.No}
                  student={student}
                  isChecked={checkedState === "checked"}
                  onCheck={onCheck}
                />
              ))}
            </ul>
          ) : (
            <p className="text-center text-neutral-500 italic dark:text-neutral-400">
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
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };
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

          <div className="mb-4">
            <Input
              type="text"
              placeholder="Cari nama atau NPM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            />
          </div>

          <div className="space-y-6">
            <CollapsibleStudentList
              headerId="unchecked-header"
              title="Belum Foto"
              students={uncheckedStudents}
              checkedState="unchecked"
              onCheck={handleCheck}
            />
            <CollapsibleStudentList
              headerId="checked-header"
              title="Sudah Foto"
              students={checkedStudents}
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
