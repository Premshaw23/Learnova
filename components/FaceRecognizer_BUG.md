# Medium: Webcam memory leak & ReferenceError on unmount

**Summary**
- A medium-severity bug in the `FaceRecognizer` component causes a runtime error on unmount and can lead to retained TensorFlow variables / webcam resources (memory leak / persistent camera activation).

**Affected file**: components/FaceRecognizer.js

**Symptoms / Reproduction**
- Navigate to the attendance/face-recognition page that mounts `FaceRecognizer`.
- Navigate away or unmount the component.
- Observe console errors (ReferenceError) and/or camera remaining active after leaving the page.

**Root cause**
- In the cleanup function of the main `useEffect`, the code attempts to call `faceapi.tf?.disposeVariables()` but `faceapi` is not defined in that scope. Referencing `faceapi` directly causes a `ReferenceError`, preventing proper disposal and leaving WebRTC tracks or TF variables alive.

**Proposed fix**
1. Guard the cleanup against `faceapi` being undefined by dynamically importing `face-api.js` inside the cleanup and then disposing TensorFlow variables if available. Since the cleanup cannot be `async`, use a promise-based import.

Suggested snippet to replace the existing cleanup disposal block:

```js
// inside the useEffect cleanup
if (typeof window !== 'undefined') {
  import('face-api.js')
    .then((faceapi) => {
      try {
        if (faceapi?.tf?.disposeVariables) {
          faceapi.tf.disposeVariables();
        }
      } catch (e) {
        console.warn('Failed to dispose face-api tensors:', e);
      }
    })
    .catch(() => {
      // ignore: face-api may not have been loaded or available
    });
}
```

2. Ensure other cleanup steps already present are kept: `cancelAnimationFrame`, stop media tracks (`getTracks().forEach(t=>t.stop())`), pause video and clear `srcObject`.

**Why this fixes it**
- Dynamically importing `face-api.js` within cleanup avoids referencing an out-of-scope `faceapi` variable. If the library was loaded earlier, the import will resolve quickly and allow calling `disposeVariables`. If it wasn't loaded, the catch path avoids throwing. This allows TensorFlow resources to be released and avoids leaving the camera or TF memory allocated.

**Severity**: Medium — can crash user UI or cause degraded performance and privacy issues (camera left active).

**Next steps / PR**
- Patch `components/FaceRecognizer.js` cleanup to use promise import as shown above and add a small unit / manual test that mounts/unmounts the component and confirms no active camera tracks remain.
