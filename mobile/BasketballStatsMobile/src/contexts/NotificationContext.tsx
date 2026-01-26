import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "./AuthContext";

// Configure notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  expoPushToken: string | null;
  pushPermissionStatus: Notifications.PermissionStatus | null;
  markAsRead: (notificationId: Id<"notifications">) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: Id<"notifications">) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Set this in your .env
    });
    return tokenData.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, selectedLeague } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [pushPermissionStatus, setPushPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  // Queries
  const notificationsData = useQuery(
    api.notifications.getNotifications,
    token ? { token, leagueId: selectedLeague?.id, limit: 50 } : "skip"
  );

  // Mutations
  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);
  const registerPushTokenMutation = useMutation(api.notifications.subscribeToPush);

  // Request push permission manually
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      setExpoPushToken(pushToken);
      setPushPermissionStatus(Notifications.PermissionStatus.GRANTED);

      // Register with backend if we have auth token
      if (token) {
        try {
          await registerPushTokenMutation({
            token,
            endpoint: pushToken,
            // Expo push tokens don't need p256dh/auth keys
            p256dh: "expo-push",
            auth: "expo-push",
            userAgent: `BasketballStats/${Platform.OS}`,
          });
        } catch (error) {
          console.error("Error registering push token:", error);
        }
      }
      return true;
    }
    return false;
  }, [token, registerPushTokenMutation]);

  // Initialize push notifications on mount
  useEffect(() => {
    // Check current permission status
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPushPermissionStatus(status);
    });

    // Set up notification channel for Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F97316",
      });
    }

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
      // The notification will be shown automatically based on the handler config
    });

    // Listen for notification interactions (taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("Notification tapped:", data);
      // Handle navigation based on notification data
      if (data?.gameId) {
        // Navigate to game - this would need navigation ref setup
        // For now, just log it
        console.log("Should navigate to game:", data.gameId);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Register token when user logs in
  useEffect(() => {
    if (
      token &&
      pushPermissionStatus === Notifications.PermissionStatus.GRANTED &&
      !expoPushToken
    ) {
      registerForPushNotificationsAsync().then((pushToken) => {
        if (pushToken) {
          setExpoPushToken(pushToken);
          registerPushTokenMutation({
            token,
            endpoint: pushToken,
            p256dh: "expo-push",
            auth: "expo-push",
            userAgent: `BasketballStats/${Platform.OS}`,
          }).catch((error) => {
            console.error("Error registering push token:", error);
          });
        }
      });
    }
  }, [token, pushPermissionStatus, expoPushToken, registerPushTokenMutation]);

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

  const value: NotificationContextType = {
    notifications: notificationsData?.notifications || [],
    unreadCount: notificationsData?.unreadCount || 0,
    isLoading: notificationsData === undefined,
    expoPushToken,
    pushPermissionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestPushPermission,
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
