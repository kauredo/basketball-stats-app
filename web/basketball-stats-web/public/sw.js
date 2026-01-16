// Service Worker for Basketball Stats App
// Handles push notifications and caching

const CACHE_NAME = "basketball-stats-v1";

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  let data = {
    title: "Basketball Stats",
    body: "You have a new notification",
    icon: "/icon-192.png",
    badge: "/badge.png",
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error("[SW] Error parsing push data:", e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/badge.png",
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: getActionsForType(data.type),
    tag: data.tag || `notification-${Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case "game_reminder":
      return [
        { action: "view", title: "View Game", icon: "/icons/eye.png" },
        { action: "dismiss", title: "Dismiss", icon: "/icons/x.png" },
      ];
    case "game_start":
      return [
        { action: "watch", title: "Watch Live", icon: "/icons/play.png" },
        { action: "dismiss", title: "Dismiss", icon: "/icons/x.png" },
      ];
    case "game_end":
      return [
        { action: "view_stats", title: "View Stats", icon: "/icons/chart.png" },
        { action: "dismiss", title: "Dismiss", icon: "/icons/x.png" },
      ];
    default:
      return [{ action: "view", title: "View", icon: "/icons/eye.png" }];
  }
}

// Notification click event - handle user interaction
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);
  event.notification.close();

  const data = event.notification.data || {};
  let url = "/";

  // Determine URL based on action and notification data
  if (event.action === "dismiss") {
    return; // Just close the notification
  }

  if (data.gameId) {
    if (event.action === "watch" || event.action === "view") {
      url = `/games/${data.gameId}/live`;
    } else if (event.action === "view_stats") {
      url = `/games/${data.gameId}/analysis`;
    }
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Notification close event
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed");
});

// Background sync for offline support (future enhancement)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);
});

// Message event - handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
