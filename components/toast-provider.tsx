"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Card, CardBody } from "@heroui/react";
import {
  CheckCircle2Icon,
  AlertCircleIcon,
  InfoIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      // 自动移除toast
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [removeToast],
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "success", title, message });
    },
    [showToast],
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "error", title, message });
    },
    [showToast],
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "warning", title, message });
    },
    [showToast],
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "info", title, message });
    },
    [showToast],
  );

  const getToastIcon = (type: ToastType) => {
    const iconClass = "w-5 h-5 flex-shrink-0";

    switch (type) {
      case "success":
        return <CheckCircle2Icon className={`${iconClass} text-success-500`} />;
      case "error":
        return <XCircleIcon className={`${iconClass} text-danger-500`} />;
      case "warning":
        return <AlertCircleIcon className={`${iconClass} text-warning-500`} />;
      case "info":
        return <InfoIcon className={`${iconClass} text-primary-500`} />;
    }
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-success-200 bg-success-50";
      case "error":
        return "border-danger-200 bg-danger-50";
      case "warning":
        return "border-warning-200 bg-warning-50";
      case "info":
        return "border-primary-200 bg-primary-50";
    }
  };

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}

      {/* Toast容器 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            className={`${getToastColors(toast.type)} border-l-4 shadow-lg animate-in slide-in-from-right duration-300`}
          >
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                {getToastIcon(toast.type)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-dark-olive-800 mb-1">
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="text-xs text-default-600">{toast.message}</p>
                  )}
                </div>
                <button
                  className="text-default-400 hover:text-default-600 transition-colors"
                  onClick={() => removeToast(toast.id)}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
