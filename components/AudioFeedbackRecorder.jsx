import React, { useState, useRef } from "react";

/**
 * AudioFeedbackRecorder Component
 *
 * Allows instructors to record and attach short audio clips (voice notes)
 * to specific highlighted sections of a student's submitted assignment or code.
 *
 * @param {Object} props
 * @param {string} props.assignmentId - The ID of the student's assignment.
 * @param {string} props.highlightId - The ID of the specific highlighted section.
 * @param {function} props.onSave - Callback when the audio note is saved.
 */
const AudioFeedbackRecorder = ({ assignmentId, highlightId, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required to record audio feedback.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all audio tracks
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const handleSave = () => {
    if (audioUrl && onSave) {
      onSave({
        assignmentId,
        highlightId,
        audioUrl, // In a real app, upload the Blob to cloud storage and pass the public URL
        timestamp: new Date().toISOString(),
      });
      console.log("Audio feedback saved.");
    }
  };

  const handleDiscard = () => {
    setAudioUrl(null);
    audioChunksRef.current = [];
  };

  return (
    <div className="audio-feedback-container p-3 border rounded shadow-sm bg-gray-50 flex flex-col gap-3 w-72">
      <h4 className="text-sm font-semibold text-gray-700">
        Voice Note Feedback
      </h4>

      {!audioUrl ? (
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full flex items-center justify-center w-10 h-10"
              title="Start Recording"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                ></path>
              </svg>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-gray-800 hover:bg-gray-900 text-white p-2 rounded flex items-center gap-2 flex-1"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Stop Recording
            </button>
          )}
          <span className="text-xs text-gray-500">
            {isRecording ? "Recording..." : "Click to record"}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <audio controls src={audioUrl} className="w-full h-8" />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded"
            >
              Attach to Highlight
            </button>
            <button
              onClick={handleDiscard}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs py-1 rounded"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioFeedbackRecorder;
