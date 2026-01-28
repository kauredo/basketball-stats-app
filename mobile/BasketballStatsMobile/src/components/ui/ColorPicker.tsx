import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { TEAM_COLOR_PALETTE, isLightColor } from "@basketball-stats/shared";
import Icon from "../Icon";

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const selectedColor = value?.toUpperCase();

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
          {label}
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ gap: 8 }}
      >
        {TEAM_COLOR_PALETTE.map((color) => {
          const isSelected = selectedColor === color.hex.toUpperCase();
          const textColor = isLightColor(color.hex) ? "#000000" : "#ffffff";

          return (
            <TouchableOpacity
              key={color.hex}
              onPress={() => onChange(color.hex)}
              className={`w-10 h-10 rounded-xl items-center justify-center ${
                isSelected ? "border-2" : "border border-surface-300 dark:border-surface-600"
              }`}
              style={{
                backgroundColor: color.hex,
                borderColor: isSelected ? textColor : undefined,
              }}
              accessibilityLabel={`Select ${color.name} color`}
              accessibilityState={{ selected: isSelected }}
            >
              {isSelected && <Icon name="stats" size={18} color={textColor} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {value && (
        <View className="flex-row items-center gap-2 mt-2">
          <View
            className="w-4 h-4 rounded border border-surface-300 dark:border-surface-600"
            style={{ backgroundColor: value }}
          />
          <Text className="text-xs text-surface-500 font-mono">{value.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}
