/**
 * ============================================================================
 * 🧠 DEDICATED FACE-API.JS WEB WORKER (ISSUE #3255)
 * ============================================================================
 * This worker runs entirely on a separate background thread. It handles all
 * heavy Machine Learning tensor operations, freeing up the main browser thread
 * to maintain a buttery-smooth 60fps React UI.
 */

// We import face-api.js from a CDN or local public folder for the worker context.
// Ensure face-api.min.js is available in your public directory or adjust this URL.
importScripts('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js');

let faceMatcher = null;
let isModelLoaded = false;
let isProcessing = false;

// Configuration Constants
const MODEL_URL = '/models'; // Must be accessible from the worker's scope
const MIN_CONFIDENCE = 0.6;

/**
 * Initialize Models and Build Face Matcher
 * @param {Array} labels - The labeled face descriptors from the database
 */
async function initWorker(labels) {
  try {
    postMessage({ type: 'STATUS', message: 'Loading ML Models in background...' });
    
    // Load the tiny face detector and landmarks/recognition nets
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    postMessage({ type: 'STATUS', message: 'Models loaded. Building Face Matcher...' });

    if (!labels || labels.length === 0) {
      postMessage({ type: 'ERROR', error: 'No labeled faces provided to worker.' });
      return;
    }

    const labeledFaceDescriptors = await Promise.all(
      labels.map(async (student) => {
        try {
          if (student.faceDescriptor && Array.isArray(student.faceDescriptor) && student.faceDescriptor.length > 0) {
            return new faceapi.LabeledFaceDescriptors(
              student.name,
              [new Float32Array(student.faceDescriptor)]
            );
          }
          return null;
        } catch (err) {
          console.error("Worker descriptor error:", err);
          return null;
        }
      })
    );

    const validDescriptors = labeledFaceDescriptors.filter(Boolean);

    if (validDescriptors.length > 0) {
      faceMatcher = new faceapi.FaceMatcher(validDescriptors, MIN_CONFIDENCE);
      isModelLoaded = true;
      postMessage({ type: 'INIT_SUCCESS', message: 'Worker ready and listening.' });
    } else {
      postMessage({ type: 'ERROR', error: 'Could not construct FaceMatcher.' });
    }
  } catch (error) {
    postMessage({ type: 'ERROR', error: error.message });
  }
}

/**
 * Process a single video frame sent from the main thread via OffscreenCanvas/ImageData
 * @param {ImageData} imageData - The raw pixel data of the video frame
 * @param {Object} displaySize - Width and height of the video element
 */
async function processFrame(imageData, displaySize) {
  if (!isModelLoaded || !faceMatcher || isProcessing) return;

  isProcessing = true;

  try {
    // Convert ImageData back into a tensor for face-api
    const tensor = faceapi.tf.browser.fromPixels(imageData);

    // Detect faces in the background thread
    const detections = await faceapi
      .detectAllFaces(tensor, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Resize results to match the original video display size
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    if (resizedDetections.length > 0) {
      const face = resizedDetections[0];
      const bestMatch = faceMatcher.findBestMatch(face.descriptor);
      
      // Calculate EAR for liveness detection directly in the worker
      const leftEye = face.landmarks.getLeftEye();
      const rightEye = face.landmarks.getRightEye();
      const ear = getAverageEAR(leftEye, rightEye);

      // Serialize the response back to the main thread
      postMessage({
        type: 'DETECTION_RESULT',
        payload: {
          hasFace: true,
          label: bestMatch.label,
          distance: bestMatch.distance,
          confidenceScore: Math.round((1 - bestMatch.distance) * 100),
          box: {
            x: face.detection.box.x,
            y: face.detection.box.y,
            width: face.detection.box.width,
            height: face.detection.box.height
          },
          ear: ear
        }
      });
    } else {
      postMessage({
        type: 'DETECTION_RESULT',
        payload: { hasFace: false }
      });
    }

    // CRITICAL: Prevent memory leaks by disposing of the tensor
    tensor.dispose();
  } catch (error) {
    console.error("Worker processing error:", error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Calculate Eye Aspect Ratio (EAR) for blink detection
 */
function getAverageEAR(leftEye, rightEye) {
  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  return (leftEAR + rightEAR) / 2;
}

function calculateEAR(eye) {
  const p2_p6 = distance(eye[1], eye[5]);
  const p3_p5 = distance(eye[2], eye[4]);
  const p1_p4 = distance(eye[0], eye[3]);
  return (p2_p6 + p3_p5) / (2.0 * p1_p4);
}

function distance(point1, point2) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

// Listen for messages from the main React thread
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      await initWorker(payload.labels);
      break;
    case 'PROCESS_FRAME':
      await processFrame(payload.imageData, payload.displaySize);
      break;
    default:
      console.warn('Unknown message type received in worker:', type);
  }
};