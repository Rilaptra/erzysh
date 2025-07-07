import { getChannels } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ data: await getChannels() }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching Discord channels:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching Discord channels." },
      { status: 500 }
    );
  }
}
