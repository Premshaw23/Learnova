export const PERMISSIONS = {
  VIEW_ANALYTICS: 'view:analytics',
  MANAGE_SETTINGS: 'manage:settings',
  TAKE_ATTENDANCE: 'take:attendance',
  VIEW_ATTENDANCE: 'view:attendance',
  MANAGE_CLASSES: 'manage:classes',
  MANAGE_USERS: 'manage:users',
  SUBMIT_COMPLAINTS: 'submit:complaints',
  VIEW_COMPLAINTS: 'view:complaints',
};

export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.TAKE_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.SUBMIT_COMPLAINTS,
    PERMISSIONS.VIEW_COMPLAINTS,
  ],
  teacher: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.TAKE_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.SUBMIT_COMPLAINTS,
  ],
  institute: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.SUBMIT_COMPLAINTS,
  ],
  student: [
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.SUBMIT_COMPLAINTS,
  ],
  parent: [
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.SUBMIT_COMPLAINTS,
  ],
};

export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role.toLowerCase()];
  return permissions ? permissions.includes(permission) : false;
}
