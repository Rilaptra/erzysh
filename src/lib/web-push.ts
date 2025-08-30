// src/lib/web-push.ts
import webPush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error("VAPID keys are not configured in environment variables.");
} else {
  webPush.setVapidDetails(
    "mailto:your-email@example.com", // Ganti dengan emailmu
    vapidPublicKey,
    vapidPrivateKey,
  );
}

export default webPush;
