import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface TeamFoulsDisplayProps {
  foulsThisQuarter: number;
  totalFouls?: number;
  showTotal?: boolean;
  size?: "small" | "medium";
}

export default function TeamFoulsDisplay({
  foulsThisQuarter,
  totalFouls = 0,
  showTotal = false,
  size = "small",
}: TeamFoulsDisplayProps) {
  const fontSize = size === "small" ? 10 : 12;
  const numberFontSize = size === "small" ? 12 : 14;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontSize }]}>TF:</Text>
      <Text style={[styles.number, { fontSize: numberFontSize }]}>
        {foulsThisQuarter}
      </Text>
      {showTotal && totalFouls > 0 && (
        <Text style={[styles.total, { fontSize: fontSize - 2 }]}>
          ({totalFouls})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  label: {
    color: "#9CA3AF",
    fontWeight: "500",
  },
  number: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  total: {
    color: "#6B7280",
    fontWeight: "400",
  },
});
