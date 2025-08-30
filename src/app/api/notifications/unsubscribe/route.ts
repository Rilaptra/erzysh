// src/app/api/notifications/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateAndGetUser } from "@/lib/authService";
import { discord, getMessagesFromChannel } from "@/lib/utils"; // Impor discord helper
import { sanitizeMessage } from "@/lib/utils";
// Ganti dengan ID Container dan Box khusus untuk menyimpan subscription
const SUB_BOX_ID = "1411367472791158898"; // Box "push-subscriptions"

export async function POST(req: NextRequest) {
  try {
    const user = await validateAndGetUser(req);
    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not provided" },
        { status: 400 },
      );
    }

    // Ambil semua pesan (collections) dari channel subscription
    const subscriptionMessages = await getMessagesFromChannel(SUB_BOX_ID);

    let messageIdToDelete: string | null = null;

    // Cari messageId yang cocok dengan endpoint yang mau di-unsubscribe
    // Ini butuh fetch detail karena endpoint ada di dalam attachment
    for (const msg of subscriptionMessages) {
      if (msg.name !== `${user.userID}.json`) continue; // Optimasi: Cek nama file dulu

      const fullMsg = await discord.get(
        `/channels/${SUB_BOX_ID}/messages/${msg.id}`,
      );
      const sanitized = sanitizeMessage(fullMsg as any);

      try {
        if (typeof sanitized.content !== "object") continue;

        // Karena konten ada di attachment, kita harus fetch attachment-nya
        const attachmentResponse = await fetch(sanitized.attachments![0].url);
        const attachmentData = await attachmentResponse.json();

        if (attachmentData.subscription?.endpoint === endpoint) {
          messageIdToDelete = msg.id;
          break;
        }
      } catch (e) {
        console.warn(`Could not process subscription message ${msg.id}`, e);
      }
    }

    if (messageIdToDelete) {
      // Panggil Discord API untuk menghapus pesan secara langsung
      await discord.delete(
        `/channels/${SUB_BOX_ID}/messages/${messageIdToDelete}`,
      );
      return NextResponse.json(
        { message: "Subscription successfully removed" },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { message: "Subscription not found" },
        { status: 404 },
      );
    }
  } catch (error) {
    if ((error as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[API/UNSUBSCRIBE] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
