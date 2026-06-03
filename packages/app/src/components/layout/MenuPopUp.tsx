/**
 * MenuPopUp — mobile slide-in navigation drawer.
 * Migrated from MenuPopUp.js (class component).
 */

import { useEffect, useRef } from 'react';
import { Menu } from './Menu';

interface MenuPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  /** Stable id forwarded from the hamburger button's aria-controls (L-05). */
  id?: string;
}

export function MenuPopUp({ isOpen, onClose, id }: MenuPopUpProps) {
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = drawerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !focusable.length) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        ref={drawerRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Menú</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500 dark:text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <Menu onClose={onClose} />
      </aside>
    </>
  );
}
