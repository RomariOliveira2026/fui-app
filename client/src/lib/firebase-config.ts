import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// Firebase configuration - Fui! App (fui-app-4c062)
const firebaseConfig = {
  apiKey: "AIzaSyAp6L9g15aptaYhV9RdDUEDqoHFQkT6MRY",
  authDomain: "fui-app-4c062.firebaseapp.com",
  projectId: "fui-app-4c062",
  storageBucket: "fui-app-4c062.firebasestorage.app",
  messagingSenderId: "850666707584",
  appId: "1:850666707584:web:4a21a34fbed1a24b38e465",
  measurementId: "G-WJ60LBY3BZ"
};

const VAPID_KEY = "BBYfSfpNJY8W1wwai12hkU_esRFoS3JOOtsOq-2Pv41M6XBmutuq3Ejwp2ynDfgw5HCmUfiOhXffZT908fSLW-M";

// Initialize Firebase
let app;
let messaging: Messaging | null = null;

try {
  // Avoid duplicate initialization
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  // Initialize Firebase Cloud Messaging
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

/**
 * Request permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!messaging) {
      throw new Error("Firebase Messaging not initialized");
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Notification permission granted");
      
      // Get FCM token with VAPID key
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      
      if (token) {
        console.log("FCM Token obtained successfully");
        return token;
      } else {
        console.log("No registration token available");
        return null;
      }
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error getting notification permission:", error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    console.error("Firebase Messaging not initialized");
    return;
  }

  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.permission;
  }
  return "default";
}

export { messaging, firebaseConfig };
