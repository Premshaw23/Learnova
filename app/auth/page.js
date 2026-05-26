"use client";

import { useState, useEffect, Suspense } from "react";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import { useRouter, useSearchParams } from "next/navigation";

// Components
import { Navbar } from "@/components/Navbar";
import RoleSelection from "@/components/RoleSelection";
import AuthForm from "@/components/AuthForm";
import HeroSection from "@/components/HeroSection";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import toast from "react-hot-toast";

// Services and Utils
import {
loginWithEmail,
signupWithEmail,
loginWithGoogle,
resetPassword,
} from "@/services/authService";

import { validateForm, redirectBasedOnRole } from "@/utils/authUtils";
import { USER_ROLES } from "@/constants/userRoles";

export default function AuthPage() {
return ( <Suspense fallback={null}> <AuthPageContent /> </Suspense>
);
}

function AuthPageContent() {
const searchParams = useSearchParams();
const mode = searchParams.get("mode");

const [showRoleSelection, setShowRoleSelection] = useState(true);
const [isLogin, setIsLogin] = useState(mode !== "signup");
const [selectedRole, setSelectedRole] = useState("");

// Form state
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [fullName, setFullName] = useState("");
const [instituteName, setInstituteName] = useState("");
const [inviteCode, setInviteCode] = useState("");

// UI state
const [isLoading, setIsLoading] = useState(false);
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [errors, setErrors] = useState({});
const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

const router = useRouter();

// Sync isLogin state when URL query changes
useEffect(() => {
setIsLogin(mode !== "signup");
}, [mode]);

useEffect(() => {
if (analytics) {
logEvent(analytics, "page_view", { page: "auth" });
}
}, []);

const handleRoleSelect = (role) => {
setSelectedRole(role);
setShowRoleSelection(false);
setErrors({});
};

const handleRoleChange = () => {
setShowRoleSelection(true);
setErrors({});
setEmail("");
setPassword("");
setFullName("");
setInstituteName("");
setInviteCode("");
};

const handleToggleLogin = () => {
setIsLogin(!isLogin);
setErrors({});
setPassword("");

```
if (!isLogin) {
  setFullName("");
  setInstituteName("");
  setInviteCode("");
}
```

};

const handleSubmit = async (e) => {
e.preventDefault();

```
const formData = {
  selectedRole,
  email,
  password,
  fullName,
  instituteName,
  inviteCode,
};

const { isValid, errors: validationErrors } = validateForm(
  formData,
  isLogin
);

if (!isValid) {
  setErrors(validationErrors);
  return;
}

setIsLoading(true);
setErrors({});

try {
  let result;

  if (isLogin) {
    result = await loginWithEmail(email, password, selectedRole);
  } else {
    result = await signupWithEmail(email, password, selectedRole, {
      fullName,
      instituteName,
      inviteCode,
    });
  }

  if (result.needsVerification) {
    toast.success("Verification email sent! Please check your inbox.");
    setShowRoleSelection(true);
    router.push("/verify");
  } else if (result.needsProfile) {
    toast.success("Account created successfully!");
    setShowRoleSelection(true);
    router.push("/profile");
  } else if (result.success) {
    toast.success(
      isLogin
        ? "Successfully logged in!"
        : "Account created successfully!"
    );

    setShowRoleSelection(true);
    redirectBasedOnRole(result.userData.role, router);
  } else {
    toast.error(
      result.error || "Authentication failed. Please try again."
    );

    setErrors({
      submit: result.error || "Something went wrong. Please try again.",
    });
  }
} catch (err) {
  toast.error(
    "Authentication failed. Please verify your credentials and try again."
  );

  setErrors({
    submit:
      "Authentication failed. Please verify your credentials and try again.",
  });
} finally {
  setIsLoading(false);
}
```

};

const handleGoogleLogin = async () => {
if (!selectedRole) {
setErrors({ role: "Please select your role first" });
return;
}

```
if (
  !isLogin &&
  selectedRole === USER_ROLES.INSTITUTE &&
  !instituteName.trim()
) {
  setErrors({ instituteName: "Institute name is required" });
  return;
}

setIsLoading(true);
setErrors({});

try {
  const result = await loginWithGoogle(selectedRole, isLogin, {
    fullName,
    instituteName,
  });

  if (result.success) {
    toast.success("Successfully logged in with Google!");
    redirectBasedOnRole(result.userData.role, router);
  } else {
    toast.error(
      result.error ||
        "Google sign-in could not be completed. Please try again."
    );

    setErrors({
      submit:
        result.error ||
        "Google sign-in could not be completed. Please try again.",
    });
  }
} catch (err) {
  toast.error(
    "An unexpected error occurred during Google authentication."
  );

  setErrors({
    submit:
      "An unexpected error occurred during Google authentication.",
  });
} finally {
  setIsLoading(false);
}
```

};

const handleForgotPassword = async (emailToReset) => {
if (!emailToReset) {
setErrors({ forgotEmail: "Please enter your email address" });
return;
}

```
if (!/\S+@\S+\.\S+/.test(emailToReset)) {
  setErrors({ forgotEmail: "Please enter a valid email address" });
  return;
}

setIsLoading(true);
setErrors({});

try {
  const result = await resetPassword(emailToReset);

  if (result.success) {
    toast.success(
      "Password reset email sent! Check your inbox and spam folder."
    );

    setShowForgotPassword(false);
    setForgotPasswordEmail("");
  } else {
    setErrors({ forgotEmail: result.error });
  }
} catch (err) {
  toast.error(
    "Password reset failed. Please verify your email and try again."
  );

  setErrors({
    forgotEmail:
      "Password reset failed. Please verify your email and try again.",
  });
} finally {
  setIsLoading(false);
}
```

};

const handleOpenForgotPassword = () => {
setShowForgotPassword(true);
setForgotPasswordEmail(email);
setErrors({});
};

return ( <div className="min-h-screen pt-10 bg-background"> <Navbar />

```
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>

    <div className="relative min-h-[98vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10">

      {showRoleSelection ? (
        <div className="flex justify-center items-center">
          <div className="w-full max-w-6xl">
            <RoleSelection onRoleSelect={handleRoleSelect} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left Side - Auth Form */}
          <div className="order-2 lg:order-1 w-full">
            <ErrorBoundary>
              <div className="w-full max-w-xl mx-auto">
                <AuthForm
                  isLogin={isLogin}
                  selectedRole={selectedRole}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  fullName={fullName}
                  setFullName={setFullName}
                  instituteName={instituteName}
                  setInstituteName={setInstituteName}
                  inviteCode={inviteCode}
                  setInviteCode={setInviteCode}
                  errors={errors}
                  setErrors={setErrors}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  onGoogleLogin={handleGoogleLogin}
                  onRoleChange={handleRoleChange}
                  onToggleLogin={handleToggleLogin}
                  onForgotPassword={handleOpenForgotPassword}
                />
              </div>
            </ErrorBoundary>
          </div>

          {/* Right Side - Hero Content */}
          <div className="order-1 lg:order-2 flex justify-center items-center">
            <div className="w-full max-w-xl">
              <HeroSection selectedRole={selectedRole} />
            </div>
          </div>

        </div>
      )}
    </div>
  </div>

  <ForgotPasswordModal
    show={showForgotPassword}
    onClose={() => {
      setShowForgotPassword(false);
      setErrors({});
    }}
    onSubmit={handleForgotPassword}
    initialEmail={forgotPasswordEmail}
    error={errors.forgotEmail}
    isLoading={isLoading}
  />
</div>
);
}
