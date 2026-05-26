import React, { useEffect, useRef } from "react";
import { FileText, RefreshCw, AlertCircle, MessageSquare, Check, X } from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";

export const ExceptionRequestsList = ({
  exceptionRequests,
  isLoadingRequests,
  requestsError,
  fetchAllRequests,
  showAllRequestsModal,
  setShowAllRequestsModal,
  allRequests,
  handleExceptionRequest
}) => {
  const modalContainerRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!showAllRequestsModal) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowAllRequestsModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAllRequestsModal, setShowAllRequestsModal]);

  // Trap focus inside modal
  useEffect(() => {
    if (!showAllRequestsModal || !modalContainerRef.current) return;

    const modalElement = modalContainerRef.current;
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift focus inside modal initially
    firstElement.focus();

    const handleTabTrap = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTabTrap);
    return () => {
      window.removeEventListener("keydown", handleTabTrap);
    };
  }, [showAllRequestsModal]);

  return (
    <>
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 ms:p-6 p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="md:text-2xl text-sm font-bold text-white">
            Exception Requests
          </h2>
          <div className="flex items-center md:space-x-3 space-x-1">
            <button
              onClick={fetchAllRequests}
              disabled={isLoadingRequests}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 md:px-3 px-1 py-1 rounded-lg text-xs transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>View All</span>
              {isLoadingRequests && (
                <RefreshCw className="w-4 h-4 animate-spin" />
              )}
            </button>
            <span className="bg-red-500/20 text-red-400 md:px-3 px-2 py-1 rounded-full text-xs">
              {
                exceptionRequests.filter((req) => req.status === "pending")
                  .length
              }{" "}
              Pending
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {isLoadingRequests ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : requestsError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-400 mb-2">Failed to load requests</p>
              <p className="text-gray-400 text-sm">{requestsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : exceptionRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                No exception requests at the moment
              </p>
            </div>
          ) : (
            exceptionRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">
                      {request.studentName}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {request.studentId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">
                      {request.className}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {request.timestamp
                        ? new Date(request.timestamp).toLocaleString()
                        : "No date"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-300">
                    <strong>Reason:</strong> {request.reason}
                  </div>
                  {request.currentLocation && (
                    <div className="text-sm text-gray-300">
                      <strong>Current Location:</strong>{" "}
                      {typeof request.currentLocation === "object"
                        ? `${
                            request.currentLocation.distance || "Unknown"
                          }m from institution`
                        : request.currentLocation}
                    </div>
                  )}
                  {request.details && (
                    <div className="text-sm text-gray-300">
                      <strong>Details:</strong> {request.details}
                    </div>
                  )}
                </div>

                {request.status === "pending" ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        handleExceptionRequest(request.id, "approved")
                      }
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() =>
                        handleExceptionRequest(request.id, "rejected")
                      }
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === "approved"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {request.status.toUpperCase()}
                    </div>
                    {request.comments && (
                      <div className="text-xs text-gray-400">
                        {request.comments}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {/* All Requests Modal */}
      {showAllRequestsModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllRequestsModal(false);
            }
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            ref={modalContainerRef}
            className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  All Exception Requests
                </h3>
                <p className="text-gray-400">
                  Complete history of student exception requests (
                  {allRequests.length} total)
                </p>
              </div>
              <button
                onClick={() => setShowAllRequestsModal(false)}
                className="bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {allRequests.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    No exception requests found
                  </p>
                </div>
              ) : (
                allRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-white font-medium">
                          {request.studentName}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {request.studentId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">
                          {request.className}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {request.timestamp
                            ? new Date(request.timestamp).toLocaleString()
                            : "No date"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-300">
                        <strong>Reason:</strong> {request.reason}
                      </div>
                      {request.currentLocation && (
                        <div className="text-sm text-gray-300">
                          <strong>Current Location:</strong>{" "}
                          {typeof request.currentLocation === "object"
                            ? `${
                                request.currentLocation.distance ||
                                "Unknown"
                              }m from institution`
                            : request.currentLocation}
                        </div>
                      )}
                      {request.details && (
                        <div className="text-sm text-gray-300">
                          <strong>Details:</strong> {request.details}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === "approved"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : request.status === "rejected"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {request.status?.toUpperCase() || "PENDING"}
                      </div>
                      <div className="text-right">
                        {request.reviewedBy && (
                          <div className="text-xs text-gray-400 mb-1">
                            Reviewed by: {request.reviewedBy}
                          </div>
                        )}
                        {request.reviewedAt && (
                          <div className="text-xs text-gray-400">
                            {new Date(request.reviewedAt).toLocaleString()}
                          </div>
                        )}
                        {request.comments && (
                          <div className="text-xs text-gray-300 mt-1 italic">
                            "{request.comments}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowAllRequestsModal(false)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
