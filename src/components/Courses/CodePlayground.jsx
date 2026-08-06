"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Code2 } from "lucide-react";

export default function CodePlayground({
  initialCode = "",
  language = "javascript",
}) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    setCode(initialCode);
    setOutput("");
  }, [initialCode, language]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("");

    if (language === "html" || language === "javascript") {
      // Client-side execution for Web Languages
      const htmlContent =
        language === "html"
          ? code
          : `
          <html>
            <body>
              <script>
                // Intercept console.log
                const originalLog = console.log;
                console.log = function(...args) {
                  window.parent.postMessage({ type: 'playground_log', data: args.join(' ') }, '*');
                  originalLog.apply(console, args);
                };
                
                // Intercept errors
                window.onerror = function(msg, url, line, col, error) {
                  window.parent.postMessage({ type: 'playground_error', data: msg }, '*');
                  return false;
                };

                try {
                  ${code}
                } catch (e) {
                  window.parent.postMessage({ type: 'playground_error', data: e.toString() }, '*');
                }
              </script>
            </body>
          </html>
        `;

      if (iframeRef.current) {
        iframeRef.current.srcdoc = htmlContent;
      }
      setIsRunning(false);
    } else {
      // Server-side evaluation for Python/other
      try {
        const res = await fetch("/api/courses/run-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language }),
        });
        const data = await res.json();
        if (data.success) {
          setOutput(data.output);
        } else {
          setOutput(`Error: ${data.error}`);
        }
      } catch (err) {
        setOutput(`Network error: ${err.message}`);
      } finally {
        setIsRunning(false);
      }
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "playground_log") {
        setOutput((prev) => prev + event.data.data + "\n");
      } else if (event.data?.type === "playground_error") {
        setOutput((prev) => prev + "Error: " + event.data.data + "\n");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm my-6">
      <div className="bg-muted px-4 py-2 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Code2 size={16} />
          <span className="capitalize">{language} Playground</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCode(initialCode)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-background transition-colors"
            title="Reset Code"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Play size={12} />
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Editor Pane */}
        <div className="border-r border-border h-[300px]">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full p-4 bg-background font-mono text-sm resize-none focus:outline-none"
            spellCheck="false"
            placeholder="// Write your code here..."
          />
        </div>

        {/* Output Pane */}
        <div className="h-[300px] bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-sm overflow-auto relative">
          <div className="absolute top-2 right-2 text-xs text-gray-500 font-sans">
            Output
          </div>
          {language === "html" ? (
            <iframe
              ref={iframeRef}
              title="HTML Playground"
              className="w-full h-full bg-white rounded-sm border-none"
              sandbox="allow-scripts"
            />
          ) : (
            <pre className="whitespace-pre-wrap">
              {output || "Run code to see output..."}
            </pre>
          )}
          {language === "javascript" && (
            <iframe
              ref={iframeRef}
              title="JS Runner hidden"
              className="hidden"
              sandbox="allow-scripts"
            />
          )}
        </div>
      </div>
    </div>
  );
}
