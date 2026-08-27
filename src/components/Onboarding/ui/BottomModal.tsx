import React, { useEffect, useRef } from 'react';

interface BottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomModal: React.FC<BottomModalProps> = ({ isOpen, onClose, title, children }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('bottom-sheet-open');
    } else {
      document.documentElement.classList.remove('bottom-sheet-open');
    }
    return () => { document.documentElement.classList.remove('bottom-sheet-open'); };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="ob-modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="ob-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="ob-modal-handle" />
        <div className="ob-modal-header">
          <h3 className="ob-modal-title">{title}</h3>
          <button className="ob-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ob-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default BottomModal;
