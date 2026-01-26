import React from "react";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

export type IconName =
  // Auth & User
  | "eye"
  | "eye-off"
  | "mail"
  | "lock"
  | "user"
  | "user-plus"
  // Basketball & Sports
  | "basketball"
  | "trophy"
  | "activity"
  | "target"
  | "whistle"
  // Navigation & UI
  | "home"
  | "stats"
  | "users"
  | "games"
  | "settings"
  | "menu"
  | "back"
  | "plus"
  | "minus"
  | "edit"
  | "trash"
  | "check"
  | "check-circle"
  | "x"
  | "list"
  // Actions
  | "play"
  | "pause"
  | "stop"
  | "refresh"
  | "search"
  | "filter"
  | "undo"
  | "alarm"
  | "timer"
  | "download"
  | "rewind"
  | "fast-forward"
  | "repeat"
  // Time & Calendar
  | "calendar"
  | "clock"
  // Arrows & Directions
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "chevron-down"
  | "chevron-up"
  | "chevron-right"
  | "close"
  // Theme
  | "moon"
  | "sun"
  | "sunny"
  // Status
  | "alert"
  | "alert-triangle"
  | "info"
  | "wifi"
  | "wifi-off"
  // Documents & Data
  | "file-text"
  | "table"
  | "chart-bar"
  | "clipboard-list"
  | "flame"
  | "film"
  // Game events
  | "shield"
  | "hand"
  | "flag"
  | "disc"
  | "globe";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: object;
}

const iconMap: Record<IconName, { library: "ionicons" | "material" | "feather"; name: string }> = {
  // Auth & User
  eye: { library: "ionicons", name: "eye" },
  "eye-off": { library: "ionicons", name: "eye-off" },
  mail: { library: "ionicons", name: "mail" },
  lock: { library: "ionicons", name: "lock-closed" },
  user: { library: "ionicons", name: "person" },
  "user-plus": { library: "ionicons", name: "person-add" },

  // Basketball & Sports
  basketball: { library: "ionicons", name: "basketball" },
  trophy: { library: "ionicons", name: "trophy" },
  activity: { library: "ionicons", name: "pulse" },
  target: { library: "ionicons", name: "golf" },
  whistle: { library: "ionicons", name: "megaphone" },

  // Navigation & UI
  home: { library: "ionicons", name: "home" },
  stats: { library: "ionicons", name: "stats-chart" },
  users: { library: "ionicons", name: "people" },
  games: { library: "ionicons", name: "game-controller" },
  settings: { library: "ionicons", name: "settings" },
  menu: { library: "ionicons", name: "menu" },
  back: { library: "ionicons", name: "arrow-back" },
  plus: { library: "ionicons", name: "add" },
  minus: { library: "ionicons", name: "remove" },
  edit: { library: "ionicons", name: "create" },
  trash: { library: "ionicons", name: "trash" },
  check: { library: "ionicons", name: "checkmark" },
  "check-circle": { library: "ionicons", name: "checkmark-circle" },
  x: { library: "ionicons", name: "close" },
  list: { library: "ionicons", name: "list" },

  // Actions
  play: { library: "ionicons", name: "play" },
  pause: { library: "ionicons", name: "pause" },
  stop: { library: "ionicons", name: "stop" },
  refresh: { library: "ionicons", name: "refresh" },
  search: { library: "ionicons", name: "search" },
  filter: { library: "ionicons", name: "filter" },
  undo: { library: "ionicons", name: "arrow-undo" },
  alarm: { library: "ionicons", name: "alarm" },
  timer: { library: "ionicons", name: "timer" },
  download: { library: "ionicons", name: "download" },
  rewind: { library: "ionicons", name: "play-back" },
  "fast-forward": { library: "ionicons", name: "play-forward" },
  repeat: { library: "ionicons", name: "repeat" },

  // Time & Calendar
  calendar: { library: "ionicons", name: "calendar" },
  clock: { library: "ionicons", name: "time" },

  // Arrows & Directions
  "arrow-left": { library: "ionicons", name: "arrow-back" },
  "arrow-right": { library: "ionicons", name: "arrow-forward" },
  "arrow-up": { library: "ionicons", name: "arrow-up" },
  "arrow-down": { library: "ionicons", name: "arrow-down" },
  "chevron-down": { library: "ionicons", name: "chevron-down" },
  "chevron-up": { library: "ionicons", name: "chevron-up" },
  "chevron-right": { library: "ionicons", name: "chevron-forward" },
  close: { library: "ionicons", name: "close" },

  // Theme
  moon: { library: "ionicons", name: "moon" },
  sun: { library: "ionicons", name: "sunny" },
  sunny: { library: "ionicons", name: "sunny" },

  // Status
  alert: { library: "ionicons", name: "alert-circle" },
  "alert-triangle": { library: "ionicons", name: "warning" },
  info: { library: "ionicons", name: "information-circle" },
  wifi: { library: "ionicons", name: "wifi" },
  "wifi-off": { library: "ionicons", name: "wifi-outline" },

  // Documents & Data
  "file-text": { library: "ionicons", name: "document-text" },
  table: { library: "ionicons", name: "grid" },
  "chart-bar": { library: "ionicons", name: "bar-chart" },
  "clipboard-list": { library: "ionicons", name: "clipboard" },
  flame: { library: "ionicons", name: "flame" },
  film: { library: "ionicons", name: "film" },

  // Game events
  shield: { library: "ionicons", name: "shield" },
  hand: { library: "ionicons", name: "hand-left" },
  flag: { library: "ionicons", name: "flag" },
  disc: { library: "ionicons", name: "ellipse" },
  globe: { library: "ionicons", name: "globe" },
};

export default function Icon({ name, size = 24, color = "#7a746c", className, style }: IconProps) {
  const iconConfig = iconMap[name];

  if (!iconConfig) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const IconComponent = {
    ionicons: Ionicons,
    material: MaterialIcons,
    feather: Feather,
  }[iconConfig.library];

  return (
    <IconComponent
      name={iconConfig.name as any}
      size={size}
      color={color}
      className={className}
      style={style}
    />
  );
}
