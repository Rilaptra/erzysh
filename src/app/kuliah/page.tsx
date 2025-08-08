// src/app/kuliah/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function KuliahPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Kuliah</h1>
      <div className="space-x-4">
        <Link href="#">
          <Button disabled>Profile (Coming Soon)</Button>
        </Link>
        <Link href="/kuliah/jadwal">
          <Button>Jadwal</Button>
        </Link>
      </div>
    </div>
  );
}
