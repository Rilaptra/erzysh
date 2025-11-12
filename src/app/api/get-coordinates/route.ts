// src/app/api/get-coordinates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Skema validasi untuk memastikan URL yang masuk aman dan valid
const urlSchema = z.string().url("URL tidak valid.");

// Pola regex untuk scraping, sama seperti yang lo punya
const COORD_PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/,
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlToFetch = searchParams.get("url");

  // 1. Validasi Input
  if (!urlToFetch) {
    return NextResponse.json(
      { error: "Query parameter 'url' wajib diisi." },
      { status: 400 },
    );
  }

  try {
    urlSchema.parse(urlToFetch);
  } catch (error) {
    return NextResponse.json(
      { error: "URL yang diberikan tidak valid." },
      { status: 400 },
    );
  }

  try {
    // 2. Fetch dari Sisi Server (No CORS!)
    const response = await fetch(urlToFetch, {
      // Tambahkan User-Agent biar nggak dicurigai sebagai bot sederhana
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      // Matikan cache Vercel biar selalu dapet data fresh jika diperlukan
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Gagal fetch URL, status: ${response.status}`);
    }

    const text = await response.text();

    // 3. Scraping Koordinat
    for (const pattern of COORD_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const lat = parseFloat(match[1] || match[3]).toFixed(6);
        const lon = parseFloat(match[2] || match[4]).toFixed(6);
        // 4. Kirim Balik Hasilnya
        return NextResponse.json({ coordinate: `${lat}, ${lon}` });
      }
    }

    // Jika tidak ada pola yang cocok
    return NextResponse.json({ coordinate: null }, { status: 404 });
  } catch (error) {
    console.error("[API/get-coordinates] Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses URL.", details: (error as Error).message },
      { status: 500 },
    );
  }
}
