/**
 * AppLayout — shared layout wrapper with sidebar (desktop) and hamburger (mobile).
 * Wraps all authenticated and public routes that need navigation.
 *
 * L-01: DarkToggle extracted to src/components/layout/DarkToggle.tsx.
 * L-05: hamburger button wired with aria-controls and aria-expanded.
 */

import { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu } from './Menu';
import { MenuPopUp } from './MenuPopUp';
import { DarkToggle } from './DarkToggle';

const MOBILE_MENU_ID = 'app-mobile-menu';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar — visible on md+ */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wider">
            Timers
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Menu />
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <DarkToggle variant="sidebar" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
            aria-controls={MOBILE_MENU_ID}
            aria-expanded={mobileMenuOpen}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 mr-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-800 dark:text-gray-100 flex-1">Timers</span>
          <DarkToggle />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu drawer */}
      <MenuPopUp
        id={MOBILE_MENU_ID}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
