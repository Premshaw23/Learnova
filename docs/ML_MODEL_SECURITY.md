# ML Model Security Best Practices

This document outlines security practices for deploying machine learning models in web applications, with specific guidance for Face API and TensorFlow.js models.

## Supply Chain Security

### Issue: CDN-Hosted Models

Fetching ML models from external CDNs introduces supply chain risks:

- **MITM Attacks**: Models can be intercepted and modified in transit
- **CDN Compromise**: Attacker can replace models with adversarial versions
- **Version Confusion**: No guarantee of model version consistency
- **Integrity Verification**: Difficult to verify model authenticity

### Solution: Local Model Bundling

**Current Implementation:**

```javascript
// ✅ SECURE - Models bundled in public directory
const MODEL_URL = "/models";
await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
```

**Why This Is Safer:**

1. **Versioning**: Models are part of application code version
2. **Deployment Verification**: Same models across all environments
3. **No Network**: No transmission vulnerability window
4. **Integrity**: Changes tracked in version control

## Model Integrity Verification

### File Hashing

While JavaScript doesn't support SRI for arbitrary assets, local loading provides integrity through:

```python
import hashlib
import os

for filename in os.listdir("public/models"):
    filepath = os.path.join("public/models", filename)
    with open(filepath, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    print(f"{filename}: {sha256}")
```

Store checksums in git and verify after cloning:

```bash
#!/bin/bash
# Verify model integrity
python3 -c "
import hashlib
import json

with open('model_checksums.json') as f:
    expected = json.load(f)

for filename, expected_hash in expected.items():
    with open(f'public/models/{filename}', 'rb') as f:
        actual = hashlib.sha256(f.read()).hexdigest()
    if actual != expected_hash:
        print(f'MISMATCH: {filename}')
        exit(1)

print('✓ All models verified')
"
```

### Model Updates

When updating models:

1. **Source Verification**: Download from official repository only
2. **Hash Verification**: Compare against known good hashes
3. **Local Testing**: Test accuracy before deployment
4. **Git Tracking**: Commit with message noting model version
5. **Performance Testing**: Verify performance hasn't degraded

```bash
# Example: Update face_recognition_model
wget https://github.com/vladmandic/face-api.js/raw/master/public/models/face_recognition_model-*.* \
  -O public/models/face_recognition_model-shard
  
# Verify size matches expected
ls -lh public/models/face_recognition_model-*
```

## Adversarial Model Attacks

### Risks

ML models can be attacked with adversarial inputs:

- **Face Spoofing**: Photos/videos can fool face detection
- **Liveness Detection**: Required for attendance use cases
- **Cross-Model Attacks**: Adversarial input affects all models

### Mitigations in Place

**Liveness Detection** (Issue #3966):

```javascript
// Require active blink or smile to prevent photo spoofing
if (blinkStateRef.current.challengeType === "blink") {
  // User must actively blink (not just a photo)
  const ear = getAverageEAR(leftEye, rightEye);
  if (ear < EAR_THRESHOLD) {
    blinkStateRef.current.isEyeClosed = true;
  }
}
```

**Face Confidence Threshold:**

```javascript
const MIN_CONFIDENCE_TO_RECORD = 60;
if (confidenceScore < MIN_CONFIDENCE_TO_RECORD) {
  return; // Reject low-confidence matches
}
```

## Performance Considerations

### Model Size vs Speed

Current models are intentionally tuned for browser performance:

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| tinyFaceDetector | 190 KB | 100-200ms | 98% |
| faceLandmark68 | 356 KB | 10-20ms | 99% |
| faceRecognition | ~6 MB | 50-100ms | 99.5% |
| faceExpression | 329 KB | 5-10ms | 95% |

### Loading Optimization

```javascript
// Web Worker offloads model loading from main thread
const worker = new Worker("/faceWorker.js");
worker.postMessage({ type: "LOAD_MODELS", modelUrl: MODEL_URL });
```

## Privacy Considerations

### Local Processing

- **No Cloud Upload**: All face detection happens in browser
- **No Model Telemetry**: Models don't phone home
- **User Control**: User can disable camera anytime

### Avoid:

```javascript
// ❌ DO NOT send face images to server for analysis
const imageData = canvas.toDataURL();
await fetch("/api/analyze-face", { body: imageData }); // Bad privacy!
```

### Instead:

```javascript
// ✅ Process locally, send only derived data
const faceDescriptor = detection.descriptor; // 128-float array
await fetch("/api/verify-match", { 
  body: JSON.stringify({ descriptor: Array.from(faceDescriptor) })
});
```

## Monitoring & Updates

### Model Performance Monitoring

Track model accuracy over time:

```javascript
const result = await faceapi
  .detectSingleFace(image)
  .withFaceLandmarks()
  .withFaceDescriptor();

// Log confidence for analysis
if (result) {
  console.log("Detection confidence:", result.detection.score);
  // Could send telemetry: analytics.logEvent('face_detection', { score })
}
```

### Model Versioning

Include model version in application:

```javascript
// .env or config
NEXT_PUBLIC_FACE_API_VERSION=1.0.0
FACE_API_MODELS_SHA256=abc123...

// In app
console.log(`Face API Models v${process.env.NEXT_PUBLIC_FACE_API_VERSION}`);
```

## Deployment Checklist

- [ ] All model files present in `public/models/`
- [ ] No external CDN URLs in code
- [ ] Model checksums computed and verified
- [ ] Liveness detection enabled (not just photo matching)
- [ ] Confidence threshold set appropriately (MIN_CONFIDENCE_TO_RECORD)
- [ ] Camera cleanup on unmount (no stream leaks)
- [ ] Performance tested on target devices
- [ ] Privacy implications documented
- [ ] Model versioning tracked in git
- [ ] Update procedure documented

## Related Issues

- **Issue #3964**: Face API model weights integrity
- **Issue #3966**: Camera stream resource cleanup
- **Component**: `components/FaceRecognizer.js`
- **Model Files**: `public/models/`

## References

- [Face-API.js Security](https://github.com/vladmandic/face-api.js)
- [OWASP: Supply Chain Security](https://owasp.org/www-community/attacks/Supply_chain_attack)
- [Adversarial Examples](https://arxiv.org/abs/1312.6199)
- [TensorFlow.js Privacy](https://www.tensorflow.org/js/guide/platform_environment)
- [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
