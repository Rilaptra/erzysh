// src/app/api/generate-title/route.ts

import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const MODEL_NAME = "gemma-3-27b-it"; // Model yang efisien untuk tugas ini

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 },
    );
  }

  try {
    const { mataKuliah, deskripsi } = await req.json();

    if (!mataKuliah || !deskripsi) {
      return NextResponse.json(
        { error: "Mata Kuliah and Deskripsi are required" },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Konfigurasi keamanan untuk menghindari pemblokiran yang tidak perlu
    const generationConfig = {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const prompt = `
      Anda adalah asisten yang cerdas untuk mahasiswa teknik sipil.
      Tugas Anda adalah membuat judul tugas yang singkat, jelas, dan informatif berdasarkan nama mata kuliah dan deskripsinya.
      Gunakan Bahasa Indonesia yang baik. Jangan gunakan tanda kutip pada hasilnya.

      Contoh:
      - Mata Kuliah: Mekanika Bahan
      - Deskripsi: Mengerjakan soal latihan nomor 1-5 tentang tegangan dan regangan pada balok kantilever.
      - Judul yang Dihasilkan: Latihan Soal Tegangan dan Regangan Balok

      Sekarang, buatkan judul untuk data berikut:
      - Mata Kuliah: "${mataKuliah}"
      - Deskripsi: "${deskripsi}"
      - Judul yang Dihasilkan:
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    const generatedTitle = result.response.text().trim();

    return NextResponse.json({ title: generatedTitle });
  } catch (error) {
    console.error("Error generating title with Gemini:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 },
    );
  }
}
