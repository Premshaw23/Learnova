/**
 * faceWorker.js
 * Place this file at: public/faceWorker.js
 *
 * Loads face-api.js models in a Web Worker so the main thread is never blocked.
 */

importScripts('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');

self.addEventListener('message', async (event) => {
  if (event.data?.type !== 'LOAD_MODELS') return;

  const { modelUrl } = event.data;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
      faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
    ]);

    self.postMessage({ type: 'MODELS_LOADED' });
  } catch (err) {
    self.postMessage({ type: 'MODELS_ERROR', error: err?.message || String(err) });
  }
});