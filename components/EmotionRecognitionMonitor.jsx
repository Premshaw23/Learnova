import React, { useState, useEffect, useRef } from 'react';

/**
 * EmotionRecognitionMonitor Component
 * 
 * An opt-in, browser-based facial emotion recognition tool designed
 * to gauge student engagement during asynchronous video learning.
 * Processes video streams locally to ensure privacy, aggregating
 * anonymized sentiment data (e.g., confused, bored, engaged) for instructors.
 * 
 * @param {Object} props
 * @param {string} props.videoId - The ID of the video being watched.
 * @param {function} props.onSentimentData - Callback to report aggregated sentiment data.
 */
const EmotionRecognitionMonitor = ({ videoId, onSentimentData }) => {
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('Neutral');
  const videoRef = useRef(null);
  
  useEffect(() => {
    let trackingInterval;

    if (isActive && isOptedIn) {
      console.log('Emotion recognition tracking started for video:', videoId);
      
      // Stub: Simulate emotion detection loop every 5 seconds
      trackingInterval = setInterval(() => {
        const emotions = ['Engaged', 'Engaged', 'Neutral', 'Confused', 'Bored'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        setCurrentEmotion(randomEmotion);
        
        // Report aggregated data
        if (onSentimentData) {
          onSentimentData({
            videoId,
            timestamp: Date.now(),
            sentiment: randomEmotion
          });
        }
      }, 5000);
    }

    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
      console.log('Emotion recognition tracking stopped.');
    };
  }, [isActive, isOptedIn, videoId, onSentimentData]);

  const handleOptIn = () => {
    // In a real application, we would request camera permissions here
    setIsOptedIn(true);
    setIsActive(true);
  };

  const handleOptOut = () => {
    setIsOptedIn(false);
    setIsActive(false);
    setCurrentEmotion('Neutral');
  };

  return (
    <div className="emotion-monitor-container p-4 mt-4 border rounded bg-gray-50 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-md font-semibold text-gray-800">Engagement Tracker</h4>
          <p className="text-xs text-gray-500">
            Share your anonymized engagement to help improve course quality. 
            Video is processed locally and never leaves your device.
          </p>
        </div>
        <div>
          {!isOptedIn ? (
            <button 
              onClick={handleOptIn}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
            >
              Opt In & Enable
            </button>
          ) : (
            <button 
              onClick={handleOptOut}
              className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
            >
              Disable Tracking
            </button>
          )}
        </div>
      </div>

      {isOptedIn && (
        <div className="mt-3 p-2 bg-white rounded border flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            Current Status: <span className="text-blue-600">{currentEmotion}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default EmotionRecognitionMonitor;
