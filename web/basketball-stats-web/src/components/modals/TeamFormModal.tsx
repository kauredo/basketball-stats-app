import React, { useState, useEffect } from "react";
import { BaseModal, ModalHeader, ModalFooter } from "../ui/BaseModal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import ImageUpload from "../ImageUpload";
import type { Id } from "../../../../../convex/_generated/dataModel";

export interface TeamFormData {
  name: string;
  city: string;
  description: string;
}

export interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: TeamFormData,
    logoStorageId?: Id<"_storage"> | null,
    clearLogo?: boolean
  ) => Promise<void>;
  isSubmitting?: boolean;
  /** If provided, modal is in edit mode */
  initialData?: Partial<TeamFormData> & { logoUrl?: string };
  /** Mode determines title and button text */
  mode: "create" | "edit";
}

const validateTeamName = (name: string) => {
  if (!name.trim()) return "Team name is required";
  if (name.trim().length < 2) return "Team name must be at least 2 characters";
  if (name.trim().length > 50) return "Team name must be less than 50 characters";
  return undefined;
};

export function TeamFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode,
}: TeamFormModalProps) {
  const [form, setForm] = useState<TeamFormData>({
    name: "",
    city: "",
    description: "",
  });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [logoStorageId, setLogoStorageId] = useState<Id<"_storage"> | null>(null);
  const [clearLogo, setClearLogo] = useState(false);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initialData?.name || "",
        city: initialData?.city || "",
        description: initialData?.description || "",
      });
      setErrors({});
      setLogoStorageId(null);
      setClearLogo(false);
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setForm({ name: "", city: "", description: "" });
    setErrors({});
    setLogoStorageId(null);
    setClearLogo(false);
    onClose();
  };

  const handleSubmit = async () => {
    const nameError = validateTeamName(form.name);

    if (nameError) {
      setErrors({ name: nameError });
      return;
    }

    await onSubmit(form, logoStorageId, clearLogo);
  };

  const title = mode === "create" ? "Create New Team" : "Edit Team";
  const submitText = mode === "create" ? "Create Team" : "Save Changes";
  const submittingText = mode === "create" ? "Creating..." : "Saving...";

  const isFormValid = form.name.trim() && !errors.name;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <ModalHeader title={title} />

      <div className="p-6 space-y-4">
        {/* Team Name */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: validateTeamName(e.target.value) }));
              }
            }}
            onBlur={(e) =>
              setErrors((prev) => ({ ...prev, name: validateTeamName(e.target.value) }))
            }
            className={`w-full bg-surface-100 dark:bg-surface-700 border rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-surface-300 dark:border-surface-600"
            }`}
            placeholder="Enter team name"
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            City
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter city (optional)"
          />
        </div>

        {/* Logo Upload */}
        <ImageUpload
          label="Team Logo"
          placeholder="Click to upload logo or drag and drop"
          currentImageUrl={clearLogo ? undefined : initialData?.logoUrl}
          onImageUploaded={(storageId) => {
            setLogoStorageId(storageId);
            setClearLogo(false);
          }}
          onImageCleared={() => {
            setLogoStorageId(null);
            setClearLogo(true);
          }}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter team description (optional)"
            rows={3}
          />
        </div>
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

export default TeamFormModal;
