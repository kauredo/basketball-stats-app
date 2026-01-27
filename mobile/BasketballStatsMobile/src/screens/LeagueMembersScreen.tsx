import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon, { type IconName } from "../components/Icon";
import { getErrorMessage } from "@basketball-stats/shared";

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

const roleConfig: Record<
  string,
  { icon: IconName; color: string; bgColor: string; darkBgColor: string }
> = {
  owner: {
    icon: "trophy",
    color: "#F59E0B",
    bgColor: "bg-amber-100",
    darkBgColor: "dark:bg-amber-900/30",
  },
  admin: {
    icon: "settings",
    color: "#8B5CF6",
    bgColor: "bg-purple-100",
    darkBgColor: "dark:bg-purple-900/30",
  },
  coach: {
    icon: "users",
    color: "#3B82F6",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-900/30",
  },
  scorekeeper: {
    icon: "list",
    color: "#10B981",
    bgColor: "bg-green-100",
    darkBgColor: "dark:bg-green-900/30",
  },
  member: {
    icon: "user",
    color: "#6B7280",
    bgColor: "bg-surface-100",
    darkBgColor: "dark:bg-surface-700",
  },
  viewer: {
    icon: "eye",
    color: "#9CA3AF",
    bgColor: "bg-surface-100",
    darkBgColor: "dark:bg-surface-700",
  },
};

