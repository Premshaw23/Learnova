const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');

const errorContent = `"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] p-8 text-center">
      <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-border dark:border-white/10 p-10 max-w-lg w-full shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-red-500/10 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-3">
          Something went wrong!
        </h2>
        <p className="text-muted-foreground dark:text-gray-400 mb-8 leading-relaxed">
          We encountered an unexpected error while rendering this section. Our system has logged the issue.
        </p>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
`;

function walkSync(currentDirPath) {
  if (!fs.existsSync(currentDirPath)) return;
  const entries = fs.readdirSync(currentDirPath, { withFileTypes: true });
  
  let hasPage = false;
  let hasError = false;

  for (const entry of entries) {
    if (entry.name === 'page.js' || entry.name === 'page.jsx' || entry.name === 'page.tsx') {
      hasPage = true;
    }
    if (entry.name === 'error.js' || entry.name === 'error.jsx' || entry.name === 'error.tsx') {
      hasError = true;
    }
    if (entry.isDirectory()) {
      walkSync(path.join(currentDirPath, entry.name));
    }
  }

  // Only add if it's not the root app dir, has a page, and doesn't have an error.js
  if (hasPage && !hasError && currentDirPath !== appDir) {
    const errorFilePath = path.join(currentDirPath, 'error.js');
    fs.writeFileSync(errorFilePath, errorContent, 'utf8');
    console.log('Added error.js to', currentDirPath);
  }
}

walkSync(appDir);
