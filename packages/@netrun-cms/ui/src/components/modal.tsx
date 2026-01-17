import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-futura-bold text-gray-900">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
