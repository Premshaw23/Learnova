"use client";

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * EngagementChart – canvas-based doughnut chart for student engagement metrics.
 * Configured with responsive: true, maintainAspectRatio: false.
 */
const EngagementChart = ({ data: propData, className = "" }) => {
  const defaultData = {
    labels: [
      "Highly Engaged",
      "Moderately Engaged",
      "Low Engagement",
      "Idle / Inactive",
    ],
    datasets: [
      {
        data: [42, 28, 18, 12],
        backgroundColor: [
          "rgba(34, 197, 94, 0.75)",
          "rgba(59, 130, 246, 0.75)",
          "rgba(234, 179, 8, 0.7)",
          "rgba(239, 68, 68, 0.6)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(234, 179, 8, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
        hoverOffset: 8,
        spacing: 2,
      },
    ],
  };

  const chartData = propData || defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "rgba(156, 163, 175, 1)",
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
            family: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#fff",
        bodyColor: "rgba(209, 213, 219, 1)",
        borderColor: "rgba(75, 85, 99, 0.3)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            return ` ${label}: ${value}%`;
          },
        },
      },
    },
  };

  return (
    <div
      className={`w-full min-h-[300px] aspect-square max-w-[400px] mx-auto ${className}`}
    >
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default EngagementChart;
