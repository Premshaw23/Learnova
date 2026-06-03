'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

const COMMANDS = [
  { id: 'home',           label: 'Home',                    description: 'Go to landing page',          href: '/',                        category: 'Navigation' },
  { id: 'student-dash',   label: 'Student Dashboard',       description: 'Open student dashboard',      href: '/student/dashboard',       category: 'Dashboard'  },
  { id: 'teacher-dash',   label: 'Teacher Dashboard',       description: 'Open teacher dashboard',      href: '/teacher/dashboard',       category: 'Dashboard'  },
  { id: 'institute-dash', label: 'Institute Dashboard',     description: 'Open institute dashboard',    href: '/institute/dashboard',     category: 'Dashboard'  },
  { id: 'admin-dash',     label: 'Admin Dashboard',         description: 'Open admin dashboard',        href: '/admin/dashboard',         category: 'Dashboard'  },
  { id: 'attendance',     label: 'Attendance',              description: 'Manage attendance records',   href: '/attendance',              category: 'Features'   },
  { id: 'activity',       label: 'Activity Centre',         description: 'View academic activities',    href: '/activity',                category: 'Features'   },
  { id: 'notices',        label: 'Notice Board',            description: 'View institution notices',    href: '/notices',                 category: 'Features'   },
  { id: 'settings',       label: 'Settings',                description: 'Manage your preferences',     href: '/settings',                category: 'Account'    },
  { id: 'profile',        label: 'Profile',                 description: 'View or edit your profile',   href: '/profile',                 category: 'Account'    },
  { id: 'contact',        label: 'Contact',                 description: 'Get in touch with Learnova',  href: '/contact',                 category: 'Support'    },
  { id: 'signin',         label: 'Sign In',                 description: 'Sign in to your account',     href: '/auth',                    category: 'Auth'       },
];

const fuzzyMatch = (str, query) => {
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  let si = 0;
  for (let qi = 0; qi < q.length; qi++) {
    si = s.indexOf(q[qi], si);
    if (si === -1) return false;
    si++;
  }
  return true;
};

const highlight = (text, query) => {
  if (!query) return text;
  const q = query.toLowerCase();
  const result = [];
  let i = 0;
  for (const char of text) {
    if (i < q.length && char.toLowerCase() === q[i]) {
      result.push(<mark key={result.length} className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded-sm">{char}</mark>);
      i++;
    } else {
      result.push(char);
    }
  }
  return result;
};

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const router = useRouter();

  const filtered = query.trim()
    ? COMMANDS.filter((c) => fuzzyMatch(c.label + ' ' + c.description + ' ' + c.category, query))
    : COMMANDS;

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flat = filtered;

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    setQuery('');
    setActiveIndex(0);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback((cmd) => {
    router.push(cmd.href);
    onClose();
  }, [router, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (flat[activeIndex]) handleSelect(flat[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, features..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm"
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={flat[activeIndex] ? `cmd-${flat[activeIndex].id}` : undefined}
          />
          <button onClick={onClose} aria-label="Close palette" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} id="command-list" role="listbox" className="max-h-80 overflow-y-auto py-2">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No results found</p>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {category}
                </p>
                {cmds.map((cmd) => {
                  const globalIdx = flat.indexOf(cmd);
                  const isActive = globalIdx === activeIndex;
                  return (
                    <button
                      key={cmd.id}
                      id={`cmd-${cmd.id}`}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/40'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>
                          {highlight(cmd.label, query)}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {highlight(cmd.description, query)}
                        </p>
                      </div>
                      {isActive && (
                        <kbd className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded">↵</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">↵</kbd> open</span>
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;