"use client";

import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  onSearchClick: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const { toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
          >
            <path d="M12 2a1 1 0 0 1 1 1v6.382l4.276-2.472a1 1 0 0 1 1 1.732L14 12l4.276 2.358a1 1 0 1 1-1 1.732L13 13.618V20a1 1 0 1 1-2 0v-6.382l-4.276 2.472a1 1 0 1 1-1-1.732L10 12 5.724 9.642a1 1 0 0 1 1-1.732L11 10.382V3a1 1 0 0 1 1-1Z" />
          </svg>
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-lg font-semibold text-transparent">
            fireflies.ai
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Search"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {/*
              Both icons always render — visibility is decided by the
              `dark:` variant alone (keyed off the data-theme attribute the
              inline script in layout.tsx sets before paint). Branching on
              ThemeProvider's `theme` state here instead would render
              differently on the server (always "light") than on a client
              whose stored/system preference is "dark", causing a hydration
              mismatch on first load.
            */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5 dark:hidden"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646Z" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="hidden h-5 w-5 dark:block"
            >
              <circle cx="12" cy="12" r="4" />
              <path
                strokeLinecap="round"
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              />
            </svg>
          </button>

          <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-medium text-white">
            DU
          </div>
        </div>
      </div>
    </header>
  );
}
