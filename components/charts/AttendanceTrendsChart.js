"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * AttendanceTrendsChart – canvas-based bar chart for attendance trends.
 * Configured with responsive: true, maintainAspectRatio: false for
 * fluid rendering inside a constrained parent container.
 */
const AttendanceTrendsChart = ({ data: propData, className = "" }) => {
  const defaultData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Present",
        data: [38, 40, 36, 42, 39, 20],
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Late",
        data: [3, 2, 4, 1, 3, 1],
        backgroundColor: "rgba(234, 179, 8, 0.6)",
        borderColor: "rgba(234, 179, 8, 1)",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Absent",
        data: [4, 3, 5, 2, 3, 0],
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartData = propData || defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: "rgba(156, 163, 175, 1)",
          padding: 16,
          usePointStyle: true,
          pointStyle: "rectRounded",
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
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.8)",
          font: { size: 12 },
        },
        border: {
          color: "rgba(75, 85, 99, 0.3)",
        },
      },
      y: {
        stacked: true,
        grid: {
          color: "rgba(75, 85, 99, 0.15)",
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.8)",
          font: { size: 12 },
          stepSize: 10,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className={`w-full aspect-video min-h-[300px] ${className}`}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default AttendanceTrendsChart;
