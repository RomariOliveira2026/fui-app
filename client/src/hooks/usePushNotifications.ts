import { useEffect, useState, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { firebaseConfig, vapidKey, isFirebaseConfigured } from "../firebase-config";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Helper to get or create the Firebase app singleton.
 * Prevents the "duplicate-app" error when React re-renders or
 * hot-module-replacement re-executes the module.
 */
function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function usePushNotifications(userId?: number) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isInitialized, setIsInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const initRef = useRef(false);

  const registerTokenMutation = trpc.user.registerFcmToken.useMutation();

  useEffect(() => {
    if (!userId || !isFirebaseConfigured) {
      return;
    }

    // Prevent double-init from React StrictMode / HMR
    if (initRef.current) return;
    initRef.current = true;

    initializePushNotifications();
  }, [userId]);

  const initializePushNotifications = async () => {
    try {
      // Check if notifications are supported
      if (!("Notification" in window)) {
        console.log("[Push] Notifications not supported");
        return;
      }

      // Check if FCM is supported
      const supported = await isSupported();
      if (!supported) {
        console.log("[Push] FCM not supported");
        return;
      }

      setPermission(Notification.permission);

      // Initialize Firebase (singleton)
      const app = getFirebaseApp();
      const messaging = getMessaging(app);

      // Ensure the service worker is ready (registered from index.html as sw.js)
      if ('serviceWorker' in navigator) {
        // Also register firebase-messaging-sw.js for FCM compatibility
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' });
        } catch (e) {
          console.log('[Push] Firebase SW registration skipped:', e);
        }
        await navigator.serviceWorker.ready;
      }

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log("[Push] Foreground message received:", payload);
        
        const title = payload.notification?.title || "Fui!";
        const body = payload.notification?.body || "";
        
        toast(title, {
          description: body,
          duration: 5000,
        });
      });

      setIsInitialized(true);
    } catch (error) {
      console.error("[Push] Initialization error:", error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log("[Push] requestPermission called");

      if (!isFirebaseConfigured) {
        console.warn("[Push] Firebase not configured");
        return false;
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn("[Push] Notifications not supported in this browser");
        return false;
      }

      console.log("[Push] Requesting permission from browser...");
      const result = await Notification.requestPermission();
      console.log("[Push] Permission response:", result);
      setPermission(result);

      if (result === "granted") {
        try {
          await registerToken();
          toast.success("Notificações ativadas com sucesso!");
          return true;
        } catch (tokenError) {
          console.error("[Push] Token registration failed:", tokenError);
          // Still return true since permission was granted, token can be retried
          toast.success("Notificações ativadas!");
          return true;
        }
      }

      // For "denied" or "default" - return false silently
      // The calling component (NotificationPrompt) handles the UX
      return false;
    } catch (error) {
      console.error("[Push] Permission error:", error);
      return false;
    }
  };

  const registerToken = async () => {
    try {
      const app = getFirebaseApp();
      const messaging = getMessaging(app);

      // Get the service worker registration for FCM
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        // Prefer firebase-specific SW, fallback to any active SW
        swRegistration = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw.js'))
          || registrations.find(r => r.active?.scriptURL.includes('sw.js'));
      }

      const token = await getToken(messaging, { 
        vapidKey,
        ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {})
      });
      
      if (token) {
        console.log("[Push] FCM Token obtained");
        setFcmToken(token);

        // Register token with backend
        await registerTokenMutation.mutateAsync({
          token,
          deviceInfo: navigator.userAgent,
        });

        return token;
      }
    } catch (error) {
      console.error("[Push] Token registration error:", error);
      throw error;
    }
  };

  return {
    permission,
    isInitialized,
    fcmToken,
    requestPermission,
    isConfigured: isFirebaseConfigured,
  };
}
