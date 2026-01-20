import React, { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (storageId: Id<"_storage">) => void;
  onImageCleared?: () => void;
  label?: string;
  placeholder?: string;
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageCleared,
  label = "Logo",
  placeholder = "Click to upload or drag and drop",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const displayUrl = previewUrl || currentImageUrl;

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploading(true);
      try {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload the file
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await response.json();
        onImageUploaded(storageId as Id<"_storage">);
      } catch (error: any) {
        console.error("Upload failed:", error);
        alert(error.message || "Failed to upload image");
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, onImageUploaded]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageCleared?.();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
          isDragging
            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500"
        } ${isUploading ? "cursor-wait" : ""}`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
          </div>
        ) : displayUrl ? (
          <div className="flex items-center justify-center py-2">
            <div className="relative">
              <img
                src={displayUrl}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Click to change</p>
              <p>or drag new image</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <PhotoIcon className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{placeholder}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
