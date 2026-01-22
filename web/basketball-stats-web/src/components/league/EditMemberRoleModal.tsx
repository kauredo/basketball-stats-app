import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { getErrorMessage } from "../../utils/error";
import {
  XMarkIcon,
  ShieldCheckIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface Member {
  id: Id<"leagueMemberships">;
  role: string;
  user: {
    id: Id<"users">;
    name: string;
    email: string;
  } | null;
}

interface EditMemberRoleModalProps {
  member: Member;
  onClose: () => void;
  onSuccess: () => void;
}

const roleOptions = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access to manage league settings, teams, and members",
    icon: ShieldCheckIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    value: "coach",
    label: "Coach",
    description: "Can manage teams and record stats during games",
    icon: UsersIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    value: "scorekeeper",
    label: "Scorekeeper",
    description: "Can record stats during games",
    icon: ClipboardDocumentCheckIcon,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    value: "member",
    label: "Member",
    description: "Basic access to view league data",
    icon: UserIcon,
    color: "text-surface-500",
    bgColor: "bg-surface-100 dark:bg-surface-700",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to league information",
    icon: EyeIcon,
    color: "text-surface-400",
    bgColor: "bg-surface-100 dark:bg-surface-700",
  },
];

export default function EditMemberRoleModal({
  member,
  onClose,
  onSuccess,
}: EditMemberRoleModalProps) {
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState(member.role);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateMemberRole = useMutation(api.leagues.updateMemberRole);

  const handleSubmit = async () => {
    if (!token || !selectedLeague || selectedRole === member.role) return;

    setIsUpdating(true);
    try {
      await updateMemberRole({
        token,
        leagueId: selectedLeague.id,
        membershipId: member.id,
        newRole: selectedRole as "admin" | "coach" | "scorekeeper" | "member" | "viewer",
      });
      toast.success(`Role updated to ${selectedRole}`);
      onSuccess();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update role");
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-700 animate-scale-in shadow-elevated">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-surface-900 dark:text-white">Change Role</h3>
          <button
            onClick={onClose}
            className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Member info */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
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
            <div className="font-medium text-surface-900 dark:text-white">{member.user?.name}</div>
            <div className="text-sm text-surface-500 dark:text-surface-400">
              {member.user?.email}
            </div>
          </div>
        </div>

        {/* Role options */}
        <div className="space-y-2 mb-6">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500"
                }`}
              >
                <div className={`p-2 rounded-lg ${role.bgColor}`}>
                  <Icon className={`w-5 h-5 ${role.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-surface-900 dark:text-white">{role.label}</div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">
                    {role.description}
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-primary-500 bg-primary-500"
                      : "border-surface-300 dark:border-surface-500"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-4 py-2 rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating || selectedRole === member.role}
            className="btn-primary px-4 py-2 rounded-xl"
          >
            {isUpdating ? "Updating..." : "Update Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
