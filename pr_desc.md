### Is your feature request related to a problem? Please describe.
I'm always frustrated when classroom Wi-Fi goes down or is spotty, preventing the Face API.js attendance system from logging students in real-time. This forces teachers to revert to manual roll-calls, defeating the purpose of the platform. (Resolves #3744)

### Describe the solution you'd like
I have implemented offline synchronization capability in the `FaceRecognizer` component. It now leverages the `offlineSyncQueue` service to correctly cache facial recognition data and attendance logs locally on the device when offline, and automatically syncs them to the backend once a network connection is re-established.

### Describe alternatives you've considered
An alternative was modifying the backend to handle batched array payloads in a different manner, but utilizing the existing `syncOfflineQueue` service with a fetch callback keeps the system architecture consistent with the teacher dashboard's offline sync implementation.

### Additional Context
This implementation completely resolves the broken synchronization logic in the `syncAttendanceQueue` by cleanly replacing it with the correctly implemented `syncOfflineQueue` and ensuring all offline checks process perfectly using IndexedDB.
