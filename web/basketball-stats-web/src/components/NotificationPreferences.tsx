import React, { useState, useEffect } from "react";
import {
  BellIcon,
  BellSlashIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../contexts/NotificationContext";

const NotificationPreferences: React.FC = () => {
  const {
    preferences,
    isPushSupported,
    isPushEnabled,
    updatePreferences,
    enablePushNotifications,
    disablePushNotifications,
  } = useNotifications();

  const [localPrefs, setLocalPrefs] = useState({
    gameReminders: true,
    gameStart: true,
    gameEnd: true,
    scoreUpdates: false,
    teamUpdates: true,
    leagueAnnouncements: true,
    reminderMinutesBefore: 30,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Load preferences when available
  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        gameReminders: preferences.gameReminders,
        gameStart: preferences.gameStart,
        gameEnd: preferences.gameEnd,
        scoreUpdates: preferences.scoreUpdates,
        teamUpdates: preferences.teamUpdates,
        leagueAnnouncements: preferences.leagueAnnouncements,
        reminderMinutesBefore: preferences.reminderMinutesBefore || 30,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof typeof localPrefs) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReminderTimeChange = (minutes: number) => {
    setLocalPrefs((prev) => ({
      ...prev,
      reminderMinutesBefore: minutes,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updatePreferences(localPrefs);
      setSaveMessage({ type: "success", text: "Preferences saved successfully!" });
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to save preferences. Please try again." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handlePushToggle = async () => {
    if (isPushEnabled) {
      await disablePushNotifications();
    } else {
      const success = await enablePushNotifications();
      if (!success) {
        setSaveMessage({
          type: "error",
          text: "Push notifications require additional server configuration. In-app notifications are still available.",
        });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    }
  };

  const PreferenceToggle: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
  }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
          checked ? "bg-orange-600" : "bg-gray-600"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
        <BellIcon className="w-5 h-5 mr-2 text-orange-500" />
        Notification Preferences
      </h3>

      {/* Push Notifications Section */}
      <div className="mb-6 pb-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-white">Push Notifications</p>
              <p className="text-xs text-gray-400">
                {isPushSupported
                  ? isPushEnabled
                    ? "Enabled - You'll receive notifications even when the app is closed"
                    : "Receive notifications on your device"
                  : "Not supported in this browser"}
              </p>
            </div>
          </div>
          {isPushSupported && (
            <button
              onClick={handlePushToggle}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPushEnabled
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {isPushEnabled ? "Disable" : "Enable"}
            </button>
          )}
        </div>
      </div>

      {/* In-App Notification Preferences */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-gray-300 mb-4">Notification Types</h4>

        <PreferenceToggle
          label="Game Reminders"
          description="Get notified before games start"
          checked={localPrefs.gameReminders}
          onChange={() => handleToggle("gameReminders")}
        />

        {localPrefs.gameReminders && (
          <div className="ml-4 mb-3 flex items-center space-x-3">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <select
              value={localPrefs.reminderMinutesBefore}
              onChange={(e) => handleReminderTimeChange(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>
        )}

        <PreferenceToggle
          label="Game Start"
          description="When a game begins"
          checked={localPrefs.gameStart}
          onChange={() => handleToggle("gameStart")}
        />

        <PreferenceToggle
          label="Game End"
          description="When a game finishes with final score"
          checked={localPrefs.gameEnd}
          onChange={() => handleToggle("gameEnd")}
        />

        <PreferenceToggle
          label="Score Updates"
          description="Major score updates during games"
          checked={localPrefs.scoreUpdates}
          onChange={() => handleToggle("scoreUpdates")}
        />

        <PreferenceToggle
          label="Team Updates"
          description="Roster changes and team announcements"
          checked={localPrefs.teamUpdates}
          onChange={() => handleToggle("teamUpdates")}
        />

        <PreferenceToggle
          label="League Announcements"
          description="Important league-wide updates"
          checked={localPrefs.leagueAnnouncements}
          onChange={() => handleToggle("leagueAnnouncements")}
        />
      </div>

      {/* Save Button */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        {saveMessage && (
          <div
            className={`mb-4 px-4 py-2 rounded-lg text-sm ${
              saveMessage.type === "success"
                ? "bg-green-900/50 text-green-400"
                : "bg-red-900/50 text-red-400"
            }`}
          >
            {saveMessage.text}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
