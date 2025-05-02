import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProps } from '../components/ui/Toast';
import { v4 as uuidv4 } from 'uuid';

interface ToastContextType {
  toast: (props: Omit<ToastProps, 'open' | 'onClose' | 'id'>) => string;
  dismiss: (id: string) => void;
}

interface ToastItem extends ToastProps {
  id: string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const toast = useCallback((props: Omit<ToastProps, 'open' | 'onClose' | 'id'>) => {
    const id = uuidv4();
    setToasts(prev => [...prev, { ...props, id, open: true }]);
    return id;
  }, []);
  
  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      
      {/* Render toasts */}
      {toasts.map(({ id, ...props }) => (
        <Toast 
          key={id}
          {...props}
          open={true}
          onClose={() => dismiss(id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}; 