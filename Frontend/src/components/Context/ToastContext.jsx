import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence } from 'framer-motion';
import ToastAlert from './ToastAlert';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = type === 'error' ? 5000 : 3000) => {
    const id = uuidv4();
    
    setToasts((prev) => {
      // Pertahankan maksimal 3 toast, hapus yang paling lama jika lebih
      const updatedToasts = [...prev, { id, message, type, duration }].slice(-1);
      return updatedToasts;
    });

    // Set timeout untuk auto remove
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    // Cleanup function untuk menghindari memory leak
    return () => clearTimeout(timer);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastAlert
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};