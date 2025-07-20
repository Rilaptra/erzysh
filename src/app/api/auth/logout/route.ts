// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Buat respons JSON dengan pesan sukses
    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 },
    );

    // Hapus cookie 'token' dengan mengatur maxAge ke 0
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // <-- Kunci untuk menghapus cookie
      sameSite: "lax",
    });

    // Hapus cookie 'x-user-id' dengan cara yang sama
    response.cookies.set("x-user-id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // <-- Kunci untuk menghapus cookie
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
