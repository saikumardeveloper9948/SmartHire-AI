import React, { useEffect } from "react";

const baseStyles =
  "fixed top-4 right-4 px-4 py-3 rounded shadow-lg text-sm z-50 transition-opacity";

const typeStyles = {
  success: "bg-green-100 text-green-800 border border-green-300",
  error: "bg-red-100 text-red-800 border border-red-300",
};

export const Alert = ({ type = "success", message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`${baseStyles} ${typeStyles[type]}`}>
      <span>{message}</span>
    </div>
  );
};

export default Alert;

