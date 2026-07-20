import { describe, it, expect } from 'vitest';
import { hasPermission, PERMISSIONS } from '../../constants/permissions';

describe('Permissions Matrix & RBAC Helper', () => {
  it('should grant admin all permissions', () => {
    Object.values(PERMISSIONS).forEach((permission) => {
      expect(hasPermission('admin', permission)).toBe(true);
    });
  });

  it('should grant teacher specific permissions and deny admin-only permissions', () => {
    expect(hasPermission('teacher', PERMISSIONS.TAKE_ATTENDANCE)).toBe(true);
    expect(hasPermission('teacher', PERMISSIONS.MANAGE_SETTINGS)).toBe(true);
    expect(hasPermission('teacher', PERMISSIONS.MANAGE_USERS)).toBe(false); // Admin only
    expect(hasPermission('teacher', PERMISSIONS.VIEW_COMPLAINTS)).toBe(false); // Admin only
  });

  it('should grant student basic permissions and deny instructor/admin permissions', () => {
    expect(hasPermission('student', PERMISSIONS.VIEW_ATTENDANCE)).toBe(true);
    expect(hasPermission('student', PERMISSIONS.SUBMIT_COMPLAINTS)).toBe(true);
    expect(hasPermission('student', PERMISSIONS.TAKE_ATTENDANCE)).toBe(false);
    expect(hasPermission('student', PERMISSIONS.MANAGE_SETTINGS)).toBe(false);
  });

  it('should return false for invalid or unmapped roles', () => {
    expect(hasPermission('guest', PERMISSIONS.VIEW_ATTENDANCE)).toBe(false);
    expect(hasPermission(null, PERMISSIONS.VIEW_ATTENDANCE)).toBe(false);
    expect(hasPermission('student', null)).toBe(false);
  });

  it('should be case-insensitive for role names', () => {
    expect(hasPermission('sTuDeNt', PERMISSIONS.VIEW_ATTENDANCE)).toBe(true);
    expect(hasPermission('ADMIN', PERMISSIONS.MANAGE_USERS)).toBe(true);
  });
});
