import { getMessagesFromChannel } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    const channel_id = "1391571208973189181";
    return NextResponse.json(
      { data: await getMessagesFromChannel(channel_id) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Error sending message" },
      { status: 500 }
    );
  }
}
