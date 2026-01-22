import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "../../contexts/AuthContext";
import EditMemberRoleModal from "./EditMemberRoleModal";
import RemoveMemberModal from "./RemoveMemberModal";
import {
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

interface Member {
  id: Id<"leagueMemberships">;
  role: string;
  displayRole: string;
  status: string;
  joinedAt?: number;
  user: {
    id: Id<"users">;
    name: string;
    email: string;
  } | null;
  permissions: {
    canManageTeams: boolean;
    canRecordStats: boolean;
    canViewAnalytics: boolean;
    canManageLeague: boolean;
  };
}

const roleConfig: Record<string, { icon: typeof UserIcon; color: string; bgColor: string }> = {
  owner: {
    icon: TrophyIcon,
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  admin: {
    icon: ShieldCheckIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  coach: {
    icon: UsersIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  scorekeeper: {
    icon: ClipboardDocumentCheckIcon,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  member: {
    icon: UserIcon,
    color: "text-surface-500",
    bgColor: "bg-surface-100 dark:bg-surface-700",
  },
  viewer: {
    icon: EyeIcon,
    color: "text-surface-400",
    bgColor: "bg-surface-100 dark:bg-surface-700",
  },
};

interface MembersListProps {
  canManage: boolean;
}

export default function MembersList({ canManage }: MembersListProps) {
  const { token, selectedLeague, user } = useAuth();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

  const membersData = useQuery(
    api.leagues.getMembers,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const leagueData = useQuery(
    api.leagues.get,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  if (!membersData || !leagueData) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
      </div>
    );
  }

  const members = membersData.members;
  const league = leagueData.league;
  const isOwner = league.owner?.id === user?.id;

  // Add owner to the list if not already there (owner might not have a membership record)
  const allMembers: Member[] = [...members];
  const ownerInMembers = members.some((m) => m.user?.id === league.owner?.id);
  if (!ownerInMembers && league.owner) {
    allMembers.unshift({
      id: "" as Id<"leagueMemberships">,
      role: "owner",
      displayRole: "Owner",
      status: "active",
      user: {
        id: league.owner.id,
        name: league.owner.name,
        email: league.owner.email,
      },
      permissions: {
        canManageTeams: true,
        canRecordStats: true,
        canViewAnalytics: true,
        canManageLeague: true,
      },
    });
  }

  // Sort: owner first, then admins, then by name
  const sortedMembers = allMembers.sort((a, b) => {
    const roleOrder: Record<string, number> = {
      owner: 0,
      admin: 1,
      coach: 2,
      scorekeeper: 3,
      member: 4,
      viewer: 5,
    };
    const aOrder = roleOrder[a.role] ?? 99;
    const bOrder = roleOrder[b.role] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.user?.name || "").localeCompare(b.user?.name || "");
  });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canEditMember = (member: Member) => {
    if (!canManage) return false;
    // Cannot edit owner
    if (member.role === "owner") return false;
    // Cannot edit yourself
    if (member.user?.id === user?.id) return false;
    return true;
  };

  const canRemoveMember = (member: Member) => {
    if (!canManage) return false;
    // Cannot remove owner
    if (member.role === "owner") return false;
    // Cannot remove yourself
    if (member.user?.id === user?.id) return false;
    return true;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-surface-600 dark:text-surface-400">
          {sortedMembers.length} member{sortedMembers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {sortedMembers.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-surface-400" />
          <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
            No members
          </h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Share your invite code to add members.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedMembers.map((member) => {
            const config = roleConfig[member.role] || roleConfig.member;
            const Icon = config.icon;
            const isCurrentUser = member.user?.id === user?.id;

            return (
              <div
                key={member.id || member.user?.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isCurrentUser
                    ? "border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10"
                    : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                }`}
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0">
                  <span className="text-sm font-semibold text-white">
                    {member.user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-surface-900 dark:text-white truncate">
                      {member.user?.name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-surface-500 dark:text-surface-400 truncate">
                    {member.user?.email}
                  </div>
                </div>

                {/* Role badge */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bgColor}`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-sm font-medium ${config.color}`}>
                    {member.displayRole}
                  </span>
                </div>

                {/* Joined date - hidden on mobile */}
                {member.joinedAt && (
                  <div className="hidden md:block text-sm text-surface-500 dark:text-surface-400 w-28">
                    {formatDate(member.joinedAt)}
                  </div>
                )}

                {/* Actions */}
                {(canEditMember(member) || canRemoveMember(member)) && (
                  <div className="flex items-center gap-1">
                    {canEditMember(member) && (
                      <button
                        onClick={() => setEditingMember(member)}
                        className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        title="Change role"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                    {canRemoveMember(member) && (
                      <button
                        onClick={() => setRemovingMember(member)}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Role Modal */}
      {editingMember && (
        <EditMemberRoleModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={() => setEditingMember(null)}
        />
      )}

      {/* Remove Member Modal */}
      {removingMember && (
        <RemoveMemberModal
          member={removingMember}
          onClose={() => setRemovingMember(null)}
          onSuccess={() => setRemovingMember(null)}
        />
      )}
    </div>
  );
}
