"use client";

/**
 * Loads a File/Blob into an HTMLImageElement (more reliable than faceapi.fetchImage for blob URLs).
 * @param {File|Blob} file
 * @returns {Promise<{ image: HTMLImageElement, objectUrl: string }>}
 */
export function loadImageElementFromFile(file) {
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image file."));
    };
    image.src = objectUrl;
  });
}

/**
 * Returns true when face-api nets needed for avatar face descriptors are loaded.
 * @param {typeof import("face-api.js")} faceapi
 */
export function areFaceModelsReady(faceapi) {
  return Boolean(
    faceapi?.nets?.tinyFaceDetector?.isLoaded &&
      faceapi?.nets?.faceLandmark68Net?.isLoaded &&
      faceapi?.nets?.faceRecognitionNet?.isLoaded
  );
}

/**
 * Attempts face detection; returns a JSON descriptor string or null (never throws).
 * @param {File} file
 * @param {typeof import("face-api.js")} faceapi
 * @returns {Promise<string|null>}
 */
export async function tryDetectFaceDescriptor(file, faceapi) {
  if (!file || !areFaceModelsReady(faceapi)) {
    return null;
  }

  let objectUrl;

  try {
    const { image, objectUrl: url } = await loadImageElementFromFile(file);
    objectUrl = url;

    if (!image.naturalWidth || !image.naturalHeight) {
      return null;
    }

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.35,
    });

    const detection = await faceapi
      .detectSingleFace(image, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection?.descriptor) {
      return null;
    }

    return JSON.stringify(Array.from(detection.descriptor));
  } catch (err) {
    console.warn("Face detection skipped:", err);
    return null;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
