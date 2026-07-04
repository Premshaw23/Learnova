# Face API Model Files

This directory contains locally bundled TensorFlow.js models for face recognition, face detection, landmarks, and expression detection. These models are loaded locally rather than from external CDNs to ensure integrity and prevent supply chain attacks.

## Bundled Models

All models are derived from the `face-api.js` library and include:

- **tiny_face_detector_model**: Fast face detection with reduced accuracy
- **ssd_mobilenetv1_model**: Accurate face detection via SSD MobileNetV1
- **face_landmark_68_model**: 68-point facial landmark detection
- **face_landmark_68_tiny_model**: Reduced-size landmark detection
- **face_recognition_model**: Deep face recognition embeddings (ResNet-50)
- **face_expression_model**: 7-class expression classification (sad, happy, etc.)

## Security & Integrity

### Local Loading Only

Models are loaded from the local `/models` path (served by Next.js public directory):

```javascript
// ✅ SECURE - Loaded from local public directory
const MODEL_URL = "/models";
await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
```

**NOT** from external CDNs:

```javascript
// ❌ INSECURE - Do not use external CDN URLs
// https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/

// ❌ INSECURE - Do not use GitHub raw content
// https://github.com/vladmandic/face-api.js/blob/master/public/models/
```

### Integrity Verification

While Next.js doesn't automatically provide SRI (Subresource Integrity) for static assets, local loading provides:

1. **No Network Tampering**: Models cannot be modified in transit
2. **Version Control**: Model files tracked in git
3. **Deployment Verification**: Models deployed as part of application bundle
4. **Reproducible Builds**: Same models across all environments

### Model Updates

To update model files:

1. Download fresh models from the official `face-api.js` repository
2. Verify model integrity (compare file sizes and hashes with upstream)
3. Replace files in this directory
4. Test face recognition accuracy before deploying
5. Commit changes with detailed notes on model version updates

## File Structure

Each model consists of:

- `{model_name}-weights_manifest.json`: Model metadata and shard references
- `{model_name}-shard1`, `{model_name}-shard2`, etc.: Actual model weights

The sharded format allows efficient distribution of large model files.

## Performance Considerations

- **First Load**: Models are cached by browser after first load (Service Worker)
- **Total Size**: ~12-15 MB uncompressed (compressed during build)
- **Load Time**: Typically 2-5 seconds on first visit
- **Subsequent Loads**: < 100ms from cache

## Deployment

Models are served by Next.js static file handler:

- **Development**: `http://localhost:3000/models/`
- **Production**: CDN + origin fallback (configured by deployment platform)
- **Caching**: Set to immutable cache headers (safe due to versioning via app)

## Troubleshooting

### Models not loading

1. Check browser DevTools Network tab for 404s
2. Verify Next.js is serving `/public/models/` as `/models/`
3. Check CORS headers if models are served from different domain
4. Clear browser cache and reload

### Face detection not working

1. Verify all model files are present (check file listing above)
2. Check console for TensorFlow.js errors
3. Ensure camera permissions are granted
4. Test with good lighting and face clearly visible

## Related Issues

- **Issue #3964**: Face API model weights supply chain security
- **Issue #3966**: Camera stream cleanup on unmount
- **Component**: `components/FaceRecognizer.js`

## References

- [face-api.js GitHub](https://github.com/vladmandic/face-api.js)
- [TensorFlow.js Models](https://www.tensorflow.org/js/models)
- [SRI - Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [Supply Chain Security](https://owasp.org/www-community/Supply_chain_attack)
