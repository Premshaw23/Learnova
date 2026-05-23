import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast"; // or whatever toast library you're using
import { useAuth } from "@/hooks/useAuth";
import {
  AlertCircle,
  MapPin,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const AttendanceValidation = ({ onValidationSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [timeValid, setTimeValid] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [modalLocationLoading, setModalLocationLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Exception modal states (only for time-based exceptions)
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    reason: "",
    details: "",
    studentId: "",
    studentName: "",
    currentLocation: null, // Add this field
  });

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(
          doc(db, "attendance_settings", "current_settings"),
        );
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data();
          if (settingsData) {
            delete settingsData.passcode;
          }
          setSettings(settingsData);
          checkTimeValidity(settingsData.timeWindow);
        }
      } catch (error) {
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const checkTimeValidity = (timeWindow) => {
    if (!timeWindow) return;
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const isValidTime =
      currentTime >= timeWindow.start && currentTime <= timeWindow.end;
    setTimeValid(isValidTime);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const requestLocation = async () => {
    setIsLoading(true);
    setLocationError("");
    setLocationDenied(false);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }
      if (!settings) {
        throw new Error("Settings not loaded");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const distance = calculateDistance(
        userLat,
        userLng,
        settings.gpsLocation.lat,
        settings.gpsLocation.lng,
      );

      const locationData = {
        lat: userLat,
        lng: userLng,
        distance: Math.round(distance),
        isValid: distance <= settings.gpsLocation.radius,
        timestamp: new Date().toISOString(),
      };

      setLocation(locationData);
      setRetryCount(0);

      if (distance <= settings.gpsLocation.radius) {
        setCurrentStep(2);
      } else {
        setLocationError(
          `You are ${Math.round(
            distance,
          )}m away from the valid location. You need to be within ${
            settings.gpsLocation.radius
          }m to proceed.`,
        );
      }
    } catch (error) {
      setRetryCount((prev) => prev + 1);

      if (error.code === 1) {
        setLocationDenied(true);
        setLocationError(
          "Location access was denied. Please enable location services in your browser settings and click 'Enable Location' to try again.",
        );
      } else if (error.code === 2) {
        setLocationError(
          "Your location is unavailable. Please check your GPS settings and try again.",
        );
      } else if (error.code === 3) {
        setLocationError("Location request timed out. Please try again.");
      } else {
        setLocationError(
          "Unable to retrieve your location. Please ensure location services are enabled and try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const enableLocation = async () => {
    try {
      // Request permission explicitly
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      if (permission.state === "denied") {
        setLocationError(
          "Location is permanently blocked. Please go to your browser settings, unblock location for this site, and refresh the page.",
        );
        return;
      }
    } catch (e) {
      // Fallback if permissions API is not supported
    }

    // Try to get location again
    requestLocation();
  };

  const validatePasscode = async () => {
    if (!passcode.trim()) return;
    setIsLoading(true);
    setPasscodeError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/attendance/validate-passcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setCurrentStep(3);
      } else {
        setPasscodeError(
          data.error || "Invalid passcode. Please contact your teacher for the correct code."
        );
      }
    } catch (error) {
      setPasscodeError("Error validating passcode. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToAttendance = () => {
    onValidationSuccess();
  };

  const submitTimeExceptionRequest = async () => {
    setExceptionForm((prev) => ({
      ...prev,
      studentId: user?.email || "",
      studentName: user?.displayName || user?.email || "",
    }));
    setShowExceptionModal(true);
  };

  const getCurrentLocationForException = async () => {
    setModalLocationLoading(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const distance = calculateDistance(
        userLat,
        userLng,
        settings.gpsLocation.lat,
        settings.gpsLocation.lng,
      );

      const currentLocationData = {
        lat: userLat,
        lng: userLng,
        distance: Math.round(distance),
        isValid: distance <= settings.gpsLocation.radius,
        timestamp: new Date().toISOString(),
      };

      setExceptionForm((prev) => ({
        ...prev,
        currentLocation: currentLocationData,
      }));

      toast.success("Current location captured successfully");
    } catch (error) {
      // In getCurrentLocationForException, add error handling for denied permissions
      if (error.code === 1) {
        toast.error(
          "Location access denied. Please enable location in browser settings.",
        );
      }
    } finally {
      setModalLocationLoading(false);
    }
  };

  const handleExceptionSubmit = async () => {
    try {
      const requestData = {
        studentId: exceptionForm.studentId,
        studentName: exceptionForm.studentName,
        reason: exceptionForm.reason,
        details: exceptionForm.details,
        className: "Current Class",
        timestamp: new Date().toISOString(),
        status: "pending",
        type: "validation_exception",
        currentLocation: exceptionForm.currentLocation, // Add this
        validationAttempt: {
          timeWindow: settings?.timeWindow,
          timeValid: timeValid,
          locationValid: location?.isValid || false,
          locationDistance: location?.distance || null,
          passcodeAttempted: currentStep >= 2,
          currentStep: currentStep,
          attemptedAt: new Date().toISOString(),
        },
      };

      const response = await fetch("/api/exceptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setShowExceptionModal(false);
        toast.success(
          "Exception request submitted successfully. Your teacher will review it.",
        );
        setExceptionForm({
          reason: "",
          details: "",
          studentId: "",
          studentName: "",
          currentLocation: null, // Reset this too
        });
      } else {
        toast.error("Failed to submit request. Please try again.");
      }
    } catch (error) {
      toast.error("Error submitting request. Please try again.");
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div
              className="absolute inset-0 w-24 h-24 border-4 border-transparent border-r-blue-500 rounded-full animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Loading System</h2>
            <p className="text-purple-300">
              Preparing attendance validation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-950 to-gray-950 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">System Error</h2>
            <p className="text-red-300">
              Unable to load attendance settings. Please contact your
              administrator or try refreshing the page.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25">
            <MapPin className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-yellow-900 font-bold text-sm">1</span>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Location Verification
          </h2>
          <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
            We need to verify you're at the correct location to proceed with
            attendance
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="space-y-4">
        {/* Time Status */}
        <div
          className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
            timeValid
              ? "border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10"
              : "border-red-500/50 bg-gradient-to-r from-red-500/10 to-orange-500/10"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${
                  timeValid ? "bg-green-500" : "bg-red-500"
                }`}
              >
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  Time Window
                </h3>
                <p
                  className={`text-sm ${
                    timeValid ? "text-green-300" : "text-red-300"
                  }`}
                >
                  {timeValid
                    ? `✅ Perfect timing! Valid window: ${settings.timeWindow.start} - ${settings.timeWindow.end}`
                    : `⏰ Outside time window. Valid hours: ${settings.timeWindow.start} - ${settings.timeWindow.end}`}
                </p>
              </div>
              {timeValid ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Location Status */}
        <div
          className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
            location?.isValid
              ? "border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10"
              : location && !location.isValid
                ? "border-red-500/50 bg-gradient-to-r from-red-500/10 to-orange-500/10"
                : "border-gray-500/50 bg-gradient-to-r from-gray-500/10 to-slate-500/10"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${
                  location?.isValid
                    ? "bg-green-500"
                    : location && !location.isValid
                      ? "bg-red-500"
                      : "bg-gray-500"
                }`}
              >
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  GPS Location
                </h3>
                <p
                  className={`text-sm ${
                    location?.isValid
                      ? "text-green-300"
                      : location && !location.isValid
                        ? "text-red-300"
                        : "text-gray-300"
                  }`}
                >
                  {location?.isValid
                    ? `✅ Perfect! You are ${location.distance}m from the institution`
                    : location && !location.isValid
                      ? `❌ Too far! You are ${location.distance}m away (maximum: ${settings.gpsLocation.radius}m)`
                      : "📍 Location check required"}
                </p>
              </div>
              {location?.isValid ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : location && !location.isValid ? (
                <XCircle className="w-8 h-8 text-red-500" />
              ) : (
                <div className="w-8 h-8 border-2 border-gray-400 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {locationError && (
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="space-y-3">
              <p className="text-red-300 font-medium">{locationError}</p>
              {locationDenied && (
                <div className="space-y-2">
                  <p className="text-sm text-orange-300">
                    💡 <strong>How to enable location:</strong>
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4">
                    <li>
                      • Look for a location icon in your browser's address bar
                    </li>
                    <li>• Click it and select "Allow"</li>
                    <li>
                      • Or go to browser Settings {">"} Privacy {">"} Site
                      Settings {">"} Location
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {locationDenied ? (
          <Button
            onClick={enableLocation}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-6 text-lg rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
          >
            <MapPin className="w-6 h-6 mr-3" />
            Enable Location Access
          </Button>
        ) : (
          <Button
            onClick={requestLocation}
            disabled={isLoading || !timeValid}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 text-lg rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                {retryCount > 0 ? "Retrying..." : "Getting Location..."}
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <MapPin className="w-6 h-6" />
                {location ? "Retry Location Check" : "Check My Location"}
              </span>
            )}
          </Button>
        )}

        <Button
          onClick={submitTimeExceptionRequest}
          variant="outline"
          className="w-full border-2 border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-300 hover:bg-orange-500/20 py-6 text-lg rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          <Clock className="w-5 h-5 mr-3" />
          Request Exception
        </Button>
      </div>

      {retryCount > 0 && (
        <div className="text-center text-sm text-gray-400">
          Attempt {retryCount + 1} • Having trouble? Make sure GPS is enabled on
          your device
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/25">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-yellow-900 font-bold text-sm">2</span>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Security Passcode
          </h2>
          <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
            Enter the attendance passcode provided by your instructor
          </p>
        </div>
      </div>

      {/* Passcode Input */}
      <div className="space-y-6">
        <div className="relative">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="• • • • • •"
            className="w-full bg-white/5 border-2 border-white/20 rounded-2xl px-8 py-6 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 text-center text-3xl tracking-[0.5em] font-bold transition-all duration-300"
            maxLength={8}
            onKeyPress={(e) => e.key === "Enter" && validatePasscode()}
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
        </div>

        {passcodeError && (
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 font-medium">{passcodeError}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={validatePasscode}
            disabled={!passcode.trim() || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 text-lg rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
          >
            <Shield className="w-6 h-6 mr-3" />
            {isLoading ? "Verifying..." : "Verify Passcode"}
          </Button>

          <Button
            onClick={() => setCurrentStep(1)}
            variant="outline"
            className="w-full border-2 border-gray-500/50 bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-300 hover:bg-gray-500/20 py-4 rounded-2xl transition-all duration-300"
          >
            ← Back to Location
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/25">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-yellow-900 font-bold text-sm">3</span>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            All Set!
          </h2>
          <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
            Validation complete. Ready for face recognition.
          </p>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Validation Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-300 text-sm font-medium">
                ✅ Time window validated ({settings.timeWindow.start} -{" "}
                {settings.timeWindow.end})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-300 text-sm font-medium">
                ✅ Location verified ({location?.distance}m from institution)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-300 text-sm font-medium">
                ✅ Security passcode confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Final Action */}
        <Button
          onClick={proceedToAttendance}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
        >
          <span className="flex items-center gap-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Start Face Recognition
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center py-12 space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
              Secure Attendance
            </h1>
            <div className="h-1 w-40 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full shadow-lg shadow-purple-500/50"></div>
          </div>
          <p className="text-2xl text-gray-300 font-light tracking-wide">
            Multi-Layer Security Validation
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-full px-8 py-4 border border-white/10">
            <div className="flex items-center justify-between min-w-64">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      step <= currentStep
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-110"
                        : step === currentStep + 1
                          ? "bg-gray-600 text-gray-300 scale-105"
                          : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all duration-500 rounded-full ${
                        step < currentStep
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-gray-700"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs text-gray-400 font-medium">
              <span className={currentStep === 1 ? "text-purple-300" : ""}>
                Location
              </span>
              <span className={currentStep === 2 ? "text-purple-300" : ""}>
                Passcode
              </span>
              <span className={currentStep === 3 ? "text-purple-300" : ""}>
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-12">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <Button
            onClick={() => router.push("/register")}
            variant="outline"
            className="border-2 border-purple-400/30 bg-white/5 backdrop-blur-sm text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/50 px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Register New Face
            </span>
          </Button>
        </div>
      </div>

      {/* Exception Request Modal */}
      {showExceptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border-2 border-orange-500/50 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Exception Request
                </h3>
                <p className="text-gray-300 text-sm">
                  Request attendance validation exception
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-2">
                    Current Location
                  </label>
                  {exceptionForm.currentLocation ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-xs text-green-200">
                        Location captured:{" "}
                        {exceptionForm.currentLocation.distance}m from
                        institution
                        {exceptionForm.currentLocation.isValid
                          ? " (Valid)"
                          : " (Outside range)"}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={getCurrentLocationForException}
                      disabled={modalLocationLoading}
                      className="w-full bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 py-2 rounded-lg transition-all duration-300 text-sm"
                    >
                      {modalLocationLoading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Getting Location...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center">
                          <MapPin className="w-4 h-4" />
                          Get Current Location
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-2">
                    Reason for Exception
                  </label>
                  <select
                    value={exceptionForm.reason}
                    onChange={(e) =>
                      setExceptionForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300"
                  >
                    <option value="">Select reason</option>
                    <option value="passcode_unavailable">
                      Passcode Not Available
                    </option>
                    <option value="time_constraint">Outside Time Window</option>
                    <option value="medical_emergency">Medical Emergency</option>
                    <option value="transport_issue">Transport Issue</option>
                    <option value="family_emergency">Family Emergency</option>
                    <option value="official_duty">Official Duty</option>
                    <option value="technical_issue">Technical Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={exceptionForm.details}
                    onChange={(e) =>
                      setExceptionForm((prev) => ({
                        ...prev,
                        details: e.target.value,
                      }))
                    }
                    placeholder="Please provide specific details..."
                    rows={3}
                    className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none transition-all duration-300"
                  />
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-orange-200">
                      <p className="font-semibold mb-1">Important:</p>
                      <p>Your request will be reviewed by your instructor.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowExceptionModal(false);
                    setExceptionForm({
                      reason: "",
                      details: "",
                      studentId: "",
                      studentName: "",
                    });
                  }}
                  className="flex-1 bg-gray-700/80 hover:bg-gray-600/80 text-white py-3 rounded-lg transition-all duration-300 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExceptionSubmit}
                  disabled={
                    !exceptionForm.reason.trim() ||
                    !exceptionForm.details.trim()
                  }
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-all duration-300 font-semibold text-sm"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceValidation;
