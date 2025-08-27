import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify, sign } from "jsonwebtoken";
import type { Payload } from "@/types/payload";

// Middleware akan dieksekusi untuk setiap request yang cocok dengan matcher di bawah
export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // Jika pengguna sudah login dan mencoba mengakses halaman /login atau /register,
  // arahkan mereka ke dashboard.
  if (
    token &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/register"))
  ) {
    try {
      // Verifikasi token untuk memastikan tidak ada token palsu
      verify(token, process.env.JWT_SECRET!);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Jika token tidak valid, biarkan mereka melanjutkan ke halaman login/register
      return NextResponse.next();
    }
  }

  // Lindungi halaman-halaman yang memerlukan autentikasi
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/database") ||
    request.nextUrl.pathname.startsWith("/kuliah") ||
    request.nextUrl.pathname.startsWith("/api/database")
  ) {
    // Jika tidak ada token, paksa redirect ke halaman login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Verifikasi token yang ada
      const decoded = verify(token, process.env.JWT_SECRET!) as Payload;

      // --- ✨ LOGIKA SLIDING SESSION DIMULAI DI SINI ✨ ---

      // 1. Buat ulang payload dari token yang ada untuk memastikan data tetap bersih
      const newPayload: Payload = {
        userId: decoded.userId,
        username: decoded.username,
      };

      // 2. Buat token BARU dengan masa berlaku 7 hari dari SEKARANG
      const newToken = sign(newPayload, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      // 3. Siapkan response untuk melanjutkan request pengguna
      const response = NextResponse.next();

      // 4. Atur cookie di browser pengguna dengan token yang baru (refresh)
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      response.cookies.set("token", newToken, {
        httpOnly: true, // Cookie tidak bisa diakses dari JavaScript sisi klien
        secure: process.env.NODE_ENV === "production", // Hanya kirim via HTTPS di produksi
        sameSite: "strict", // Perlindungan CSRF
        path: "/",
        maxAge: sevenDaysInSeconds, // Browser akan menghapus cookie setelah 7 hari
      });

      // --- ✨ LOGIKA SLIDING SESSION SELESAI ✨ ---

      return response;
    } catch {
      // Jika token tidak valid (kadaluwarsa, salah, dll.),
      // redirect ke halaman login dan hapus cookie yang salah.
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  // Untuk semua request lainnya, biarkan saja
  return NextResponse.next();
}

// Konfigurasi path mana saja yang akan menjalankan middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/database/:path*",
    "/kuliah/:path*",
    "/login",
    "/register",
    "/api/database/:path*",
  ],
};
