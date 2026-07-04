### Is your feature request related to a problem? Please describe.
I'm always frustrated when students attempt to spoof the face recognition attendance system by showing a photograph or playing a video of themselves on their phones in front of the camera, leading to inaccurate attendance records and fraudulent check-ins. (Resolves #3743)

### Describe the solution you'd like
I have integrated an enhanced Liveness Detection check directly into the Face API.js flow. While blinking detection using Eye Aspect Ratio (EAR) was previously added, this update randomizes the challenge between a "Blink" challenge and a "Smile" challenge (using the `face.expressions` API). This minor randomized action verifies that a live person is in front of the camera before logging attendance.

### Describe alternatives you've considered
An alternative was requiring teachers to audit the automated attendance manually to catch spoofing attempts, or strictly using depth-sensing algorithms (which aren't universally supported on all student devices). The randomized expression/blink challenge works natively on any 2D camera through face-api.js.

### Additional Context
Spoofing is a critical vulnerability for any automated attendance system. Integrating this robust randomized liveness check ensures the integrity of the attendance data reported to the Parent and Institute dashboards.
