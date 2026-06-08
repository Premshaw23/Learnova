import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Table, Loader2 } from "lucide-react";

const ExportDropdown = ({
  onExport,
  isExporting,
  className = "",
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div
      className="relative inline-block text-left w-full sm:w-auto"
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`flex items-center justify-center space-x-2 transition-all duration-300 ease-in-out ${className}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium text-inherit">Exporting...</span>
          </>
        ) : (
          children || (
            <>
              <Download className="w-5 h-5" />
              <span className="font-medium text-inherit">Export Reports</span>
            </>
          )
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-gray-900 border border-gray-700 shadow-2xl ring-1 ring-white/10 focus:outline-none z-50 overflow-hidden backdrop-blur-xl">
          <div className="py-1">
            <button
              onClick={() => handleExport("csv")}
              className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Table className="mr-3 h-4 w-4 text-green-400" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <FileText className="mr-3 h-4 w-4 text-red-400" />
              Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
