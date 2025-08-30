// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateAndGetUser } from "@/lib/authService";
import { sendMessage } from "@/lib/utils";

// Ganti dengan ID Container dan Box khusus untuk menyimpan subscription
// const SUB_CONTAINER_ID = "1409908765074919585";
const SUB_BOX_ID = "1411367472791158898"; // Buat Box baru "push-subscriptions"

export async function POST(req: NextRequest) {
  try {
    const user = await validateAndGetUser(req);
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 },
      );
    }

    const payload = {
      name: `${user.userID}.json`,
      content: JSON.stringify({ userID: user.userID, subscription }),
    };

    // Simpan subscription ke Discord
    await sendMessage(SUB_BOX_ID, {
      content: `\`\`\`json\n${JSON.stringify({ name: payload.name, userID: user.userID })}\n\`\`\``,
      files: [
        {
          name: payload.name,
          buffer: Buffer.from(payload.content),
        },
      ],
    });

    return NextResponse.json(
      { message: "Subscription saved" },
      { status: 201 },
    );
  } catch (error) {
    if ((error as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[API/SUBSCRIBE] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
