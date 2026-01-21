import React from "react";
import { WifiIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 ${
        isOnline ? "bg-green-600 text-white" : "bg-amber-600 text-white"
      }`}
    >
      {isOnline ? (
        <>
          <CheckCircleIcon className="w-4 h-4" />
          <span>Back online - Data syncing...</span>
        </>
      ) : (
        <>
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>You&apos;re offline - Viewing cached data</span>
          <WifiIcon className="w-4 h-4 animate-pulse ml-2" />
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
