"use client";

import React, { useState } from "react";
import WebXRLabSimulation from "../../components/WebXRLabSimulation";

export default function ARVRLabPage() {
  const [selectedSubject, setSelectedSubject] = useState("Biology");

  const subjects = [
    { id: "biology", name: "Biology", description: "Explore the human cell and DNA structures." },
    { id: "chemistry", name: "Chemistry", description: "Interact with molecular models and chemical reactions." },
    { id: "physics", name: "Physics", description: "Experiment with gravity, magnetism, and kinematics." }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            Interactive AR/VR Lab Simulations
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Experience complex spatial concepts in STEM subjects through immersive 3D simulations. 
            Launch directly in your browser or put on a VR headset for true spatial relationships and depth.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar for subject selection */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <h2 className="text-2xl font-bold mb-2">Lab Subjects</h2>
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.name)}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedSubject === subject.name
                    ? "bg-blue-900/50 border border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                }`}
              >
                <h3 className="text-xl font-bold text-gray-100">{subject.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{subject.description}</p>
              </button>
            ))}
          </div>

          {/* Main Simulation Area */}
          <div className="w-full md:w-2/3 flex items-center justify-center bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none"></div>
            
            <div className="w-full z-10 flex justify-center">
              <WebXRLabSimulation 
                simulationId={`${selectedSubject.toLowerCase()}-sim-01`} 
                subject={selectedSubject} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
