import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  preventClose?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  preventClose = false,
  className = '',
}) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Set up the modal root element
  useEffect(() => {
    // Find existing modal root or create a new one
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);

    // Clean up function to remove the modal root if it's empty when component unmounts
    return () => {
      if (root && root.childElementCount === 0) {
        document.body.removeChild(root);
      }
    };
  }, []);

  // Handle modal keyboard events
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !preventClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, preventClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '0';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '0';
    };
  }, [isOpen]);

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop, not on modal content
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && !preventClose) {
      onClose();
    }
  };

  if (!isOpen || !modalRoot) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Solid backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black opacity-80"
        onClick={handleBackdropClick}
      />
      
      {/* Modal content with solid white background */}
      <div 
        ref={modalRef}
        className={`relative z-50 rounded-lg bg-white text-black shadow-lg ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modal, modalRoot);
}; 