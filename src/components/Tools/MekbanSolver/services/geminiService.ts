import { GoogleGenAI } from "@google/genai";
import { BeamConfig, CalculationResult } from "../types";

export const explainBeamProblem = async (
  config: BeamConfig,
  result: CalculationResult,
) => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey)
      throw new Error(
        "API Key Missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local",
      );

    const ai = new GoogleGenAI({ apiKey });

    // Construct a detailed prompt based on current state
    const prompt = `
      Anda adalah dosen ahli Teknik Sipil/Mekanika Teknik.
      Tolong jelaskan langkah demi langkah cara menyelesaikan soal balok (beam) berikut ini dalam Bahasa Indonesia.
      
      DATA SOAL:
      - Panjang Balok: ${config.length} ${config.unitLength}
      - Tumpuan: ${config.supports.map((s) => `${s.type} di x=${s.position}`).join(", ")}
      - Beban: ${config.loads.map((l) => `${l.type} sebesar ${l.magnitude}${config.unitForce} di posisi x=${l.position}${l.length ? " sepanjang " + l.length : ""}`).join(", ")}
      
      HASIL KALKULASI PROGRAM:
      - Reaksi Tumpuan: R1=${result.reactions.R1.toFixed(2)}, R2=${result.reactions.R2.toFixed(2)}
      - Geser Maksimum (Vmax): ${result.maxShear.toFixed(2)}
      - Momen Maksimum (Mmax): ${result.maxMoment.toFixed(2)}

      TUGAS ANDA:
      1. Tunjukkan cara menghitung Reaksi Tumpuan ($\Sigma M = 0$, $\Sigma F_y = 0$).
      2. Jelaskan bagaimana membuat diagram gaya geser (Shear Force Diagram) secara kualitatif.
      3. Jelaskan bagaimana menghitung Momen Maksimum.
      4. Jika ada "Inersia" yang disebut user, jelaskan singkat hubungannya dengan tegangan lentur ($\sigma = My/I$), tapi fokus utama tetap pada gaya dalam.
      
      Gunakan format Markdown yang rapi dengan LaTeX untuk rumus jika memungkinkan.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Updated to latest flash model for better speed
      contents: prompt,
      config: {
        // thinkingConfig not supported in standard REST client usually, remove if causing errors
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, terjadi kesalahan saat menghubungi asisten AI. Pastikan API Key valid.";
  }
};
