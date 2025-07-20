// src/lib/authUtils.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import type { UserPayload } from "@/types";

// Hapus default value, buat aplikasi gagal jika tidak diset di .env
const JWT_SECRET = process.env.JWT_SECRET;

export function verifyAuth(request: NextRequest): UserPayload | null {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  const token = request.cookies.get("token")?.value;
  // ... sisa fungsi tetap sama
  if (!token) {
    console.log("Auth failed: No token provided.");
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    console.error("Auth verification error:", (error as Error).message);
    return null;
  }
}