const roleOptions = [
  { value: "admin", label: "Admin", description: "Full league management access" },
  { value: "coach", label: "Coach", description: "Manage teams and record stats" },
  { value: "scorekeeper", label: "Scorekeeper", description: "Record game stats" },
  { value: "member", label: "Member", description: "Basic league access" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
];

export default function LeagueMembersScreen() {
  const { token, selectedLeague, user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isUpdating, setIsUpdating] = useState(false);

  const canManage =
    selectedLeague?.role === "admin" ||
    selectedLeague?.role === "owner" ||
    selectedLeague?.membership?.role === "admin" ||
    selectedLeague?.membership?.role === "owner";

  const membersData = useQuery(
    api.leagues.getMembers,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const leagueData = useQuery(
    api.leagues.get,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const updateMemberRole = useMutation(api.leagues.updateMemberRole);
  const removeMember = useMutation(api.leagues.removeMember);

  if (!membersData || !leagueData) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-900">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-surface-600 dark:text-surface-400 mt-4">Loading members...</Text>
      </View>
    );
  }

  const members = membersData.members;
  const league = leagueData.league;

  // Add owner to the list if not already there
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

  // Sort members by role hierarchy
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

  const canEditMember = (member: Member) => {
    if (!canManage) return false;
    if (member.role === "owner") return false;
    if (member.user?.id === user?.id) return false;
    return true;
  };

  const canRemoveMember = (member: Member) => {
    if (!canManage) return false;
    if (member.role === "owner") return false;
    if (member.user?.id === user?.id) return false;
    return true;
  };

  const handleChangeRole = (member: Member) => {
    Alert.alert("Change Role", `Select a new role for ${member.user?.name}`, [
      ...roleOptions.map((role) => ({
        text: `${role.label}${member.role === role.value ? " (current)" : ""}`,
        onPress: async () => {
          if (member.role === role.value) return;
          setIsUpdating(true);
          try {
            await updateMemberRole({
              token: token!,
              leagueId: selectedLeague!.id,
              membershipId: member.id,
              newRole: role.value as "admin" | "coach" | "scorekeeper" | "member" | "viewer",
            });
            Alert.alert("Success", `Role updated to ${role.label}`);
          } catch (error) {
            Alert.alert("Error", getErrorMessage(error, "Failed to update role"));
          } finally {
            setIsUpdating(false);
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRemoveMember = (member: Member) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.user?.name} from the league?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await removeMember({
                token: token!,
                leagueId: selectedLeague!.id,
                membershipId: member.id,
              });
              Alert.alert("Success", `${member.user?.name} has been removed`);
            } catch (error) {
              Alert.alert("Error", getErrorMessage(error, "Failed to remove member"));
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleMemberAction = (member: Member) => {
    if (!canEditMember(member) && !canRemoveMember(member)) return;

    const options: { text: string; onPress?: () => void; style?: "cancel" | "destructive" }[] = [];

    if (canEditMember(member)) {
      options.push({
        text: "Change Role",
        onPress: () => handleChangeRole(member),
      });
    }

    if (canRemoveMember(member)) {
      options.push({
        text: "Remove from League",
        style: "destructive",
        onPress: () => handleRemoveMember(member),
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(member.user?.name || "Member", member.user?.email || "", options);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderMember = ({ item: member }: { item: Member }) => {
    const config = roleConfig[member.role] || roleConfig.member;
    const isCurrentUser = member.user?.id === user?.id;
    const canInteract = canEditMember(member) || canRemoveMember(member);

    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 mx-4 mb-2 rounded-xl border ${
          isCurrentUser
            ? "border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10"
            : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
        }`}
        onPress={() => canInteract && handleMemberAction(member)}
        disabled={!canInteract || isUpdating}
        accessibilityRole="button"
        accessibilityLabel={`${member.user?.name}, ${member.displayRole}`}
        accessibilityHint={canInteract ? "Double tap to manage member" : undefined}
      >
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center mr-3">
          <Text className="text-white font-bold text-lg">
            {member.user?.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-surface-900 dark:text-white font-medium text-base">
              {member.user?.name}
            </Text>
            {isCurrentUser && (
              <View className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <Text className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                  You
                </Text>
              </View>
            )}
          </View>
          <Text className="text-surface-500 dark:text-surface-400 text-sm" numberOfLines={1}>
            {member.user?.email}
          </Text>
          {member.joinedAt && (
            <Text className="text-surface-400 dark:text-surface-500 text-xs mt-0.5">
              Joined {formatDate(member.joinedAt)}
            </Text>
          )}
        </View>

        {/* Role badge */}
        <View
          className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${config.bgColor} ${config.darkBgColor}`}
        >
          <Icon name={config.icon} size={14} color={config.color} />
          <Text className="text-sm font-medium ml-1.5" style={{ color: config.color }}>
            {member.displayRole}
          </Text>
        </View>

        {/* Chevron for actionable items */}
        {canInteract && (
          <View className="ml-2">
            <Icon name="chevron-right" size={16} color={isDark ? "#6B7280" : "#9CA3AF"} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header info */}
      <View className="px-4 py-3 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <Text className="text-surface-600 dark:text-surface-400 text-sm">
          {sortedMembers.length} member{sortedMembers.length !== 1 ? "s" : ""} in {league.name}
        </Text>
        {!canManage && (
          <Text className="text-blue-600 dark:text-blue-400 text-xs mt-1">
            Contact an admin to manage members
          </Text>
        )}
      </View>

      {/* Loading overlay */}
      {isUpdating && (
        <View className="absolute inset-0 bg-black/30 z-50 items-center justify-center">
          <View className="bg-white dark:bg-surface-800 rounded-xl p-4">
            <ActivityIndicator size="small" color="#F97316" />
            <Text className="text-surface-900 dark:text-white mt-2">Updating...</Text>
          </View>
        </View>
      )}

      {/* Members list */}
      <FlatList
        data={sortedMembers}
        keyExtractor={(item) => item.id || item.user?.id || Math.random().toString()}
        renderItem={renderMember}
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Icon name="users" size={48} color={isDark ? "#6B7280" : "#9CA3AF"} />
            <Text className="text-surface-600 dark:text-surface-400 mt-4 text-base">
              No members yet
            </Text>
            <Text className="text-surface-500 dark:text-surface-500 text-sm mt-1">
              Share your invite code to add members
            </Text>
          </View>
        }
      />
    </View>
  );
}
