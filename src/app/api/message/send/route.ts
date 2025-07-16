// file: src/app/api/message/send/route.ts
import { fileAttachmentsBuilder, sendMessage } from "@/lib/utils";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    const fileData = readFileSync("./file.txt", "utf-8");
    const files = fileAttachmentsBuilder({
      fileName: "file.txt",
      data: fileData,
    });
    const res = await sendMessage("1391571208973189181", {
      files,
    });

    return NextResponse.json(
      { message: "Message sent successfully", data: res },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
