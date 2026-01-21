import React, { createContext, useContext, useCallback } from "react";
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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: Id<"notifications">) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: Id<"notifications">) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, selectedLeague } = useAuth();

  // Queries
  const notificationsData = useQuery(
    api.notifications.getNotifications,
    token ? { token, leagueId: selectedLeague?.id, limit: 50 } : "skip"
  );

  // Mutations
  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);

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
    markAsRead,
    markAllAsRead,
    deleteNotification,
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
