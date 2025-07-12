// src/app/api/auth/me/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyAuth } from "@/lib/authUtils";
import { getUsersData } from "../../database/helpers";

/**
 * Endpoint untuk mendapatkan data pengguna yang sedang login
 * berdasarkan token JWT dari cookie.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Panggil verifyAuth untuk mendekode token dari cookie
    const userPayload = verifyAuth(request);
    const users = await getUsersData();

    // 2. Jika tidak ada payload (token tidak valid/tidak ada), kirim error 401
    if (!userPayload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing token." },
        { status: 401 },
      );
    }

    if (
      !users ||
      !users.has(userPayload.username) ||
      !users.has(userPayload.userID)
    ) {
      return NextResponse.json(
        { error: "Unauthorized: User not found" },
        { status: 401 },
      );
    }
    // 3. Jika berhasil, kirim kembali data pengguna (tanpa info sensitif)
    //    Kita bisa hapus iat (issued at) dan exp (expiration) agar respons lebih bersih
    return NextResponse.json(users.get(userPayload.userID), { status: 200 });
  } catch (error) {
    console.error("[API/ME] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
