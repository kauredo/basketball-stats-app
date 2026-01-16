import React, { useState, useRef, useEffect } from "react";
import { BellIcon, CheckIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import { useNotifications } from "../contexts/NotificationContext";
import { Id } from "../../../../convex/_generated/dataModel";

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "game_reminder":
        return "clock";
      case "game_start":
        return "play";
      case "game_end":
        return "flag";
      case "score_update":
        return "chart";
      case "team_update":
        return "users";
      case "league_announcement":
        return "megaphone";
      default:
        return "bell";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "game_reminder":
        return "text-blue-400";
      case "game_start":
        return "text-green-400";
      case "game_end":
        return "text-purple-400";
      case "score_update":
        return "text-yellow-400";
      case "team_update":
        return "text-orange-400";
      case "league_announcement":
        return "text-pink-400";
      default:
        return "text-gray-400";
    }
  };

  const handleNotificationClick = async (notification: { _id: Id<"notifications">; read: boolean }) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    // TODO: Navigate to relevant page based on notification.data
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-orange-500" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                <p className="text-gray-400">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  You'll see game updates and announcements here
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`relative px-4 py-3 hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-gray-700/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Unread indicator */}
                      {!notification.read && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500" />
                      )}

                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        <span className="text-sm">
                          {notification.type === "game_reminder" && "⏰"}
                          {notification.type === "game_start" && "▶️"}
                          {notification.type === "game_end" && "🏁"}
                          {notification.type === "score_update" && "📊"}
                          {notification.type === "team_update" && "👥"}
                          {notification.type === "league_announcement" && "📢"}
                          {notification.type === "system" && "⚙️"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            notification.read ? "text-gray-300" : "text-white"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-400 line-clamp-2">{notification.body}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex space-x-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-700 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
