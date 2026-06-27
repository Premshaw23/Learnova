export async function validateRoleChange(adminDb, uid, requestedRole) {
  const ALLOWED_ROLES = ["student", "teacher", "admin", "parent"];
  if (!ALLOWED_ROLES.includes(requestedRole)) {
    throw new Error("Invalid role");
  }

  const callerProfile = await adminDb.collection("users").doc(uid).get();
  if (!callerProfile.exists) {
    throw new Error("User profile not found");
  }

  const currentRole = callerProfile.data()?.role;

  if (requestedRole === "admin" && currentRole !== "admin") {
    throw new Error("Only admins can assign admin role");
  }

  if (
    (requestedRole === "teacher" || requestedRole === "admin") &&
    currentRole === "student"
  ) {
    throw new Error("Role promotion requires admin approval");
  }
}
