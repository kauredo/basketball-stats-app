import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  LinkIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

export default function InviteCodeSection() {
  const { token, selectedLeague } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const inviteData = useQuery(
    api.leagues.getInviteCode,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const handleCopyCode = async () => {
    if (!inviteData?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteData.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyUrl = async () => {
    if (!inviteData?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteData.inviteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!inviteData) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
          <QrCodeIcon className="w-8 h-8 text-primary-500" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
          Invite Others to Join
        </h3>
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Share the invite code or link below to let others join your league
        </p>
      </div>

      {/* Invite Code */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Invite Code
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 font-mono text-surface-900 dark:text-white">
            {inviteData.inviteCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 border border-surface-200 dark:border-surface-600 rounded-xl transition-colors"
            title="Copy invite code"
          >
            {copiedCode ? (
              <>
                <CheckIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">Copied</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                <span className="text-sm text-surface-600 dark:text-surface-400">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invite URL */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Invite Link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-sm text-surface-600 dark:text-surface-400 truncate">
            <LinkIcon className="w-4 h-4 inline-block mr-2" />
            {inviteData.inviteUrl}
          </div>
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
            title="Copy invite link"
          >
            {copiedUrl ? (
              <>
                <CheckIcon className="w-5 h-5" />
                <span className="text-sm">Copied</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="w-5 h-5" />
                <span className="text-sm">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
        <h4 className="text-sm font-medium text-surface-900 dark:text-white mb-2">How it works</h4>
        <ul className="text-sm text-surface-600 dark:text-surface-400 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-medium">1.</span>
            Share the invite code or link with others
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-medium">2.</span>
            They enter the code on the league selection screen
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-medium">3.</span>
            They instantly join as a member of your league
          </li>
        </ul>
      </div>
    </div>
  );
}
