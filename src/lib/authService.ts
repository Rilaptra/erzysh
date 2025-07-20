// src/lib/authService.ts
import { NextRequest } from "next/server";
import { verifyAuth } from "./authUtils";
import { getUsersData } from "@/app/api/database/helpers";
import type { UserData } from "@/types";
import chalk from "chalk";

/**
 * Memvalidasi request dan mengembalikan data pengguna yang terautentikasi.
 * Melempar error jika autentikasi gagal, yang bisa ditangkap oleh route handler.
 * @param req - NextRequest
 * @returns {Promise<UserData>} - Data pengguna yang valid.
 */
export async function validateAndGetUser(req: NextRequest): Promise<UserData> {
  // 1. Verifikasi token JWT dari cookie
  const userPayload = verifyAuth(req);
  if (!userPayload) {
    console.error(chalk.red("Auth Error: Invalid or missing token."));
    throw new Error("UNAUTHORIZED");
  }

  // 2. Ambil data semua pengguna
  const users = await getUsersData();
  if (!users || users.size === 0) {
    console.error(chalk.red("System Error: User data not available."));
    throw new Error("INTERNAL_SERVER_ERROR");
  }

  // 3. Cari pengguna berdasarkan userID dari token
  const user = users.get(userPayload.userID);
  if (!user) {
    console.error(
      chalk.red(
        `Auth Error: User with ID ${userPayload.userID} not found in database.`,
      ),
    );
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
