import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Convert to ArrayBuffer to ensure binary integrity across environments
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    const externalFormData = new FormData();
    externalFormData.append("file", blob, file.name);

    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: externalFormData,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Tmpfiles error:", response.status, responseText);
      return NextResponse.json(
        { error: `Upload Service Error: ${response.status}` },
        { status: response.status },
      );
    }

    try {
      const data = JSON.parse(responseText);
      if (data.status === "success") {
        // Tmpfiles returns: https://tmpfiles.org/XXXX/filename
        // Direct link is: https://tmpfiles.org/dl/XXXX/filename
        const rawUrl = data.data.url;
        const directUrl = rawUrl.replace(
          "https://tmpfiles.org/",
          "https://tmpfiles.org/dl/",
        );

        return NextResponse.json({
          success: true,
          link: directUrl,
        });
      } else {
        return NextResponse.json(
          { success: false, message: "Upload failed on provider side" },
          { status: 502 },
        );
      }
    } catch (e) {
      console.error("Parsing error:", e, "Response:", responseText);
      return NextResponse.json(
        { error: "Invalid response from provider" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
