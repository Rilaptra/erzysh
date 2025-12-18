import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const externalFormData = new FormData();
    externalFormData.append("file", file);
    externalFormData.append("expires", "5m");

    const response = await fetch("https://file.io", {
      method: "POST",
      body: externalFormData,
      headers: {
        Accept: "application/json",
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("File.io error:", response.status, responseText);
      return NextResponse.json(
        { error: `File.io Error: ${response.status}` },
        { status: response.status },
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (e) {
      console.error("File.io parsing error:", e, "Response:", responseText);
      return NextResponse.json(
        { error: "Invalid response from file.io" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
