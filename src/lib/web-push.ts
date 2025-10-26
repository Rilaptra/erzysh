// File: src/lib/web-push.ts
import webPush from "web-push";

if (
  !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY ||
  !process.env.VAPID_SUBJECT
) {
  console.error("VAPID keys are not defined in environment variables.");
} else {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export default webPush;