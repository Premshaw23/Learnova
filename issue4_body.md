## Description

Learnova runs a dual-database architecture with Firestore (primary) and MongoDB (secondary/legacy). There is no formal migration framework to manage schema changes, data transformations, or rollbacks between these systems. Currently, schema changes are applied ad-hoc across multiple files (`lib/firestorePool.js`, `lib/mongodb.js`, `lib/transactionCoordinator.js`) leading to inconsistent data states and difficult-to-debug sync issues.

## Why This Is Important

- **Dual-write inconsistency**: When a schema change is made in Firestore, the corresponding MongoDB collection may not be updated, causing data drift
- **No rollback capability**: If a schema migration breaks production, there is no automated way to revert
- **Transaction complexity**: `lib/transactionCoordinator.js` attempts cross-database transactions but lacks proper idempotency guarantees
- **Recent issues**: The attendance sync fix (#4061) required manual intervention because there was no migration tooling to handle the schema change

## Proposed Implementation

### 1. Migration Framework Core
- Create `lib/migrations/migrationRunner.js` - Core migration execution engine
- Create `lib/migrations/migrationSchema.js` - Migration metadata schema
- Create `lib/migrations/Migration.js` - Base migration class with up/down methods
- Create `lib/migrations/MigrationHistory.js` - Tracks applied migrations per environment

### 2. Migration Types
- **Schema Migration**: Add/remove/rename fields in Firestore collections and MongoDB collections
- **Data Migration**: Transform existing data (e.g., encrypt face descriptors, restructure attendance records)
- **Index Migration**: Create/drop Firestore composite indexes and MongoDB indexes
- **Validation Migration**: Add field validation rules and constraints

### 3. Cross-Database Sync Validation
- Create `lib/migrations/syncValidator.js` - Validates data consistency between Firestore and MongoDB
- Implement checksum-based comparison for collections
- Add a sync health dashboard for admins
- Create automated daily sync validation cron job

### 4. Migration CLI
- Add `npm run migrate` command for running migrations
- Add `npm run migrate:status` to show applied migrations
- Add `npm run migrate:rollback` to revert last migration
- Add `npm run migrate:validate` to check sync health
- Add `npm run migrate:seed` to seed development data

### 5. Safety Features
- Dry-run mode that shows what changes would be made without applying them
- Backup before migration (export affected collections to JSON)
- Lock mechanism to prevent concurrent migrations
- Migration timeout handling for long-running operations
- Automatic rollback on failure with configurable retry count

### 6. Migration Files for Existing Schema Drift
- Migration 001: Encrypt face descriptors in MongoDB (addresses issue #4221)
- Migration 002: Add indexes for attendance queries (addresses issue #4220)
- Migration 003: Sync notice board audience targeting between Firestore and MongoDB
- Migration 004: Standardize quiz session schema across databases
- Migration 005: Add audit log fields to all mutation endpoints

## Files to Modify/Create
- `lib/migrations/migrationRunner.js` - Core engine
- `lib/migrations/Migration.js` - Base class
- `lib/migrations/MigrationHistory.js` - History tracker
- `lib/migrations/syncValidator.js` - Cross-DB validator
- `lib/migrations/001_encrypt_face_descriptors.js`
- `lib/migrations/002_add_attendance_indexes.js`
- `lib/migrations/003_sync_notice_audiences.js`
- `lib/migrations/004_standardize_quiz_sessions.js`
- `lib/migrations/005_add_audit_fields.js`
- `scripts/migrate.js` - CLI entry point
- `scripts/migrate-status.js` - Status command
- `scripts/migrate-rollback.js` - Rollback command
- `app/api/admin/migrations/route.js` - Admin migration API
- `app/api/admin/migrations/status/route.js` - Migration status API
- `components/dashboard/MigrationDashboard.jsx` - Admin UI
- `tests/migrations/migrationRunner.test.js` - Core tests
- `tests/migrations/syncValidator.test.js` - Sync validation tests
- `tests/migrations/migrations.test.js` - Individual migration tests

## Expected Impact

- **Data Integrity**: Consistent schema across Firestore and MongoDB
- **Rollback Safety**: Automated revert capability for failed migrations
- **Developer Productivity**: CLI tooling for schema management
- **Operational Visibility**: Migration status dashboard and sync health monitoring
