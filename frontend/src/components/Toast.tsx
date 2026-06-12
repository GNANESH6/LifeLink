/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-[10002] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void; key?: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const styles = {
    success: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-800",
      iconColor: "text-emerald-500",
      Icon: CheckCircle,
    },
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      iconColor: "text-red-500",
      Icon: AlertCircle,
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      iconColor: "text-blue-500",
      Icon: Info,
    },
  }[toast.type];

  const IconComponent = styles.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto ${styles.bg} ${styles.text}`}
      id={`toast-${toast.id}`}
    >
      <IconComponent className={`w-5 h-5 mt-0.5 shrink-0 ${styles.iconColor}`} />
      <div className="flex-1 text-sm font-medium leading-normal">{toast.message}</div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5"
        id={`toast-close-${toast.id}`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
