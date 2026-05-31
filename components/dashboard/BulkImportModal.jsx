import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import Papa from "papaparse";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/apiClient";


const BulkImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
    } else {
      toast.error("Please upload a valid CSV file");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ["Name", "Roll No", "Email", "Department"],
      ["John Doe", "CS101", "john.doe@example.com", "Computer Science"],
      ["Jane Smith", "CS102", "jane.smith@example.com", "Computer Science"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + templateData.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const processImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data, errors } = results;

        if (errors.length > 0 && data.length === 0) {
          toast.error("Failed to parse CSV file");
          setIsUploading(false);
          return;
        }

        setProgress(30);

        // Validation
        const validRows = [];
        const invalidRows = [];

        data.forEach((row, index) => {
          const { Name, "Roll No": RollNo, Email, Department } = row;
          if (!Name || !RollNo || !Email || !Department) {
            invalidRows.push({ row: index + 2, reason: "Missing required fields" });
          } else if (!/^\S+@\S+\.\S+$/.test(Email)) {
            invalidRows.push({ row: index + 2, reason: "Invalid email format" });
          } else {
            validRows.push({ name: Name, rollNo: RollNo, email: Email, department: Department });
          }
        });

        setProgress(50);

        if (validRows.length === 0) {
          setResults({ success: 0, failed: invalidRows.length, errors: invalidRows });
          setIsUploading(false);
          return;
        }

        try {
          const { auth } = await import("@/lib/firebaseConfig");
          const token = await auth.currentUser?.getIdToken();

          const response = await apiFetch("/api/institute/bulk-import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ students: validRows }),
          });

          setProgress(90);

          const resultData = await response.json();

          if (response.ok) {
            setResults({
              success: resultData.successfulImports || 0,
              failed: (resultData.failedImports?.length || 0) + invalidRows.length,
              errors: [...invalidRows, ...(resultData.failedImports || [])],
            });
            toast.success("Import process completed");
            if (onImportComplete) onImportComplete();
          } else {
            throw new Error(resultData.error || "Failed to import students");
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error(error.message || "An error occurred during import");
          setResults({ success: 0, failed: validRows.length + invalidRows.length, errors: [{ reason: "Network or Server Error" }] });
        } finally {
          setProgress(100);
          setIsUploading(false);
        }
      },
      error: (error) => {
        toast.error("Error reading file: " + error.message);
        setIsUploading(false);
      },
    });
  };

  const resetModal = () => {
    setFile(null);
    setResults(null);
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-400" />
            Bulk Import Students
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isUploading}
            aria-label="Close bulk import modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!results ? (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Instructions</h3>
                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                  <li>Upload a CSV file containing student details.</li>
                  <li>Required columns: Name, Roll No, Email, Department.</li>
                  <li>Ensure all emails are unique and correctly formatted.</li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center underline"
                >
                  <Download className="w-4 h-4 mr-1" /> Download CSV Template
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file ? "border-blue-500 bg-blue-500/5" : "border-gray-700 hover:border-gray-500 bg-black/20"
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-blue-400 mb-3" />
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                    {!isUploading && (
                      <button
                        onClick={() => setFile(null)}
                        className="mt-3 text-sm text-red-400 hover:text-red-300"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-500 mb-3" />
                    <p className="text-gray-300 font-medium mb-1">Drag and drop your CSV file here</p>
                    <p className="text-gray-500 text-sm mb-4">or</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Importing students...</span>
                    <span className="text-blue-400 font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                  <div className="text-2xl font-bold text-green-400">{results.success}</div>
                  <div className="text-sm text-gray-400">Successfully Imported</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                  <div className="text-2xl font-bold text-red-400">{results.failed}</div>
                  <div className="text-sm text-gray-400">Failed Records</div>
                </div>
              </div>

              {results.errors?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 border-b border-gray-700">
                    Error Details
                  </div>
                  <div className="max-h-48 overflow-y-auto p-4 space-y-2">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start text-sm bg-red-500/5 p-2 rounded">
                        <span className="text-red-400 mr-2">•</span>
                        <span className="text-gray-300">
                          {err.row ? `Row ${err.row}: ` : ""}{err.reason || err.error || "Unknown error"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end space-x-3 bg-black/20">
          {!results ? (
            <>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processImport}
                disabled={!file || isUploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center shadow-lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Import Students"
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Import More
              </button>
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-lg"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
