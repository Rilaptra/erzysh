import { BeamConfig, CalculationResult, ReportItem } from "../types";
import { marked } from "marked";
import { generateStepByStepSolution } from "./solutionGenerator";
import * as XLSX from "xlsx";

/**
 * Export a single problem configuration and result to Excel.
 * Contains 4 Sheets: Data Soal, Hasil & Reaksi, Data Grafik (Points), Perhitungan Manual
 */
export const exportToExcel = (
  config: BeamConfig,
  result: CalculationResult,
) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Data Soal
  const dataSoal = [
    ["Parameter", "Nilai", "Satuan"],
    ["Panjang Balok", config.length, config.unitLength],
    [],
    ["Tumpuan (Supports)", "Posisi (x)", "Tipe"],
    ...config.supports.map((s) => [s.id, s.position, s.type]),
    [],
    ["Beban (Loads)", "Posisi (x)", "Besar", "Panjang", "Tipe"],
    ...config.loads.map((l) => [
      l.id,
      l.position,
      l.magnitude,
      l.length || "-",
      l.type,
    ]),
  ];
  const wsSoal = XLSX.utils.aoa_to_sheet(dataSoal);
  XLSX.utils.book_append_sheet(wb, wsSoal, "Data Soal");

  // 2. Sheet Hasil & Reaksi
  const dataHasil = [
    ["Parameter", "Nilai", "Satuan"],
    ["Gaya Geser Maksimum (Vmax)", result.maxShear, config.unitForce],
    [
      "Momen Maksimum (Mmax)",
      result.maxMoment,
      `${config.unitForce}.${config.unitLength}`,
    ],
    [],
    ["Reaksi Tumpuan", "Nilai", "Satuan"],
    ...Object.entries(result.reactions).map(([k, v]) => [
      k,
      v,
      config.unitForce,
    ]),
  ];
  const wsHasil = XLSX.utils.aoa_to_sheet(dataHasil);
  XLSX.utils.book_append_sheet(wb, wsHasil, "Ringkasan Hasil");

  // 3. Sheet Data Grafik (Points for plotting in Excel)
  const dataPoints = [
    [
      `Posisi x (${config.unitLength})`,
      `Geser V (${config.unitForce})`,
      `Momen M (${config.unitForce}.${config.unitLength})`,
    ],
    ...result.points.map((p) => [p.x, p.shear, p.moment]),
  ];
  const wsPoints = XLSX.utils.aoa_to_sheet(dataPoints);
  XLSX.utils.book_append_sheet(wb, wsPoints, "Data Grafik");

  // 4. Sheet Perhitungan Manual
  // Generate the text solution
  const manualText = generateStepByStepSolution(config);

  // Split into lines and clean up markdown slightly for better Excel readability
  const manualRows = manualText.split("\n").map((line) => {
    // Remove bold (**), headers (##), code ticks (`), and HTML tags for cleaner plain text
    const cleanLine = line
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/`/g, "")
      .replace(/<sub>/g, "")
      .replace(/<\/sub>/g, "");
    return [cleanLine];
  });

  const wsManual = XLSX.utils.aoa_to_sheet([
    ["PERHITUNGAN MANUAL (LANGKAH DEMI LANGKAH)"],
    [],
    ...manualRows,
  ]);

  // Set column width to be wide enough to read comfortably
  wsManual["!cols"] = [{ wch: 100 }];

  XLSX.utils.book_append_sheet(wb, wsManual, "Perhitungan Manual");

  // Generate Filename
  const filename = `MekaBahan_Soal_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// Helper to generate simple HTML table for Word
const generateSimpleDataTable = (
  points: any[],
  unitL: string,
  unitF: string,
) => {
  // Sample down to ~20 points max for the Word document
  const count = points.length;
  const target = 20;
  const step = Math.ceil(count / target);

  // Always include first, last, and sampled points
  const sampled = points.filter((_, i) => i % step === 0 || i === count - 1);

  const rows = sampled
    .map(
      (p) => `
      <tr>
        <td style="text-align:center">${p.x.toFixed(2)}</td>
        <td style="text-align:center">${p.shear.toFixed(2)}</td>
        <td style="text-align:center">${p.moment.toFixed(2)}</td>
      </tr>
    `,
    )
    .join("");

  return `
      <h3>Data Grafik Sederhana (Sampel)</h3>
      <table style="width:100%; border-collapse:collapse; font-size:9pt; margin-top:10px;">
        <thead>
          <tr style="background-color:#f1f5f9;">
            <th style="border:1px solid #cbd5e1; padding:5px;">Posisi x (${unitL})</th>
            <th style="border:1px solid #cbd5e1; padding:5px;">Geser V (${unitF})</th>
            <th style="border:1px solid #cbd5e1; padding:5px;">Momen M (${unitF}·${unitL})</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
};

/**
 * Generate a Word-compatible HTML document from the Report Queue.
 * Supports combined problems.
 */
export const exportToWord = (items: ReportItem[], withImages: boolean) => {
  if (items.length === 0) return;

  let contentHtml = "";

  items.forEach((item, index) => {
    const htmlSolution = marked.parse(item.solutionText);
    const dataTableHtml = generateSimpleDataTable(
      item.result.points,
      item.config.unitLength,
      item.config.unitForce,
    );

    contentHtml += `
      <div class="problem-section">
        <h1>Soal No. ${index + 1}</h1>
        <p class="meta">Dikerjakan pada: ${item.timestamp.toLocaleString()}</p>
        <hr/>
        
        ${
          withImages && item.images?.beam
            ? `
          <div class="image-container">
            <h3>Visualisasi Balok</h3>
            <img src="${item.images.beam}" alt="Visualisasi Balok" style="width:100%; max-width:600px;" />
          </div>
        `
            : ""
        }

        <div class="solution-text">
          ${htmlSolution}
        </div>

        ${
          withImages && item.images?.charts
            ? `
          <div class="image-container">
             <h3>Diagram Geser & Momen</h3>
             <img src="${item.images.charts}" alt="Diagram V dan M" style="width:100%; max-width:600px;" />
          </div>
        `
            : ""
        }
        
        <div class="data-table-section">
          ${dataTableHtml}
        </div>

        <br style="page-break-after: always;" />
      </div>
    `;
  });

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Laporan MekaBahan</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; }
        h1 { color: #1e3a8a; font-size: 16pt; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; }
        h2 { color: #1e40af; font-size: 14pt; margin-top: 20px; }
        h3 { color: #334155; font-size: 12pt; font-weight: bold; margin-top: 15px; }
        p, li { margin-bottom: 5px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 10px; text-align: left; font-size: 10pt; }
        th { background-color: #f1f5f9; }
        .meta { color: #64748b; font-size: 9pt; margin-bottom: 20px; font-style: italic; }
        .image-container { text-align: center; margin: 20px 0; border: 1px solid #e2e8f0; padding: 10px; }
        blockquote { border-left: 4px solid #cbd5e1; margin-left: 0; padding-left: 10px; color: #475569; }
      </style>
    </head>
    <body>
      <div style="text-align:center; margin-bottom: 30px;">
        <h1 style="font-size: 24pt; border: none;">LAPORAN PERHITUNGAN MEKANIKA TEKNIK</h1>
        <p>Digenerate oleh MekaBahan Solver Pro</p>
      </div>
      ${contentHtml}
    </body>
    </html>
  `;

  // Create Blob and Download
  const blob = new Blob(["\ufeff", fullHtml], {
    type: "application/msword",
  });

  // Use a simple anchor link to download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Laporan_MekaBahan_Gabungan_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
