"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Type for subscription data from database
interface PushSubscriptionData {
  _id: Id<"pushSubscriptions">;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Types for web-push library
interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface WebPushSendResult {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
}

interface WebPushModule {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (
    subscription: WebPushSubscription,
    payload?: string | null
  ) => Promise<WebPushSendResult>;
}

// ============================================
// Send Push Notification Action (Node.js runtime)
// ============================================

// Send push notification to a user
// Requires VAPID keys to be configured in environment:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (mailto: or https:// URL)
//
// To generate VAPID keys: npx web-push generate-vapid-keys
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    tag: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ sent: number; message: string }> => {
    // Check if VAPID keys are configured
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.log("Push notifications not configured - VAPID keys missing");
      return { sent: 0, message: "Push notifications not configured" };
    }

    // Get user's push subscriptions
    const subscriptions: PushSubscriptionData[] = await ctx.runQuery(
      internal.notifications.getUserPushSubscriptions,
      { userId: args.userId }
    );

    if (subscriptions.length === 0) {
      return { sent: 0, message: "No push subscriptions for user" };
    }

    // Dynamically import web-push (needs to be installed: npm install web-push)
    let webpush: WebPushModule;
    try {
      // Dynamic import - web-push may not be installed
      // @ts-ignore - web-push types may not be installed
      const webpushModule = (await import("web-push")) as unknown as WebPushModule;
      webpush = webpushModule;
    } catch (_e) {
      console.error("web-push package not installed");
      return { sent: 0, message: "web-push package not installed" };
    }

    // Configure web-push with VAPID details
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url,
      tag: args.tag,
      data: args.data,
      icon: "/icon-192.png",
      badge: "/badge.png",
      timestamp: Date.now(),
    });

    // Send to all subscriptions
    const results: PromiseSettledResult<WebPushSendResult>[] = await Promise.allSettled(
      subscriptions.map((sub: PushSubscriptionData) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    // Clean up failed subscriptions (410 Gone means subscription expired)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        const error = result.reason as { statusCode?: number };
        if (error?.statusCode === 410) {
          await ctx.runMutation(internal.notifications.deletePushSubscription, {
            subscriptionId: subscriptions[i]._id,
          });
        }
      }
    }

    const successCount: number = results.filter(
      (r: PromiseSettledResult<WebPushSendResult>) => r.status === "fulfilled"
    ).length;
    return {
      sent: successCount,
      message: `Sent to ${successCount} of ${subscriptions.length} subscriptions`,
    };
  },
});

// Send push notification to all league members
export const sendPushToLeagueMembers = action({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    notificationType: v.string(),
  },
  handler: async (ctx, args) => {
    // This would query league members and send to each
    // For now, create in-app notifications (which already works)
    // and attempt push for users who have enabled it

    console.log(`Would send push to league ${args.leagueId}: ${args.title}`);
    return { message: "Push to league members - requires member iteration" };
  },
});
