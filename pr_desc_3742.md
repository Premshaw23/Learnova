### Is your feature request related to a problem? Please describe.
I'm always frustrated when critical, time-sensitive alerts (like severe weather closures, campus security threats, or emergency evacuations) are buried in the standard Notice Board alongside routine announcements, delaying awareness for students and parents. (Resolves #3742)

### Describe the solution you'd like
I have added an "Emergency" priority level to the Notice Board system. When a notice is published with this priority, a persistent, non-dismissible red banner (`EmergencyBanner`) will instantly appear at the top of every dashboard across the Learnova platform, pushing immediate awareness to all targeted users. This banner persists until the user explicitly clicks the 'Acknowledge' button.

### Describe alternatives you've considered
I considered integrating an external SMS system for emergency broadcasts, but that fractures communication and reduces engagement on Learnova. By creating the `EmergencyBanner` component that leverages the existing real-time `FirestoreContext` stream, we achieve instantaneous web alerts natively within the app.

### Additional Context
By checking for unacknowledged 'emergency' notices centrally in `ClientLayout`, we guarantee that users see the alert immediately regardless of what dashboard or page they are currently browsing. Local storage is used safely to maintain the acknowledgment state per user session.
