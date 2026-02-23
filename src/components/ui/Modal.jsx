import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Modal — HC MotoGarage-style layout
 */
export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className={`bg-white rounded-md shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-in`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-2 flex items-start justify-between shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xl leading-none p-1 -mt-1 -mr-1"
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-6 overflow-y-auto flex-1">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-8 pb-8 pt-2 flex gap-3 justify-end shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
