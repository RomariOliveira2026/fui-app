/**
 * Firebase Cloud Messaging (FCM) Push Notification Helper
 * 
 * IMPORTANTE: Para usar este módulo, você precisa:
 * 1. Criar um projeto no Firebase Console (https://console.firebase.google.com/)
 * 2. Gerar uma chave privada de conta de serviço:
 *    - Vá em Project Settings > Service Accounts
 *    - Clique em "Generate New Private Key"
 *    - Salve o arquivo JSON
 * 3. Adicionar as credenciais como variável de ambiente:
 *    - FIREBASE_SERVICE_ACCOUNT_KEY (JSON string completo)
 *    OU
 *    - FIREBASE_PROJECT_ID
 *    - FIREBASE_CLIENT_EMAIL
 *    - FIREBASE_PRIVATE_KEY
 */

import * as db from "../db";

// Tipo para payload de notificação
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: number,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's FCM tokens
    const tokens = await db.getUserFcmTokens(userId);
    
    if (!tokens || tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return { success: false, error: "No FCM tokens" };
    }

    // Send to all user's devices
    const results = await Promise.allSettled(
      tokens.map(token => sendPushToToken(token.token, payload))
    );

    // Check if at least one succeeded
    const hasSuccess = results.some(r => r.status === "fulfilled" && r.value.success);
    
    return { success: hasSuccess };
  } catch (error) {
    console.error("Error sending push to user:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send push notification to a specific FCM token
 */
export async function sendPushToToken(
  token: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.warn("Firebase not configured. Skipping push notification.");
      return { success: false, error: "Firebase not configured" };
    }

    // Lazy load firebase-admin (only if configured)
    const admin = await import("firebase-admin");

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      const serviceAccount = getFirebaseServiceAccount();
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // Prepare FCM message
    const message: any = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.icon && { imageUrl: payload.icon }),
      },
      data: {
        ...(payload.url && { url: payload.url }),
        ...(payload.data || {}),
      },
      webpush: {
        notification: {
          icon: payload.icon || "/logo.png",
          badge: payload.badge || "/logo.png",
          requireInteraction: true,
        },
        fcmOptions: {
          link: payload.url || "/",
        },
      },
    };

    // Send message
    const response = await admin.messaging().send(message);
    console.log("Successfully sent push notification:", response);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    
    // Handle invalid token errors
    if (error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered") {
      // Remove invalid token from database
      await db.deleteFcmToken(token);
      console.log("Removed invalid FCM token:", token);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: number[],
  payload: PushNotificationPayload
): Promise<{ success: boolean; successCount: number; totalCount: number }> {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushToUser(userId, payload))
  );

  const successCount = results.filter(
    r => r.status === "fulfilled" && r.value.success
  ).length;

  return {
    success: successCount > 0,
    successCount,
    totalCount: userIds.length,
  };
}

/**
 * Check if Firebase is configured
 */
function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_PROJECT_ID &&
     process.env.FIREBASE_CLIENT_EMAIL &&
     process.env.FIREBASE_PRIVATE_KEY)
  );
}

/**
 * Get Firebase service account credentials
 */
function getFirebaseServiceAccount(): any {
  // Option 1: Full JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON");
    }
  }

  // Option 2: Individual fields
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  throw new Error("Firebase credentials not configured");
}
