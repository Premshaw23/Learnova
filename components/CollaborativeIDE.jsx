import React, { useState, useEffect } from 'react';

/**
 * CollaborativeIDE Component
 * 
 * A web-based, real-time collaborative IDE component designed for
 * computer science and programming courses. Supports multiple cursors
 * and live execution environments similar to Replit or VS Code Live Share.
 * 
 * @param {Object} props
 * @param {string} props.courseId - The ID of the current course.
 * @param {string} props.sessionId - The unique session ID for the live collaboration.
 */
const CollaborativeIDE = ({ courseId, sessionId }) => {
  const [code, setCode] = useState('// Write your code here...\n');
  const [output, setOutput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Stub: Initialize WebSockets or WebRTC connection for live sharing
    const connectToSession = async () => {
      console.log(`Connecting to collaborative session: ${sessionId} for course: ${courseId}`);
      // Simulate network delay
      setTimeout(() => {
        setIsConnected(true);
      }, 500);
    };

    connectToSession();

    return () => {
      // Stub: Cleanup connection
      setIsConnected(false);
      console.log('Disconnected from session.');
    };
  }, [courseId, sessionId]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    // Stub: Emit code changes to other connected clients via WebSocket
  };

  const handleExecute = async () => {
    // Stub: Send code to execution sandbox backend
    setOutput('Executing code...\n');
    setTimeout(() => {
      setOutput('Execution result: Success (0 errors, 0 warnings)\n');
    }, 1000);
  };

  return (
    <div className="collaborative-ide-container p-4 border rounded shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Live Collaborative IDE</h3>
        <span className={`px-2 py-1 rounded text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </span>
      </div>
      
      <div className="flex gap-4">
        {/* Editor Area */}
        <div className="flex-1">
          <textarea
            className="w-full h-64 p-3 font-mono text-sm bg-gray-900 text-gray-100 rounded"
            value={code}
            onChange={handleCodeChange}
            placeholder="Type your code..."
          />
        </div>

        {/* Output/Terminal Area */}
        <div className="w-1/3">
          <div className="h-64 p-3 font-mono text-sm bg-black text-green-400 rounded overflow-y-auto whitespace-pre-wrap">
            {output || 'Output terminal ready.'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleExecute}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={!isConnected}
        >
          Run Code
        </button>
      </div>
    </div>
  );
};

export default CollaborativeIDE;
