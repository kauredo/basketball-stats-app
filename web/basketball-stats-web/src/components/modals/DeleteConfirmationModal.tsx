import React from "react";
import { BaseModal, ModalFooter } from "../ui/BaseModal";
import { ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline";

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title: string;
  itemName: string;
  /** Optional warning message shown below the main text */
  warningMessage?: string;
  /** Button text when not deleting (default: "Delete") */
  confirmText?: string;
  /** Button text while deleting (default: "Deleting...") */
  deletingText?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title,
  itemName,
  warningMessage,
  confirmText = "Delete",
  deletingText = "Deleting...",
}: DeleteConfirmationModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="p-6 text-center">
        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{title}</h3>
        <p className="text-surface-500 text-sm leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-medium text-surface-700 dark:text-surface-300">"{itemName}"</span>?
        </p>
        {warningMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{warningMessage}</p>
        )}
      </div>

      <ModalFooter align="right">
        <button onClick={onClose} className="flex-1 btn-secondary px-4 py-2.5 rounded-xl">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800 transition-colors disabled:opacity-50"
        >
          {isDeleting ? deletingText : confirmText}
        </button>
      </ModalFooter>
    </BaseModal>
  );
}

export default DeleteConfirmationModal;
