"use client";
import React from 'react';
import VolumetricPlanner from '../components/VolumetricPlanner';

export default function ContentPlanningPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Learnova Workspace
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Content Management & Supply Chain Verification Hub
        </p>
      </header>

      <main>
        {/* Render the Volumetric Packing Planner feature component */}
        <VolumetricPlanner />
      </main>
    </div>
  );
}