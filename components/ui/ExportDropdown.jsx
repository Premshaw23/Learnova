"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Table, Loader2, ChevronDown } from "lucide-react";

/**
 * ExportDropdown
 *
 * Reusable export button with a dropdown menu for CSV and PDF options.
 * Matches the existing Learnova dashboard dark glassmorphic UI style.
 *
 * Props:
 *   onExport(format: "csv" | "pdf") — called when user selects a format
 *   isExporting                     — shows a spinner and disables the button
 *   className                       — override classes for the trigger button
 *   label                           — override the default "Export Reports" text
 *   children                        — if provided, replaces the default button content
 */
const ExportDropdown = ({
  onExport,
  isExporting = false,
  className = "",
  label = "Export Reports",
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (format) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div
      className="relative inline-block text-left w-full sm:w-auto"
      ref={dropdownRef}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !isExporting && setIsOpen((prev) => !prev)}
        disabled={isExporting}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={isExporting ? "Exporting report…" : label}
        className={`flex items-center justify-center gap-2 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            <span className="font-medium text-inherit">Exporting…</span>
          </>
        ) : children ? (
          children
        ) : (
          <>
            <Download className="w-5 h-5 shrink-0" />
            <span className="font-medium text-inherit">{label}</span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Export format options"
          className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl bg-gray-900 border border-gray-700 shadow-2xl ring-1 ring-white/10 focus:outline-none z-50 overflow-hidden backdrop-blur-xl"
        >
          <div className="py-1">
            <button
              role="menuitem"
              onClick={() => handleSelect("csv")}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors focus-visible:bg-gray-800 focus-visible:outline-none"
            >
              <Table className="h-4 w-4 text-green-400 shrink-0" />
              <div className="text-left">
                <div className="font-medium">Export as CSV</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Spreadsheet-compatible
                </div>
              </div>
            </button>
            <div className="h-px bg-gray-800 mx-2" />
            <button
              role="menuitem"
              onClick={() => handleSelect("pdf")}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors focus-visible:bg-gray-800 focus-visible:outline-none"
            >
              <FileText className="h-4 w-4 text-red-400 shrink-0" />
              <div className="text-left">
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Formatted report
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
