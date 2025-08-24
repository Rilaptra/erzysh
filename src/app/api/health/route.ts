// src/app/api/health/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Di dunia nyata, di sini bisa ditambah pengecekan koneksi ke Discord atau database lain.
    // Untuk sekarang, kita anggap server sehat jika endpoint ini bisa diakses.
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: (error as Error).message },
      { status: 500 },
    );
  }
}
