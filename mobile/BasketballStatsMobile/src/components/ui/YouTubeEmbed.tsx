import React from "react";
import { View, Text, TouchableOpacity, Image, Linking } from "react-native";
import { extractYouTubeId, getYouTubeThumbnailUrl } from "@basketball-stats/shared";
import Icon from "../Icon";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export default function YouTubeEmbed({ url, title = "Game Video" }: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <View className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 items-center justify-center h-48">
        <Text className="text-surface-500 text-sm">Invalid YouTube URL</Text>
      </View>
    );
  }

  const thumbnailUrl = getYouTubeThumbnailUrl(videoId, "high");

  const handlePress = () => {
    Linking.openURL(url);
  };

  return (
    <View className="mb-4">
      {title && (
        <Text className="text-surface-900 dark:text-white text-base font-semibold mb-2">
          {title}
        </Text>
      )}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className="rounded-xl overflow-hidden bg-surface-900"
      >
        <View className="aspect-video relative">
          <Image
            source={{ uri: thumbnailUrl }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/30 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-red-600 items-center justify-center">
              <Icon name="play" size={32} color="#FFFFFF" />
            </View>
          </View>
          <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs font-medium">Watch on YouTube</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
