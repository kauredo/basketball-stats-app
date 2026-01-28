import React, { useState, useEffect } from "react";
import { BaseModal, ModalHeader, ModalFooter } from "../ui/BaseModal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { Position } from "@basketball-stats/shared";
import ImageUpload from "../ImageUpload";
import type { Id } from "../../../../../convex/_generated/dataModel";

export interface PlayerFormData {
  name: string;
  number: string;
  position: Position;
  heightCm: string;
  weightKg: string;
  active?: boolean;
  email?: string;
}

export interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: PlayerFormData,
    imageStorageId?: Id<"_storage"> | null,
    clearImage?: boolean
  ) => Promise<void>;
  isSubmitting?: boolean;
  /** If provided, modal is in edit mode */
  initialData?: Partial<PlayerFormData> & { imageUrl?: string; email?: string; userId?: string };
  /** Team name to show in create mode title */
  teamName?: string;
  /** Mode determines title and button text */
  mode: "create" | "edit";
}

const POSITION_OPTIONS: { value: Position; label: string }[] = [
  { value: "PG", label: "Point Guard" },
  { value: "SG", label: "Shooting Guard" },
  { value: "SF", label: "Small Forward" },
  { value: "PF", label: "Power Forward" },
  { value: "C", label: "Center" },
];

const validatePlayerName = (name: string) => {
  if (!name.trim()) return "Player name is required";
  if (name.trim().length < 2) return "Player name must be at least 2 characters";
  return undefined;
};

const validateJerseyNumber = (number: string) => {
  if (!number) return "Jersey number is required";
  const num = parseInt(number);
  if (isNaN(num)) return "Jersey number must be a valid number";
  if (num < 0 || num > 99) return "Jersey number must be between 0 and 99";
  return undefined;
};

export function PlayerFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
  teamName,
  mode,
}: PlayerFormModalProps) {
  const [form, setForm] = useState<PlayerFormData>({
    name: "",
    number: "",
    position: "PG",
    heightCm: "",
    weightKg: "",
    active: true,
    email: "",
  });
  const [errors, setErrors] = useState<{ name?: string; number?: string }>({});
  const [pendingImageStorageId, setPendingImageStorageId] = useState<Id<"_storage"> | null>(null);
  const [clearImage, setClearImage] = useState(false);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initialData?.name || "",
        number: initialData?.number?.toString() || "",
        position: initialData?.position || "PG",
        heightCm: initialData?.heightCm?.toString() || "",
        weightKg: initialData?.weightKg?.toString() || "",
        active: initialData?.active ?? true,
        email: initialData?.email || "",
      });
      setErrors({});
      setPendingImageStorageId(null);
      setClearImage(false);
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setForm({
      name: "",
      number: "",
      position: "PG",
      heightCm: "",
      weightKg: "",
      active: true,
      email: "",
    });
    setErrors({});
    setPendingImageStorageId(null);
    setClearImage(false);
    onClose();
  };

  const handleSubmit = async () => {
    const nameError = validatePlayerName(form.name);
    const numberError = validateJerseyNumber(form.number);

    if (nameError || numberError) {
      setErrors({ name: nameError, number: numberError });
      return;
    }

    await onSubmit(form, pendingImageStorageId, clearImage);
  };

  const title =
    mode === "create" ? `Add Player${teamName ? ` to ${teamName}` : ""}` : "Edit Player";

  const submitText = mode === "create" ? "Add Player" : "Save Changes";
  const submittingText = mode === "create" ? "Adding..." : "Saving...";

  const isFormValid = form.name.trim() && form.number && !errors.name && !errors.number;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <ModalHeader title={title} />

      <div className="p-6 space-y-4">
        {/* Player Name */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Player Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: validatePlayerName(e.target.value) }));
              }
            }}
            onBlur={(e) =>
              setErrors((prev) => ({ ...prev, name: validatePlayerName(e.target.value) }))
            }
            className={`w-full bg-surface-100 dark:bg-surface-700 border rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-surface-300 dark:border-surface-600"
            }`}
            placeholder="Enter player name"
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Jersey Number & Position */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Jersey # <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.number}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, number: e.target.value }));
                if (errors.number) {
                  setErrors((prev) => ({ ...prev, number: validateJerseyNumber(e.target.value) }));
                }
              }}
              onBlur={(e) =>
                setErrors((prev) => ({ ...prev, number: validateJerseyNumber(e.target.value) }))
              }
              className={`w-full bg-surface-100 dark:bg-surface-700 border rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.number
                  ? "border-red-500 focus:ring-red-500"
                  : "border-surface-300 dark:border-surface-600"
              }`}
              placeholder="00"
              min="0"
              max="99"
            />
            {errors.number && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.number}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Position <span className="text-red-500">*</span>
            </label>
            <select
              value={form.position}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, position: e.target.value as Position }))
              }
              className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              value={form.heightCm}
              onChange={(e) => setForm((prev) => ({ ...prev, heightCm: e.target.value }))}
              className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="183"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              value={form.weightKg}
              onChange={(e) => setForm((prev) => ({ ...prev, weightKg: e.target.value }))}
              className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="82"
            />
          </div>
        </div>

        {/* Email (for user account linking) */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Email
            <span className="text-surface-500 font-normal ml-1">(for account linking)</span>
          </label>
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="player@example.com"
          />
          <p className="mt-1 text-xs text-surface-500">
            If the player has an account with this email, their profile will be linked automatically.
          </p>
          {initialData?.userId && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Linked to user account
            </p>
          )}
        </div>

        {/* Active Status (edit mode only) */}
        {mode === "edit" && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activeStatus"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 rounded"
            />
            <label
              htmlFor="activeStatus"
              className="ml-2 block text-sm text-surface-700 dark:text-surface-300"
            >
              Active player
            </label>
          </div>
        )}

        {/* Image Upload (edit mode only for now, can be extended) */}
        {mode === "edit" && (
          <ImageUpload
            currentImageUrl={clearImage ? undefined : initialData?.imageUrl}
            onImageUploaded={(storageId) => {
              setPendingImageStorageId(storageId);
              setClearImage(false);
            }}
            onImageCleared={() => {
              setPendingImageStorageId(null);
              setClearImage(true);
            }}
            label="Player Photo"
            placeholder="Click to upload player photo"
          />
        )}
      </div>

      <ModalFooter align="right">
        <button onClick={handleClose} className="btn-secondary px-4 py-2 rounded-xl">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="btn-primary px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? submittingText : submitText}
        </button>
      </ModalFooter>
    </BaseModal>
  );
}

export default PlayerFormModal;
