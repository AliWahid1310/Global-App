"use client";

import { useEffect, useRef } from "react";
import { X, AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "info";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  loading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      iconGlow: "shadow-lg shadow-red-500/20",
      button: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
      Icon: AlertTriangle,
    },
    warning: {
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      iconGlow: "shadow-lg shadow-amber-500/20",
      button: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
      Icon: ShieldAlert,
    },
    success: {
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      iconGlow: "shadow-lg shadow-green-500/20",
      button: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40",
      Icon: CheckCircle,
    },
    info: {
      iconBg: "bg-accent-500/20",
      iconColor: "text-accent-400",
      iconGlow: "shadow-lg shadow-accent-500/20",
      button: "bg-gradient-to-r from-accent-500 to-purple-500 hover:from-accent-600 hover:to-purple-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40",
      Icon: Info,
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = styles.Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade animation */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal with scale + slide animation */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md glass rounded-3xl p-8 animate-modal-pop border border-white/10"
      >
        {/* Glow effect behind modal */}
        <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r from-accent-500/20 to-purple-500/20 blur-xl opacity-50 -z-10`} />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-dark-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:rotate-90"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon with pulse animation */}
        <div className="flex justify-center mb-6">
          <div className={`relative`}>
            <div className={`absolute inset-0 ${styles.iconBg} rounded-full blur-xl animate-pulse`} />
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.iconGlow} animate-bounce-soft`}>
              <IconComponent className={`h-8 w-8 ${styles.iconColor}`} />
            </div>
          </div>
        </div>

        {/* Content with stagger animation */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-display font-bold text-white mb-3 animate-slide-up">
            {title}
          </h3>
          <p className="text-dark-200 leading-relaxed animate-slide-up-delayed">
            {message}
          </p>
        </div>

        {/* Actions with hover effects */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3.5 glass rounded-2xl text-white font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 border border-white/5 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${styles.button}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
