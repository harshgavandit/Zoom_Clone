// Toast Notification Service - No external library, pure React + MUI
import React, { createContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Box } from '@mui/material';

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, severity = 'info', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, severity };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={3000}
            onClose={() => removeToast(toast.id)}
            sx={{ mb: 1 }}
          >
            <Alert
              onClose={() => removeToast(toast.id)}
              severity={toast.severity}
              sx={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                minWidth: '300px'
              }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Box>
    </ToastContext.Provider>
  );
}

// Hook to use toasts
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}