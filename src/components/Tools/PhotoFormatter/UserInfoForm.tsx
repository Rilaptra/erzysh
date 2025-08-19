// src/components/Tools/PhotoFormatter/UserInfoForm.tsx
import { Input } from "@/components/ui/input";
import type { UserInfo } from "@/types";

interface UserInfoFormProps {
  userInfo: UserInfo;
  onUserInfoChange: (field: keyof UserInfo, value: string) => void;
}

export const UserInfoForm = ({
  userInfo,
  onUserInfoChange,
}: UserInfoFormProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <Input
      type="text"
      placeholder="Nama Lengkap"
      value={userInfo.nama}
      onChange={(e) => onUserInfoChange("nama", e.target.value)}
      className="dark:text-off-white dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400"
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
);
