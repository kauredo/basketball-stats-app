import React from "react";
import { View, Text, StyleSheet, Platform, StatusBar } from "react-native";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import Icon from "./Icon";

// Get status bar height for Android, iOS handles it via SafeAreaView in parent
const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: STATUSBAR_HEIGHT,
          backgroundColor: isOnline ? "#16a34a" : "#d97706",
        },
      ]}
    >
      <View style={styles.content}>
        {isOnline ? (
          <>
            <Icon name="check" size={16} color="#FFFFFF" />
            <Text style={styles.text}>Back online - Data syncing...</Text>
          </>
        ) : (
          <>
            <Icon name="alert" size={16} color="#FFFFFF" />
            <Text style={styles.text}>You&apos;re offline - Viewing cached data</Text>
            <Icon name="wifi" size={16} color="#FFFFFF" style={styles.pulsingIcon} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  pulsingIcon: {
    marginLeft: 8,
  },
});

export default OfflineBanner;
