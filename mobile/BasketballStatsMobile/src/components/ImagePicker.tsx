import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import * as ImagePickerLib from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import Icon from "./Icon";

interface ImagePickerProps {
  currentImageUrl?: string;
  onImageUploaded: (storageId: Id<"_storage">) => void;
  onImageCleared?: () => void;
  label?: string;
  placeholder?: string;
}

export default function ImagePicker({
  currentImageUrl,
  onImageUploaded,
  onImageCleared,
  label = "Logo",
  placeholder = "Tap to add logo",
}: ImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePickerLib.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePickerLib.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Please grant camera and photo library permissions to upload images."
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera: boolean) => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    const options: ImagePickerLib.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    let result;
    if (useCamera) {
      result = await ImagePickerLib.launchCameraAsync(options);
    } else {
      result = await ImagePickerLib.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    setPreviewUri(uri);

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Fetch the image as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Convex
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": blob.type || "image/jpeg",
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await uploadResponse.json();
      onImageUploaded(storageId as Id<"_storage">);
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Failed to upload image");
      setPreviewUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const showOptions = () => {
    if (Platform.OS === "ios") {
      const options = ["Take Photo", "Choose from Library", "Cancel"];
      if (currentImageUrl || previewUri) {
        options.splice(2, 0, "Remove Image");
      }

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: options.includes("Remove Image") ? 2 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            pickImage(true);
          } else if (buttonIndex === 1) {
            pickImage(false);
          } else if (options[buttonIndex] === "Remove Image") {
            handleClearImage();
          }
        }
      );
    } else {
      // Android - use Alert
      const buttons: any[] = [
        { text: "Take Photo", onPress: () => pickImage(true) },
        { text: "Choose from Library", onPress: () => pickImage(false) },
      ];

      if (currentImageUrl || previewUri) {
        buttons.push({
          text: "Remove Image",
          style: "destructive",
          onPress: handleClearImage,
        });
      }

      buttons.push({ text: "Cancel", style: "cancel" });

      Alert.alert("Select Image", undefined, buttons);
    }
  };

  const handleClearImage = () => {
    setPreviewUri(null);
    onImageCleared?.();
  };

  const displayUrl = previewUri || currentImageUrl;

  return (
    <View className="mb-4">
      <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">
        {label} (optional)
      </Text>
      <TouchableOpacity
        onPress={showOptions}
        disabled={isUploading}
        className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 items-center justify-center"
        style={{ minHeight: 120 }}
      >
        {isUploading ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-surface-500 dark:text-surface-400 text-sm mt-2">
              Uploading...
            </Text>
          </View>
        ) : displayUrl ? (
          <View className="items-center">
            <Image
              source={{ uri: displayUrl }}
              className="w-20 h-20 rounded-xl"
              resizeMode="cover"
            />
            <Text className="text-primary-500 text-sm mt-2">Tap to change</Text>
          </View>
        ) : (
          <View className="items-center">
            <View className="w-16 h-16 bg-surface-100 dark:bg-surface-600 rounded-xl items-center justify-center">
              <Icon name="basketball" size={32} color="#a69f96" />
            </View>
            <Text className="text-surface-500 dark:text-surface-400 text-sm mt-2">
              {placeholder}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
