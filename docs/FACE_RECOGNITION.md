# Face Recognition Setup

Learnova uses [Face API.js](https://github.com/justadudewhohacks/face-api.js) for contactless attendance via webcam. This guide covers everything you need to get face recognition running locally and in production.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Required Model Files](#required-model-files)
- [Folder Structure](#folder-structure)
- [Downloading the Models](#downloading-the-models)
- [Supported Browsers & Devices](#supported-browsers--devices)
- [Minimum Camera Requirements](#minimum-camera-requirements)
- [Fallback Behaviour](#fallback-behaviour)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## How It Works

1. A teacher or student opens the attendance page.
2. The browser requests webcam access.
3. Face API.js loads pre-trained model weights from `/public/models/`.
4. The live video stream is analysed frame-by-frame in the browser — **no video is sent to any server**.
5. Detected faces are matched against stored face descriptors in MongoDB.
6. A match marks the student present; no match triggers the fallback flow.

---

## Required Model Files

Six model files are needed. All are loaded from `/public/models/` at runtime.

| Model | Purpose | Files |
|---|---|---|
| `tiny_face_detector` | Fast face detection in the video frame | `tiny_face_detector_model-weights_manifest.json`, `tiny_face_detector_model-shard1` |
| `face_landmark_68` | Maps 68 facial landmark points | `face_landmark_68_model-weights_manifest.json`, `face_landmark_68_model-shard1` |
| `face_recognition` | Generates a 128-D face descriptor for matching | `face_recognition_model-weights_manifest.json`, `face_recognition_model-shard1`, `face_recognition_model-shard2` |

> The `face_expression` and `age_gender` models are **not** required for attendance — do not add them unless you extend the feature.

---

## Folder Structure

```
public/
└── models/
    ├── tiny_face_detector_model-weights_manifest.json
    ├── tiny_face_detector_model-shard1
    ├── face_landmark_68_model-weights_manifest.json
    ├── face_landmark_68_model-shard1
    ├── face_recognition_model-weights_manifest.json
    ├── face_recognition_model-shard1
    └── face_recognition_model-shard2
```

The path prefix used in `components/FaceRecognizer.js` is `/models` — this maps to `public/models/` in Next.js. Do not rename the folder or the model files.

---

## Downloading the Models

### Option A — GitHub (recommended)

Download only the seven files listed above from the official weights repository:

```
https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

Click each file → **Raw** → Save As into `public/models/`.

### Option B — npm package (alternative)

The weights are also bundled with the npm package:

```bash
# after npm install, copy from node_modules
cp node_modules/face-api.js/weights/* public/models/
```

This copies all model files including ones not needed — that is fine, the extras are simply never loaded.

### Option C — curl (fastest for terminal users)

```bash
BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
mkdir -p public/models

curl -L "$BASE/tiny_face_detector_model-weights_manifest.json" -o public/models/tiny_face_detector_model-weights_manifest.json
curl -L "$BASE/tiny_face_detector_model-shard1" -o public/models/tiny_face_detector_model-shard1
curl -L "$BASE/face_landmark_68_model-weights_manifest.json" -o public/models/face_landmark_68_model-weights_manifest.json
curl -L "$BASE/face_landmark_68_model-shard1" -o public/models/face_landmark_68_model-shard1
curl -L "$BASE/face_recognition_model-weights_manifest.json" -o public/models/face_recognition_model-weights_manifest.json
curl -L "$BASE/face_recognition_model-shard1" -o public/models/face_recognition_model-shard1
curl -L "$BASE/face_recognition_model-shard2" -o public/models/face_recognition_model-shard2
```

---

## Supported Browsers & Devices

Face API.js runs entirely in the browser using WebGL and the Canvas API.

### Desktop browsers

| Browser | Supported | Notes |
|---|---|---|
| Chrome 80+ | ✅ Yes | Recommended — best WebGL performance |
| Edge 80+ | ✅ Yes | Chromium-based, same as Chrome |
| Firefox 75+ | ✅ Yes | Slightly lower WebGL performance |
| Safari 14+ | ✅ Yes | Requires macOS 11+ or iOS 14+ |
| Safari < 14 | ❌ No | Missing required WebGL extensions |
| Internet Explorer | ❌ No | Not supported |

### Mobile browsers

| Browser | Supported | Notes |
|---|---|---|
| Chrome for Android | ✅ Yes | Android 8+ recommended |
| Safari for iOS | ✅ Yes | iOS 14+ required |
| Samsung Internet | ✅ Yes | Version 12+ |
| Firefox for Android | ⚠️ Partial | Camera access may be restricted |

### PWA / installed app

Learnova is a PWA. When installed on a device, face recognition works the same as in the browser as long as the OS grants camera permission to the browser engine.

---

## Minimum Camera Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Resolution | 480p (640×480) | 720p (1280×720) |
| Frame rate | 15 fps | 30 fps |
| Lighting | Indoor ambient light | Evenly lit, no strong backlight |
| Connection | Any (processing is local) | — |

> **HTTPS required.** Browsers block camera access on non-`localhost` HTTP origins. In production the app must be served over HTTPS. Vercel handles this automatically.

---

## Fallback Behaviour

When face recognition cannot complete successfully, Learnova handles it as follows:

| Scenario | What happens |
|---|---|
| Camera permission denied | An in-page prompt asks the user to allow camera access and reload |
| Model files not found (404) | An error is shown: "Face recognition unavailable — contact your administrator" |
| Face not detected after 10 seconds | The user is prompted to reposition and try again |
| Face detected but no match found | Attendance is **not** marked; the teacher is notified to verify manually |
| WebGL not available (old browser) | A browser compatibility warning is shown; the user is asked to upgrade |
| Low light / obscured face | Detection confidence falls below threshold; the user is prompted to improve lighting |

No attendance record is created for a failed recognition — it is always better to require manual verification than to record a false positive.

---

## Known Limitations

- **Processing is CPU/GPU intensive.** On low-end devices the frame analysis may drop to 5–10 fps. This does not affect accuracy but may feel slow.
- **Glasses and face masks reduce accuracy.** Face API.js landmark detection is less reliable when significant facial features are obscured.
- **Identical twins.** The 128-D descriptor model may not reliably distinguish identical twins.
- **Model load time.** The three model files total ~6 MB. On a slow connection the first load may take several seconds. Models are cached by the browser after the first load.
- **No offline support for first load.** The models must be fetched from `/public/models/` on first use. Once cached by the browser, subsequent loads work offline (PWA cache).
- **Single face per frame.** The current implementation processes one face at a time. Bulk attendance (multiple faces simultaneously) is not supported yet.
- **iOS Safari camera orientation.** On some iPhone models the camera feed may appear rotated. This is a known WebRTC quirk on iOS; a CSS transform fix is applied in `FaceRecognizer.js`.

---

## Troubleshooting

For common errors (model 404s, camera denied, no face detected), see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#4-face-api--model-files).

For bugs not covered there, open an [issue](https://github.com/Premshaw23/Learnova/issues) with:
- Your browser name and version
- Your OS and device
- The exact error message from the browser console
- A screenshot if possible
