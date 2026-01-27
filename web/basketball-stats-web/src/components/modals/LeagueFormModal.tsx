import React, { useState, useEffect } from "react";
import { BaseModal, ModalHeader, ModalFooter } from "../ui/BaseModal";

export type LeagueType = "professional" | "college" | "high_school" | "youth" | "recreational";

export interface LeagueFormData {
  name: string;
  description: string;
  leagueType: LeagueType;
  season: string;
  isPublic: boolean;
}

export interface LeagueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeagueFormData) => Promise<void>;
  isSubmitting?: boolean;
  /** If provided, modal is in edit mode */
  initialData?: Partial<LeagueFormData>;
  /** Mode determines title and button text */
  mode: "create" | "edit";
}

const LEAGUE_TYPES: { value: LeagueType; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "college", label: "College" },
  { value: "high_school", label: "High School" },
  { value: "youth", label: "Youth" },
  { value: "recreational", label: "Recreational" },
];

const validateLeagueName = (name: string) => {
  if (!name.trim()) return "League name is required";
  if (name.trim().length < 2) return "League name must be at least 2 characters";
  if (name.trim().length > 100) return "League name must be less than 100 characters";
  return undefined;
};

export function LeagueFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode,
}: LeagueFormModalProps) {
  const [form, setForm] = useState<LeagueFormData>({
    name: "",
    description: "",
    leagueType: "recreational",
    season: "",
    isPublic: false,
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initialData?.name || "",
        description: initialData?.description || "",
        leagueType: initialData?.leagueType || "recreational",
        season: initialData?.season || "",
        isPublic: initialData?.isPublic ?? false,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setForm({
      name: "",
      description: "",
      leagueType: "recreational",
      season: "",
      isPublic: false,
    });
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const nameError = validateLeagueName(form.name);

    if (nameError) {
      setErrors({ name: nameError });
      return;
    }

    await onSubmit(form);
  };

  const title = mode === "create" ? "Create League" : "Edit League";
  const submitText = mode === "create" ? "Create League" : "Save Changes";
  const submittingText = mode === "create" ? "Creating..." : "Saving...";

  const isFormValid = form.name.trim() && !errors.name;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <ModalHeader title={title} />

      <div className="p-6 space-y-4">
        {/* League Name */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            League Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors({});
            }}
            className={`w-full px-3 py-2 rounded-lg border ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
            } bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2`}
            placeholder="e.g., Downtown Basketball League"
            autoFocus
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* League Type */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            League Type
          </label>
          <select
            value={form.leagueType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, leagueType: e.target.value as LeagueType }))
            }
            className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {LEAGUE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Season */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Season
          </label>
          <input
            type="text"
            value={form.season}
            onChange={(e) => setForm((prev) => ({ ...prev, season: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., 2025-2026"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Brief description of the league..."
          />
        </div>

        {/* Public Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Public League
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Anyone can find and join this league
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isPublic}
            onClick={() => setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.isPublic ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.isPublic ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <ModalFooter align="right">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-300 dark:disabled:bg-surface-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {isSubmitting ? submittingText : submitText}
        </button>
      </ModalFooter>
    </BaseModal>
  );
}

export default LeagueFormModal;
