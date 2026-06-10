/**
 * Firebase Cloud Messaging (FCM) integration for push notifications
 * Using Firebase Admin SDK (V1 API)
 * Project: Fui! App (fui-app-4c062)
 */

import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

interface FcmNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
}

// Initialize Firebase Admin SDK
function getFirebaseAdmin() {
  // Check if already initialized
  if (getApps().length > 0) {
    return getMessaging();
  }

  // Create service account from environment variables
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || "fui-app-4c062",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };

  // Initialize app
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
    return getMessaging();
  } catch (error) {
    console.error("[FCM] Failed to initialize Firebase Admin:", error);
    throw error;
  }
}

/**
 * Send push notification to specific FCM tokens
 */
export async function sendPushNotification(
  tokens: string[],
  notification: FcmNotification
): Promise<{ success: boolean; failedTokens: string[] }> {
  if (tokens.length === 0) {
    return { success: true, failedTokens: [] };
  }

  // Check if Firebase is configured
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn("[FCM] Firebase credentials not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
    return { success: false, failedTokens: tokens };
  }

  const failedTokens: string[] = [];

  try {
    const messaging = getFirebaseAdmin();

    // Send to each token individually for better error handling
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.icon,
          },
          data: notification.data || {},
          webpush: {
            notification: {
              icon: notification.icon || "/icon-192.png",
              badge: notification.badge || "/icon-192.png",
            },
            fcmOptions: {
              link: "/",
            },
          },
        });
      } catch (error: any) {
        console.error(`[FCM] Failed to send to token:`, error.message);
        failedTokens.push(token);
      }
    }

    return {
      success: failedTokens.length === 0,
      failedTokens,
    };
  } catch (error) {
    console.error("[FCM] Error sending notifications:", error);
    return { success: false, failedTokens: tokens };
  }
}

/**
 * Send notification to a specific user (all their devices)
 */
export async function notifyUser(
  userId: number,
  notification: FcmNotification
): Promise<boolean> {
  const { getUserFcmTokens, deleteFcmToken } = await import("../db");

  const userTokens = await getUserFcmTokens(userId);

  if (userTokens.length === 0) {
    console.log(`[FCM] No tokens found for user ${userId}`);
    return false;
  }

  const tokens = userTokens.map((t) => t.token);
  const result = await sendPushNotification(tokens, notification);

  // Clean up failed tokens (likely expired or invalid)
  if (result.failedTokens.length > 0) {
    console.log(`[FCM] Cleaning up ${result.failedTokens.length} failed tokens`);
    for (const token of result.failedTokens) {
      await deleteFcmToken(token);
    }
  }

  return result.success;
}
