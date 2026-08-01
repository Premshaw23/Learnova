## Description

The offline support in Learnova is currently fragmented across multiple services and storage mechanisms. There are at least 3 different offline queue implementations (services/offlineSyncQueue.js, services/offlineSyncService.js, utils/offlineSyncValidator.js, utils/offlineRequestHandler.js, db/offlineStore.js) that don't share a common conflict resolution strategy. When a student marks attendance offline and the teacher simultaneously overrides it, the last-write-wins strategy can silently discard one of the changes.

## Why This Is Important

- Multiple disconnected offline stores: IndexedDB (via offlineStore.js), localStorage (via offlineSyncQueue.js), and Service Worker cache are used independently
- No vector clocks or versioning: The conflictResolver.js uses timestamp-based comparison which fails during clock skew between devices
- Data loss risk: Students in areas with poor connectivity may lose attendance records, quiz submissions, or activity logs
- Recent bug patterns: Issues #4061 (back-dating), #4039 (duplicate alerts) are symptoms of poor sync coordination

## Proposed Implementation

### 1. Unified Offline Storage Layer
- Create a single lib/offlineStorage.js that wraps IndexedDB with a consistent schema
- Define a common OfflineRecord type with id, version, vectorClock, createdAt, syncedAt
- Migrate all existing offline stores to use this unified layer

### 2. Conflict Resolution Strategy
- Implement Operational Transformation (OT) or CRDT-based merge for attendance records
- Add conflict detection that identifies when two users modified the same record while offline
- Provide a conflict resolution UI for teachers when merge is ambiguous
- Auto-resolve non-conflicting changes (e.g., student marks present, teacher adds a note)

### 3. Sync Protocol
- Implement a two-phase sync: (1) upload local changes, (2) download remote changes
- Add sync status indicators in the UI (pending, syncing, synced, conflict)
- Implement exponential backoff retry with jitter for failed syncs
- Add a sync dashboard for admins to monitor sync health

### 4. Offline Queue Improvements
- Add priority queues: attendance > quiz submissions > activity logs
- Implement deduplication using idempotency keys
- Add queue persistence across browser restarts via IndexedDB
- Implement queue size limits with oldest-first eviction

### 5. Testing
- Add offline simulation tests using Playwright's offline mode
- Test conflict resolution with concurrent modifications
- Test sync recovery after extended offline periods
- Load test with 100+ concurrent offline users

## Files to Modify/Create
- lib/offlineStorage.js - New unified offline storage layer
- lib/offlineSync.js - New sync protocol implementation
- lib/conflictResolver.js - Upgrade to CRDT-based resolution
- services/offlineSyncQueue.js - Refactor to use unified storage
- services/offlineSyncService.js - Refactor to use unified storage
- utils/offlineSyncValidator.js - Update validation for new schema
- utils/offlineRequestHandler.js - Update to use unified storage
- db/offlineStore.js - Deprecate and migrate to unified storage
- components/OfflineSyncTracker.jsx - Add sync status UI
- components/SyncStatusBadge.jsx - Add sync health indicator
- tests/offline/conflict-resolution.test.js - New test suite
- tests/offline/sync-protocol.test.js - New test suite
- tests/offline/concurrent-modifications.test.js - New test suite

## Expected Impact
- Data Integrity: Zero data loss during offline-to-online transitions
- Conflict Resolution: Deterministic, auditable merge strategy
- Developer Experience: Single offline API for all features
- User Trust: Visible sync status and conflict resolution UI
