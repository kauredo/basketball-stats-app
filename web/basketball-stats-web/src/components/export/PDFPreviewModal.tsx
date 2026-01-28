import React, { useEffect, useState } from "react";
import {
  BaseModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCancelButton,
} from "../ui/BaseModal";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  filename: string;
  title?: string;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfBlob,
  filename,
  title = "PDF Preview",
}: PDFPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [pdfBlob]);

  const handleDownload = () => {
    if (pdfBlob && pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="xl">
      <ModalHeader
        title={title}
        subtitle={`${filename}.pdf`}
        variant="default"
      />

      <ModalBody scrollable={false} className="p-0">
        <div className="w-full h-[70vh] bg-surface-100 dark:bg-surface-900">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-surface-500 dark:text-surface-400">
                Loading preview...
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter align="between">
        <ModalCancelButton onClick={onClose}>Close</ModalCancelButton>
        <button
          onClick={handleDownload}
          disabled={!pdfBlob}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-colors duration-150 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
            !pdfBlob
              ? "bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed"
              : "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white"
          }`}
        >
          <DocumentArrowDownIcon className="w-5 h-5" aria-hidden="true" />
          Download PDF
        </button>
      </ModalFooter>
    </BaseModal>
  );
}

export default PDFPreviewModal;
