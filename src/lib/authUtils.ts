// src/lib/authUtils.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import type { UserPayload } from "@/types"; // Kita definisikan UserPayload di types

// Pastikan JWT_SECRET konsisten dengan yang ada di endpoint login
const JWT_SECRET = process.env.JWT_SECRET || "your-default-super-secret-key";

/**
 * Memverifikasi token JWT dari cookie request.
 * @param request - Objek NextRequest dari middleware.
 * @returns UserPayload jika token valid, selain itu null.
 */
export function verifyAuth(request: NextRequest): UserPayload | null {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    console.log("Auth failed: No token provided.");
    return null;
  }

  try {
    // Verifikasi token dan cast ke tipe UserPayload
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    console.error("Auth verification error:", (error as Error).message);
    return null;
  }
}
