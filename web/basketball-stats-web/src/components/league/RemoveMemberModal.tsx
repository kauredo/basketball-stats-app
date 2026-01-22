import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { getErrorMessage } from "../../utils/error";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Member {
  id: Id<"leagueMemberships">;
  role: string;
  user: {
    id: Id<"users">;
    name: string;
    email: string;
  } | null;
}

interface RemoveMemberModalProps {
  member: Member;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RemoveMemberModal({ member, onClose, onSuccess }: RemoveMemberModalProps) {
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const [isRemoving, setIsRemoving] = useState(false);

  const removeMember = useMutation(api.leagues.removeMember);

  const handleRemove = async () => {
    if (!token || !selectedLeague) return;

    setIsRemoving(true);
    try {
      await removeMember({
        token,
        leagueId: selectedLeague.id,
        membershipId: member.id,
      });
      toast.success(`${member.user?.name} has been removed from the league`);
      onSuccess();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error, "Failed to remove member");
      toast.error(message);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-700 animate-scale-in shadow-elevated">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-900 dark:text-white">Remove Member</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-surface-900 dark:text-white">
              {member.user?.name}
            </span>{" "}
            from this league?
          </p>

          {/* Member info card */}
          <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600">
              <span className="text-sm font-semibold text-white">
                {member.user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-surface-900 dark:text-white">
                {member.user?.name}
              </div>
              <div className="text-sm text-surface-500 dark:text-surface-400">
                {member.user?.email} · {member.role}
              </div>
            </div>
          </div>

          <p className="text-sm text-surface-500 dark:text-surface-500 mt-4">
            This person will lose access to the league immediately. They can rejoin using an invite
            code.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary px-4 py-2 rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="btn-danger px-4 py-2 rounded-xl"
          >
            {isRemoving ? "Removing..." : "Remove Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
