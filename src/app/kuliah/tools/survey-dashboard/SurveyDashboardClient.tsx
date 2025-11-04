// src/app/kuliah/tools/survey-dashboard/SurveyDashboardClient.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Chart, registerables } from "chart.js";
import randomColor from "randomcolor";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileUp,
  RotateCcw,
  Trash2,
  Search,
  Eye,
  EyeOff,
  BarChart,
  AreaChart,
  ChevronDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/ThemeProvider";

Chart.register(...registerables);

// --- DATA AWAL & KONSTANTA (Tidak berubah) ---
const defaultCsvData = `"Cap waktu","Total skor","Nama","Nama [Skor]","Nama [Masukan]","Domisili (sertakan link gmaps domisili anda)","Moda yang digunakan sehari-hari","Senin (berapa kali berangkat ke kampus)","Selasa (berapa kali berangkat ke kampus)","Rabu (berapa kali berangkat ke kampus)","Kamis (berapa kali berangkat ke kampus)","Jumat (berapa kali berangkat ke kampus)"
"2025/10/24 6:46:43 PM GMT+7","0.00 / 0","Rizqi Lasheva","https://maps.app.goo.gl/QdR88QYhnTWzueG37","Motor",1,1,1,1,1
"2025/10/24 6:49:54 PM GMT+7","0.00 / 0","Korindo Chaesa","https://maps.app.goo.gl/J6ZKGSUKEwVdzFJf9","Mobil",1,1,1,1,1
"2025/10/24 6:52:11 PM GMT+7","0.00 / 0","John Doe","https://maps.app.goo.gl/An1MVhUL5o2BWQPU8","Jalan Kaki",1,1,1,1,1
"2025/10/24 7:01:00 PM GMT+7","0.00 / 0","Aisha Novianty","https://maps.app.goo.gl/G7f8oWkX9y2sA7yJ6","Motor",0,1,0,1,0
"2025/10/24 7:05:30 PM GMT+7","0.00 / 0","Budi Santoso","https://maps.app.goo.gl/P4rLmM2qQv9wXv4T7","Transportasi Umum",1,0,1,0,1`;

const DESTINATION = "Universitas Tidar Kampus Tuguran";
const TRAVEL_MODE_CODES: { [key: string]: string } = {
  motor: "9",
  mobil: "0",
  "jalan kaki": "2",
  sepeda: "1",
  "transportasi umum": "3",
};

