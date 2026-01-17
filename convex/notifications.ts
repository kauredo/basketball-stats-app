import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// Push Subscription Management
// ============================================

// Subscribe to push notifications
export const subscribeToPush = mutation({
  args: {
    token: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    // Check if subscription already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        userId: session.userId,
        p256dh: args.p256dh,
        auth: args.auth,
        userAgent: args.userAgent,
      });
      return existing._id;
    }

    // Create new subscription
    return await ctx.db.insert("pushSubscriptions", {
      userId: session.userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
      userAgent: args.userAgent,
    });
  },
});

// Unsubscribe from push notifications
export const unsubscribeFromPush = mutation({
  args: {
    token: v.string(),
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription && subscription.userId === session.userId) {
      await ctx.db.delete(subscription._id);
    }
  },
});

// Get user's push subscriptions
export const getPushSubscriptions = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();
  },
});

// ============================================
// Notification Preferences
// ============================================

// Get notification preferences
export const getPreferences = query({
  args: {
    token: v.string(),
    leagueId: v.optional(v.id("leagues")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    // Try to find league-specific preferences first
    if (args.leagueId) {
      const leaguePrefs = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user_league", (q) =>
          q.eq("userId", session.userId).eq("leagueId", args.leagueId)
        )
        .first();

      if (leaguePrefs) {
        return leaguePrefs;
      }
    }

    // Fall back to global preferences
    const globalPrefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .filter((q) => q.eq(q.field("leagueId"), undefined))
      .first();

    // Return defaults if no preferences exist
    if (!globalPrefs) {
      return {
        gameReminders: true,
        gameStart: true,
        gameEnd: true,
        scoreUpdates: false,
        teamUpdates: true,
        leagueAnnouncements: true,
        reminderMinutesBefore: 30,
      };
    }

    return globalPrefs;
  },
});

// Update notification preferences
export const updatePreferences = mutation({
  args: {
    token: v.string(),
    leagueId: v.optional(v.id("leagues")),
    gameReminders: v.boolean(),
    gameStart: v.boolean(),
    gameEnd: v.boolean(),
    scoreUpdates: v.boolean(),
    teamUpdates: v.boolean(),
    leagueAnnouncements: v.boolean(),
    reminderMinutesBefore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    // Check if preferences exist
    const existing = args.leagueId
      ? await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user_league", (q) =>
            q.eq("userId", session.userId).eq("leagueId", args.leagueId)
          )
          .first()
      : await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", session.userId))
          .filter((q) => q.eq(q.field("leagueId"), undefined))
          .first();

    const prefs = {
      userId: session.userId,
      leagueId: args.leagueId,
      gameReminders: args.gameReminders,
      gameStart: args.gameStart,
      gameEnd: args.gameEnd,
      scoreUpdates: args.scoreUpdates,
      teamUpdates: args.teamUpdates,
      leagueAnnouncements: args.leagueAnnouncements,
      reminderMinutesBefore: args.reminderMinutesBefore,
    };

    if (existing) {
      await ctx.db.patch(existing._id, prefs);
      return existing._id;
    }

    return await ctx.db.insert("notificationPreferences", prefs);
  },
});

// ============================================
// In-App Notifications
// ============================================

