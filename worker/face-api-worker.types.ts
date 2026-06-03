export type FaceApiWorkerAction = 'LOAD_MODELS' | 'DETECT_FACES' | 'CLEAR_MODELS';

export interface FaceApiWorkerRequest {
  action: FaceApiWorkerAction;
  payload?: {
    modelUrl?: string;
    imageData?: ImageData | string;
    options?: {
      scoreThreshold?: number;
      inputSize?: number;
    };
  };
}

export interface FaceDetectionResult {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
  className?: string;
}

export interface FaceApiWorkerResponse {
  type: 'LOAD_MODELS_SUCCESS' | 'LOAD_MODELS_FAILURE' | 'DETECT_FACES_SUCCESS' | 'DETECT_FACES_FAILURE';
  success: boolean;
  payload?: {
    detections?: FaceDetectionResult[];
    error?: string;
  };
}

// Custom strict event interfaces for worker postMessage handlers
export interface WorkerMessageEvent extends MessageEvent {
  data: FaceApiWorkerRequest;
}

export interface WorkerResponseEvent extends MessageEvent {
  data: FaceApiWorkerResponse;
}