// --- FUNGSI HELPER (parseCSV tidak berubah) ---
function parseCSV(csvText: string) {
  if (!csvText) return [];
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const matchRegex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
  const headerLine = lines[0];
  const headerMatches = headerLine.match(matchRegex);
  if (!headerMatches) return [];
  const headers = headerMatches.map((h) => h.replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const valueMatches = line.match(matchRegex);
    if (!valueMatches) return {};
    const values = valueMatches.map((v) => v.replace(/"/g, ""));
    const rowObject: { [key: string]: string } = {};
    headers.forEach((header, index) => {
      rowObject[header] = values[index];
    });
    return rowObject;
  });
}

// --- 👇 PERUBAHAN DI SINI: FUNGSI HELPER FETCH KOORDINAT ---
// Fungsi ini sekarang manggil API Route internal kita, bukan proxy eksternal.
async function fetchCoordinates(url: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) return null;

  try {
    const response = await fetch(
      `/api/get-coordinates?url=${encodeURIComponent(url)}`,
    );
    if (!response.ok) {
      // Jika status 404, artinya server sudah cari tapi nggak nemu.
      if (response.status === 404) return null;
      // Error lain dianggap masalah server
      throw new Error(`Server error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.coordinate || null; // API kita ngirim balik { coordinate: "..." }
  } catch (error) {
    console.error(`Gagal mengambil koordinat untuk ${url}:`, error);
    return null; // Return null jika ada error network atau parsing
  }
}
// --- 🔼 AKHIR PERUBAHAN ---

// --- SUB-KOMPONEN DataTableRow (Tidak berubah) ---
interface DataTableRowProps {
  rowData: { [key: string]: string };
  headers: string[];
  savedCoord: string | null;
  onCoordUpdate: (coord: string) => void;
}
const DataTableRow = ({
  rowData,
  headers,
  savedCoord,
  onCoordUpdate,
}: DataTableRowProps) => {
  const [coordinate, setCoordinate] = useState(savedCoord || "...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const domisiliUrl = rowData["Domisili"];
    if (coordinate === "..." && domisiliUrl && domisiliUrl !== "N/A") {
      setIsLoading(true);
      fetchCoordinates(domisiliUrl).then((coords) => {
        if (isMounted) {
          const finalCoord = coords || "❌";
          setCoordinate(finalCoord);
          setIsLoading(false);
          if (finalCoord !== "❌") onCoordUpdate(finalCoord);
        }
      });
    } else if (!domisiliUrl || domisiliUrl === "N/A") {
      setCoordinate("N/A");
    }
    return () => {
      isMounted = false;
    };
  }, [rowData, coordinate, onCoordUpdate]);

  const handleRouteClick = () => {
    if (coordinate && !["...", "❌", "N/A"].includes(coordinate)) {
      const moda = (rowData["Moda"] || "").toLowerCase();
      const travelModeCode = TRAVEL_MODE_CODES[moda] || "0";
      const url = `https://www.google.com/maps/dir/${coordinate}/${encodeURIComponent(DESTINATION)}/data=!4m2!4m1!3e${travelModeCode}`;
      window.open(url, "_blank");
    }
  };

  const handleCopy = (text: string) => {
    if (text && !["...", "❌", "N/A"].includes(text) && !isLoading) {
      navigator.clipboard.writeText(text);
      toast.success("Koordinat disalin!");
    }
  };

  return (
    <TableRow>
      {headers.map((header) => (
        <TableCell key={header}>{rowData[header]}</TableCell>
      ))}
      <TableCell
        onClick={() => handleCopy(coordinate)}
        className="cursor-pointer font-mono"
      >
        {isLoading ? (
          <span className="text-muted-foreground animate-pulse">
            Loading...
          </span>
        ) : (
          coordinate
        )}
      </TableCell>
      <TableCell>
        {!isLoading && !["...", "❌", "N/A"].includes(coordinate) && (
          <Button size="sm" onClick={handleRouteClick}>
            Rute
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

// --- KOMPONEN UTAMA (Sisa kode tidak ada perubahan signifikan) ---
export default function SurveyDashboardClient() {
  const [rawData, setRawData] = useState<{ [key: string]: string }[]>([]);
  const [coordsMap, setCoordsMap] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isTableVisible, setTableVisible] = useState(true);
  const [isChartsVisible, setChartsVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("savedCsvData") || defaultCsvData;
    const savedCoords = localStorage.getItem("savedCoordsData");
    setRawData(parseCSV(savedData));
    if (savedCoords) {
      try {
        setCoordsMap(JSON.parse(savedCoords));
      } catch {
        localStorage.removeItem("savedCoordsData");
      }
    }
  }, []);

  const handleCoordUpdate = (identifier: string, coordinate: string) => {
    setCoordsMap((prevMap) => {
      const newMap = { ...prevMap, [identifier]: coordinate };
      localStorage.setItem("savedCoordsData", JSON.stringify(newMap));
      return newMap;
    });
  };

  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return { headers: [], rows: [] };
    const headersToKeep = [
      "Nama",
      "Domisili (sertakan link gmaps domisili anda)",
      "Moda yang digunakan sehari-hari",
      "Senin (berapa kali berangkat ke kampus)",
      "Selasa (berapa kali berangkat ke kampus)",
      "Rabu (berapa kali berangkat ke kampus)",
      "Kamis (berapa kali berangkat ke kampus)",
      "Jumat (berapa kali berangkat ke kampus)",
    ];
    const cleanHeaders = [
      "Nama",
      "Domisili",
      "Moda",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
    ];
    const cleanRows = rawData
      .map((row) => {
        const newRow: { [key: string]: string } = {};
        headersToKeep.forEach((h, i) => {
          newRow[cleanHeaders[i]] = (row[h] || "").replace(/"/g, "").trim();
        });
        return newRow;
      })
      .filter((row) => row.Nama && row.Domisili);
    return { headers: cleanHeaders, rows: cleanRows };
  }, [rawData]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return processedData.rows;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return processedData.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lowerSearchTerm),
      ),
    );
  }, [processedData.rows, searchTerm]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!ev.target?.result) return;
        const content = ev.target.result as string;
        localStorage.setItem("savedCsvData", content);
        setRawData(parseCSV(content));
        setCoordsMap({});
        localStorage.removeItem("savedCoordsData");
        toast.success("Data CSV berhasil diunggah!", {
          description: "Cache koordinat direset.",
        });
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (window.confirm("Yakin reset? Data unggahan akan hilang.")) {
      localStorage.removeItem("savedCsvData");
      localStorage.removeItem("savedCoordsData");
      setRawData(parseCSV(defaultCsvData));
      setCoordsMap({});
      toast.info("Data telah direset ke contoh awal.");
    }
  };

  const handleClearCoords = () => {
    if (window.confirm("Yakin hapus cache koordinat?")) {
      localStorage.removeItem("savedCoordsData");
      setCoordsMap({});
      toast.info("Cache koordinat dihapus. Akan di-fetch ulang.");
      setRawData((prev) => [...prev]);
    }
  };

  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast.warning("Tidak ada data untuk diekspor.");
      return;
    }
    const rowsToExport = filteredRows.map((row) => {
      const identifier = `${row.Nama}_${row.Domisili}`;
      const coord = coordsMap[identifier] || "N/A";
      let routeUrl = "";
      if (coord && !["...", "❌", "N/A"].includes(coord)) {
        const moda = (row.Moda || "").toLowerCase();
        const travelModeCode = TRAVEL_MODE_CODES[moda] || "0";
        routeUrl = `https://www.google.com/maps/dir/${coord}/${encodeURIComponent(DESTINATION)}/data=!4m2!4m1!3e${travelModeCode}`;
      }
      return { ...row, Koordinat: coord, "Link Rute": routeUrl };
    });
    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(
      workbook,
      `DataSurvey_Eksport_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success("Data berhasil diekspor ke XLSX!");
  };

  const Charts = ({ rows }: any) => {
    const modeChartRef = useRef(null);
    const daysChartRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
      if (rows.length === 0) return;

      const chartTextColor =
        theme === "dark" ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)";
      Chart.defaults.color = chartTextColor;

      if (!modeChartRef.current || !daysChartRef.current) return;
      Chart.getChart(modeChartRef.current)?.destroy();
      Chart.getChart(daysChartRef.current)?.destroy();

      const modeCounts = rows.reduce((acc: any, row: any) => {
        const mode = (row["Moda"] || "Lainnya").trim();
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {});
      const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
      const dayTotals = days.map((day) =>
        rows.reduce(
          (sum: number, row: any) => sum + (parseInt(row[day], 10) || 0),
          0,
        ),
      );

      new Chart(modeChartRef.current, {
        type: "pie",
        data: {
          labels: Object.keys(modeCounts),
          datasets: [
            {
              data: Object.values(modeCounts),
              backgroundColor: randomColor({
                count: Object.keys(modeCounts).length,
                luminosity: "light",
                hue: "purple",
              }),
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Distribusi Moda Transportasi" },
          },
        },
      });

      new Chart(daysChartRef.current, {
        type: "bar",
        data: {
          labels: days,
          datasets: [
            {
              label: "Total Perjalanan",
              data: dayTotals,
              backgroundColor: "hsl(262.1 83.3% 57.8%)",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Total Perjalanan per Hari" },
          },
          scales: { y: { beginAtZero: true } },
        },
      });
    }, [rows, theme]);

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <canvas ref={modeChartRef}></canvas>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <canvas ref={daysChartRef}></canvas>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="bg-background text-foreground container mx-auto p-4 sm:p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold">Dashboard Survey Perjalanan</h1>
        <p className="text-muted-foreground mt-2">
          Analisis data kuis perjalanan mahasiswa Teknik Sipil.
        </p>
      </header>

      <Card className="mb-8 p-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-lg font-bold">Manajemen Data</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileSelect}
            />
            <Button variant="outline" onClick={handleClearCoords}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              Pilih CSV
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative grow">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Cari Nama, Domisili, Moda..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setTableVisible(!isTableVisible)}
        >
          {isTableVisible ? (
            <EyeOff className="mr-2 h-4 w-4" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isTableVisible ? "Sembunyikan" : "Tampilkan"} Tabel
        </Button>
        <Button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Export XLSX
        </Button>
      </div>

      {isTableVisible && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {processedData.headers.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
                <TableHead>Koordinat</TableHead>
                <TableHead>Rute</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row, index) => (
                <DataTableRow
                  key={`${row.Nama}-${index}`}
                  rowData={row}
                  headers={processedData.headers}
                  savedCoord={coordsMap[`${row.Nama}_${row.Domisili}`]}
                  onCoordUpdate={(coord) =>
                    handleCoordUpdate(`${row.Nama}_${row.Domisili}`, coord)
                  }
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <Button
              onClick={() => setChartsVisible(!isChartsVisible)}
              variant="ghost"
              className="w-full text-lg"
            >
              {isChartsVisible ? (
                <BarChart className="mr-2" />
              ) : (
                <AreaChart className="mr-2" />
              )}
              Visualisasi Data
              <ChevronDown
                className={cn(
                  "ml-2 h-4 w-4 transition-transform",
                  isChartsVisible && "rotate-180",
                )}
              />
            </Button>
          </CardHeader>
          {isChartsVisible && (
            <CardContent>
              <Charts rows={processedData.rows} />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}