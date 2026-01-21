import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "./AuthContext";

interface Notification {
  _id: Id<"notifications">;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: number;
  leagueId?: Id<"leagues">;
}

interface NotificationPreferences {
  gameReminders: boolean;
  gameStart: boolean;
  gameEnd: boolean;
  scoreUpdates: boolean;
  teamUpdates: boolean;
  leagueAnnouncements: boolean;
  reminderMinutesBefore?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isPushSupported: boolean;
  isPushEnabled: boolean;
  markAsRead: (notificationId: Id<"notifications">) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: Id<"notifications">) => Promise<void>;
  updatePreferences: (prefs: NotificationPreferences) => Promise<void>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, selectedLeague } = useAuth();
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushSupported] = useState(() => "serviceWorker" in navigator && "PushManager" in window);

  // Queries
  const notificationsData = useQuery(
    api.notifications.getNotifications,
    token ? { token, leagueId: selectedLeague?.id, limit: 50 } : "skip"
  );

  const preferencesData = useQuery(
    api.notifications.getPreferences,
    token ? { token, leagueId: selectedLeague?.id } : "skip"
  );

  const pushSubscriptions = useQuery(
    api.notifications.getPushSubscriptions,
    token ? { token } : "skip"
  );

  // Mutations
  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);
  const updatePreferencesMutation = useMutation(api.notifications.updatePreferences);
  const subscribeToPushMutation = useMutation(api.notifications.subscribeToPush);
  const unsubscribeFromPushMutation = useMutation(api.notifications.unsubscribeFromPush);

  // Check if push is enabled
  useEffect(() => {
    if (pushSubscriptions && pushSubscriptions.length > 0) {
      setIsPushEnabled(true);
    } else {
      setIsPushEnabled(false);
    }
  }, [pushSubscriptions]);

  // Register service worker on mount
  useEffect(() => {
    if (isPushSupported) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    }
  }, [isPushSupported]);

  const markAsRead = useCallback(
    async (notificationId: Id<"notifications">) => {
      if (!token) return;
      await markAsReadMutation({ token, notificationId });
    },
    [token, markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    await markAllAsReadMutation({ token, leagueId: selectedLeague?.id });
  }, [token, selectedLeague?.id, markAllAsReadMutation]);

  const deleteNotification = useCallback(
    async (notificationId: Id<"notifications">) => {
      if (!token) return;
      await deleteNotificationMutation({ token, notificationId });
    },
    [token, deleteNotificationMutation]
  );

  const updatePreferences = useCallback(
    async (prefs: NotificationPreferences) => {
      if (!token) return;
      await updatePreferencesMutation({
        token,
        leagueId: selectedLeague?.id,
        ...prefs,
      });
    },
    [token, selectedLeague?.id, updatePreferencesMutation]
  );

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!token || !isPushSupported) return false;

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // TODO: Get VAPID public key from server
      // For now, we'll create a placeholder subscription
      // When VAPID keys are configured, use:
      //
      // const vapidKey = await getVapidPublicKey();
      // const subscription = await registration.pushManager.subscribe({
      //   userVisibleOnly: true,
      //   applicationServerKey: urlBase64ToUint8Array(vapidKey),
      // });

      // For demo purposes, we'll just show that the API is working
      // Real push requires VAPID keys to be configured
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(
          "Push notification support is available but VAPID keys need to be configured. See convex/notifications.ts for setup instructions"
        );
      }

      // Check if there's an existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        const p256dh = existingSubscription.getKey("p256dh");
        const auth = existingSubscription.getKey("auth");

        if (p256dh && auth) {
          await subscribeToPushMutation({
            token,
            endpoint: existingSubscription.endpoint,
            p256dh: arrayBufferToBase64(p256dh),
            auth: arrayBufferToBase64(auth),
            userAgent: navigator.userAgent,
          });
          setIsPushEnabled(true);
          return true;
        }
      }

      // Without VAPID keys, we can't create a new subscription
      // Return false but don't throw an error
      return false;
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      return false;
    }
  }, [token, isPushSupported, subscribeToPushMutation]);

  const disablePushNotifications = useCallback(async () => {
    if (!token || !isPushSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from database
        await unsubscribeFromPushMutation({
          token,
          endpoint: subscription.endpoint,
        });
      }

      setIsPushEnabled(false);
    } catch (error) {
      console.error("Failed to disable push notifications:", error);
    }
  }, [token, isPushSupported, unsubscribeFromPushMutation]);

  const value: NotificationContextType = {
    notifications: notificationsData?.notifications || [],
    unreadCount: notificationsData?.unreadCount || 0,
    preferences: preferencesData as NotificationPreferences | null,
    isLoading: notificationsData === undefined,
    isPushSupported,
    isPushEnabled,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    enablePushNotifications,
    disablePushNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper function to convert Base64 to Uint8Array (for VAPID key)
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