// Get user's notifications
export const getNotifications = query({
  args: {
    token: v.string(),
    leagueId: v.optional(v.id("leagues")),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return { notifications: [], unreadCount: 0 };
    }

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .order("desc");

    let notifications = await query.collect();

    // Filter by league if specified
    if (args.leagueId) {
      notifications = notifications.filter((n) => n.leagueId === args.leagueId || !n.leagueId);
    }

    // Filter by unread if specified
    if (args.unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    // Filter expired notifications
    const now = Date.now();
    notifications = notifications.filter((n) => !n.expiresAt || n.expiresAt > now);

    // Count unread
    const unreadCount = notifications.filter((n) => !n.read).length;

    // Apply limit
    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }

    return {
      notifications,
      unreadCount,
    };
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    token: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== session.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {
    token: v.string(),
    leagueId: v.optional(v.id("leagues")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", session.userId).eq("read", false))
      .collect();

    if (args.leagueId) {
      notifications = notifications.filter((n) => n.leagueId === args.leagueId || !n.leagueId);
    }

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return notifications.length;
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: {
    token: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== session.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.notificationId);
  },
});

// ============================================
// Create Notifications (internal use)
// ============================================

// Create a notification for a user
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    leagueId: v.optional(v.id("leagues")),
    type: v.union(
      v.literal("game_reminder"),
      v.literal("game_start"),
      v.literal("game_end"),
      v.literal("score_update"),
      v.literal("team_update"),
      v.literal("league_announcement"),
      v.literal("system")
    ),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      leagueId: args.leagueId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data,
      read: false,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

// Create notifications for all league members
export const notifyLeagueMembers = mutation({
  args: {
    leagueId: v.id("leagues"),
    type: v.union(
      v.literal("game_reminder"),
      v.literal("game_start"),
      v.literal("game_end"),
      v.literal("score_update"),
      v.literal("team_update"),
      v.literal("league_announcement"),
      v.literal("system")
    ),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all active league members
    const memberships = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_league_status", (q) => q.eq("leagueId", args.leagueId).eq("status", "active"))
      .collect();

    const notificationIds: Id<"notifications">[] = [];

    // Check each member's preferences and create notifications
    for (const membership of memberships) {
      // Check user's notification preferences
      const prefs = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user_league", (q) =>
          q.eq("userId", membership.userId).eq("leagueId", args.leagueId)
        )
        .first();

      // Determine if user wants this type of notification
      let shouldNotify = true;
      if (prefs) {
        switch (args.type) {
          case "game_reminder":
            shouldNotify = prefs.gameReminders;
            break;
          case "game_start":
            shouldNotify = prefs.gameStart;
            break;
          case "game_end":
            shouldNotify = prefs.gameEnd;
            break;
          case "score_update":
            shouldNotify = prefs.scoreUpdates;
            break;
          case "team_update":
            shouldNotify = prefs.teamUpdates;
            break;
          case "league_announcement":
            shouldNotify = prefs.leagueAnnouncements;
            break;
          case "system":
            shouldNotify = true; // Always send system notifications
            break;
        }
      }

      if (shouldNotify) {
        const id = await ctx.db.insert("notifications", {
          userId: membership.userId,
          leagueId: args.leagueId,
          type: args.type,
          title: args.title,
          body: args.body,
          data: args.data,
          read: false,
          createdAt: Date.now(),
          expiresAt: args.expiresAt,
        });
        notificationIds.push(id);
      }
    }

    return notificationIds;
  },
});

// ============================================
// Push Notification Sending
// ============================================

// TODO: Implement actual push notification sending
// This requires a server-side action with web-push library
//
// To implement web push notifications:
// 1. Install web-push: npm install web-push
// 2. Generate VAPID keys: npx web-push generate-vapid-keys
// 3. Store VAPID keys in Convex environment variables:
//    - VAPID_PUBLIC_KEY
//    - VAPID_PRIVATE_KEY
//    - VAPID_SUBJECT (mailto: or https:// URL)
// 4. Create a Convex action that uses web-push to send notifications
//
// Example action (uncomment when ready):
//
// import webpush from "web-push";
//
// export const sendPushNotification = action({
//   args: {
//     userId: v.id("users"),
//     title: v.string(),
//     body: v.string(),
//     data: v.optional(v.any()),
//   },
//   handler: async (ctx, args) => {
//     // Configure web-push with VAPID details
//     webpush.setVapidDetails(
//       process.env.VAPID_SUBJECT!,
//       process.env.VAPID_PUBLIC_KEY!,
//       process.env.VAPID_PRIVATE_KEY!
//     );
//
//     // Get user's push subscriptions
//     const subscriptions = await ctx.runQuery(internal.notifications.getUserPushSubscriptions, {
//       userId: args.userId,
//     });
//
//     const payload = JSON.stringify({
//       title: args.title,
//       body: args.body,
//       data: args.data,
//       icon: "/icon-192.png",
//       badge: "/badge.png",
//     });
//
//     // Send to all subscriptions
//     const results = await Promise.allSettled(
//       subscriptions.map((sub) =>
//         webpush.sendNotification(
//           {
//             endpoint: sub.endpoint,
//             keys: {
//               p256dh: sub.p256dh,
//               auth: sub.auth,
//             },
//           },
//           payload
//         )
//       )
//     );
//
//     // Clean up failed subscriptions (410 Gone means subscription expired)
//     for (let i = 0; i < results.length; i++) {
//       if (results[i].status === "rejected") {
//         const error = results[i].reason;
//         if (error.statusCode === 410) {
//           await ctx.runMutation(internal.notifications.deletePushSubscription, {
//             subscriptionId: subscriptions[i]._id,
//           });
//         }
//       }
//     }
//
//     return results.filter((r) => r.status === "fulfilled").length;
//   },
// });

// Get VAPID public key for client subscription
export const getVapidPublicKey = query({
  handler: async () => {
    // TODO: Return VAPID public key from environment variable
    // return process.env.VAPID_PUBLIC_KEY || null;

    // For now, return a placeholder indicating push is not configured
    return null;
  },
});
