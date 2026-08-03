/**
 * ============================================================================
 * 📦 MIGRATION REGISTRY (Issue #4225)
 * ============================================================================
 * Registers all available migrations in order.
 */

import EncryptFaceDescriptors from "./001_encrypt_face_descriptors";
import AddAttendanceIndexes from "./002_add_attendance_indexes";
import SyncNoticeAudiences from "./003_sync_notice_audiences";
import StandardizeQuizSessions from "./004_standardize_quiz_sessions";
import AddAuditFields from "./005_add_audit_fields";

/**
 * All migrations in order. Add new migrations to the end of this array.
 */
const migrations = [
  new EncryptFaceDescriptors(),
  new AddAttendanceIndexes(),
  new SyncNoticeAudiences(),
  new StandardizeQuizSessions(),
  new AddAuditFields(),
];

export default migrations;
