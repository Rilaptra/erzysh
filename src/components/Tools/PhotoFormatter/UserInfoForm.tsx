// src/components/Tools/PhotoFormatter/UserInfoForm.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserInfo } from "@/types";

interface UserInfoFormProps {
  userInfo: UserInfo;
  onUserInfoChange: (field: keyof UserInfo, value: string) => void;
}

interface NumberingOptionsProps {
  startNumber: number;
  onStartNumberChange: (value: number) => void;
}

export const UserInfoForm = ({
  userInfo,
  onUserInfoChange,
  startNumber,
  onStartNumberChange,
}: UserInfoFormProps & NumberingOptionsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
      <Input
        type="text"
        placeholder="Nama Lengkap"
        value={userInfo.nama}
        onChange={(e) => onUserInfoChange("nama", e.target.value)}
        className="dark:text-off-white sm:col-span-2 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400"
      />
      <Input
        type="text"
        placeholder="NPM"
        value={userInfo.npm}
        onChange={(e) => onUserInfoChange("npm", e.target.value)}
        className="dark:text-off-white dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400"
      />
      <Input
        type="text"
        placeholder="Nomor Kelas"
        value={userInfo.nomor_kelas}
        onChange={(e) => onUserInfoChange("nomor_kelas", e.target.value)}
        className="dark:text-off-white dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400"
      />
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="start-number" className="dark:text-gray-200">
        Nomor Awal
      </Label>
      <Input
        id="start-number"
        type="number"
        min="1"
        value={startNumber}
        onChange={(e) => onStartNumberChange(parseInt(e.target.value, 10) || 1)}
        className="dark:text-off-white dark:border-gray-600 dark:bg-gray-800"
      />
    </div>
  </div>
);
