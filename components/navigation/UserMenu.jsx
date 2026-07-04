"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";
import { dropdownVariants } from "./constants";
import { dropdownPanelClass, glassPanelStyle } from "./glassStyles";

export default function UserMenu({
  isOpen,
  onToggle,
  onClose,
  onCloseOthers,
  dropdownRef,
  userMenuItems,
  getUserDisplayName,
  getUserRole,
  getUserPhoto,
  getUserInitials,
  handleLogout,
  handleImageError,
}) {
  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          onToggle();
          onCloseOthers?.();
        }}
        className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 pl-2 pr-3 transition-all duration-200 hover:border-zinc-200/50 hover:bg-zinc-100/80 dark:hover:border-white/8 dark:hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="profile-menu"
        aria-label="Toggle profile menu"
      >
        <div className="relative h-7 w-7 shrink-0">
          {getUserPhoto() && (
            <Image
              src={getUserPhoto()}
              alt={`${getUserDisplayName()} profile photo`}
              width={28}
              height={28}
              className="rounded-full object-cover ring-2 ring-indigo-500/30"
              onError={handleImageError}
            />
          )}
          <div
            className="fallback-avatar absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white"
            style={{ display: getUserPhoto() ? "none" : "flex" }}
          >
            {getUserInitials(getUserDisplayName())}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#070B14]" />
        </div>

        <span className="hidden max-w-[80px] truncate text-sm font-medium text-zinc-700 dark:text-zinc-200 md:inline">
          {getUserDisplayName().split(" ")[0]}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="profile-menu"
            role="menu"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${dropdownPanelClass} w-52 py-1.5`}
            style={glassPanelStyle}
          >
            <div className="border-b border-zinc-100/60 px-4 py-3 dark:border-white/6">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {getUserDisplayName()}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">{getUserRole()}</p>
            </div>
            {userMenuItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                role="menuitem"
                onClick={onClose}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/60"
              >
                <item.icon className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <div className="my-1 border-t border-zinc-100/60 dark:border-white/6" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/40"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
