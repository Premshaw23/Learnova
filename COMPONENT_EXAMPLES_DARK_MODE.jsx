/**
 * Dark Mode Implementation Examples for Key Components
 * Copy and adapt these patterns to your existing components
 */

// ============================================================
// 1. DASHBOARD COMPONENT EXAMPLE
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";
import DarkModeCard, { DarkModeSection, DarkModeText } from "@/components/DarkModeComponents";
import { CheckCircle, Clock, Target, TrendingUp } from "lucide-react";

export function DashboardExample() {
  const { isDark, mounted } = useThemeContext();

  if (!mounted) return <div>Loading...</div>;

  return (
    <div className="
      min-h-screen
      bg-gradient-to-b from-gray-50 to-white
      dark:from-slate-950 dark:to-slate-900
      transition-colors duration-300
    ">
      {/* Header Section */}
      <section className="
        bg-white dark:bg-slate-900
        border-b border-gray-200 dark:border-slate-800
        py-8 px-4 md:px-8
      ">
        <h1 className="
          text-4xl font-bold
          text-gray-900 dark:text-white
          mb-2
        ">
          Welcome Back!
        </h1>
        <p className="
          text-gray-600 dark:text-gray-400
        ">
          Here's your learning progress overview
        </p>
      </section>

      {/* Main Content */}
      <div className="py-8 px-4 md:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DarkModeCard hover>
            <div className="flex items-center justify-between">
              <div>
                <DarkModeText variant="caption" className="block mb-1">
                  Attendance
                </DarkModeText>
                <DarkModeText variant="heading" className="text-3xl">
                  92%
                </DarkModeText>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </DarkModeCard>

          <DarkModeCard hover>
            <div className="flex items-center justify-between">
              <div>
                <DarkModeText variant="caption" className="block mb-1">
                  Classes Today
                </DarkModeText>
                <DarkModeText variant="heading" className="text-3xl">
                  5
                </DarkModeText>
              </div>
              <Clock className="w-12 h-12 text-blue-500" />
            </div>
          </DarkModeCard>

          <DarkModeCard hover>
            <div className="flex items-center justify-between">
              <div>
                <DarkModeText variant="caption" className="block mb-1">
                  Assignments
                </DarkModeText>
                <DarkModeText variant="heading" className="text-3xl">
                  12
                </DarkModeText>
              </div>
              <Target className="w-12 h-12 text-orange-500" />
            </div>
          </DarkModeCard>

          <DarkModeCard hover>
            <div className="flex items-center justify-between">
              <div>
                <DarkModeText variant="caption" className="block mb-1">
                  GPA
                </DarkModeText>
                <DarkModeText variant="heading" className="text-3xl">
                  3.8
                </DarkModeText>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500" />
            </div>
          </DarkModeCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DarkModeCard>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Attendance Trend
            </h3>
            {/* Add your chart component here */}
            <div className="
              w-full h-64
              bg-gray-100 dark:bg-slate-700
              rounded-lg flex items-center justify-center
              text-gray-600 dark:text-gray-400
            ">
              Chart will render here
            </div>
          </DarkModeCard>

          <DarkModeCard>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Performance
            </h3>
            <div className="
              w-full h-64
              bg-gray-100 dark:bg-slate-700
              rounded-lg flex items-center justify-center
              text-gray-600 dark:text-gray-400
            ">
              Chart will render here
            </div>
          </DarkModeCard>
        </div>

        {/* Recent Activity */}
        <DarkModeCard>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                  p-4 rounded-lg
                  bg-gray-50 dark:bg-slate-700
                  border border-gray-200 dark:border-slate-600
                  hover:bg-gray-100 dark:hover:bg-slate-600
                  transition-colors duration-300
                "
              >
                <p className="text-gray-900 dark:text-white font-medium">
                  Activity {item}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  2 hours ago
                </p>
              </div>
            ))}
          </div>
        </DarkModeCard>
      </div>
    </div>
  );
}

// ============================================================
// 2. FORM COMPONENT EXAMPLE
// ============================================================

export function FormExample() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <DarkModeCard className="max-w-lg mx-auto">
      <h2 className="
        text-2xl font-bold
        text-gray-900 dark:text-white
        mb-6
      ">
        Contact Us
      </h2>

      <form className="space-y-6">
        {/* Full Name Input */}
        <div>
          <label className="
            block text-sm font-medium
            text-gray-700 dark:text-gray-300
            mb-2
          ">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="
              w-full px-4 py-2 rounded-lg
              bg-white dark:bg-slate-800
              border border-gray-300 dark:border-slate-600
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-purple-500
              dark:focus:ring-purple-400
              transition-colors duration-300
            "
            placeholder="Your name"
          />
        </div>

        {/* Email Input */}
        <div>
          <label className="
            block text-sm font-medium
            text-gray-700 dark:text-gray-300
            mb-2
          ">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="
              w-full px-4 py-2 rounded-lg
              bg-white dark:bg-slate-800
              border border-gray-300 dark:border-slate-600
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-purple-500
              dark:focus:ring-purple-400
              transition-colors duration-300
            "
            placeholder="your@email.com"
          />
        </div>

        {/* Message Textarea */}
        <div>
          <label className="
            block text-sm font-medium
            text-gray-700 dark:text-gray-300
            mb-2
          ">
            Message
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="
              w-full px-4 py-2 rounded-lg
              bg-white dark:bg-slate-800
              border border-gray-300 dark:border-slate-600
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-purple-500
              dark:focus:ring-purple-400
              transition-colors duration-300
              resize-none
            "
            placeholder="Your message..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="
            w-full px-6 py-3 rounded-lg
            bg-gradient-to-r from-purple-600 to-pink-600
            hover:from-purple-700 hover:to-pink-700
            text-white font-medium
            focus:outline-none focus:ring-2 focus:ring-purple-500
            focus:ring-offset-2 dark:focus:ring-offset-slate-900
            transition-all duration-300
            transform hover:scale-105 active:scale-95
          "
        >
          Send Message
        </button>
      </form>
    </DarkModeCard>
  );
}

// ============================================================
// 3. TABLE COMPONENT EXAMPLE
// ============================================================

export function TableExample() {
  const tableData = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Inactive" },
  ];

  return (
    <DarkModeCard className="overflow-x-auto">
      <h3 className="
        text-lg font-bold
        text-gray-900 dark:text-white
        mb-4
      ">
        Students List
      </h3>

      <table className="w-full">
        <thead>
          <tr className="
            bg-gray-50 dark:bg-slate-700
            border-b border-gray-200 dark:border-slate-600
          ">
            <th className="
              px-6 py-3 text-left
              text-sm font-semibold
              text-gray-900 dark:text-white
            ">
              Name
            </th>
            <th className="
              px-6 py-3 text-left
              text-sm font-semibold
              text-gray-900 dark:text-white
            ">
              Email
            </th>
            <th className="
              px-6 py-3 text-left
              text-sm font-semibold
              text-gray-900 dark:text-white
            ">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr
              key={row.id}
              className="
                border-b border-gray-200 dark:border-slate-700
                hover:bg-gray-50 dark:hover:bg-slate-700
                transition-colors duration-200
              "
            >
              <td className="
                px-6 py-4
                text-sm
                text-gray-900 dark:text-white
              ">
                {row.name}
              </td>
              <td className="
                px-6 py-4
                text-sm
                text-gray-600 dark:text-gray-400
              ">
                {row.email}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${
                      row.status === "Active"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                    }
                  `}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DarkModeCard>
  );
}

// ============================================================
// 4. MODAL/DIALOG EXAMPLE
// ============================================================

export function ModalExample({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/50 dark:bg-black/70
      transition-colors duration-300
    ">
      <DarkModeCard className="
        relative w-full max-w-md
        max-h-screen overflow-y-auto
      ">
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4
            p-2 rounded-lg
            text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-slate-700
            transition-colors duration-300
          "
        >
          ✕
        </button>

        <h2 className="
          text-2xl font-bold
          text-gray-900 dark:text-white
          mb-4
        ">
          Modal Title
        </h2>

        <p className="
          text-gray-600 dark:text-gray-400
          mb-6
        ">
          This is a modal with dark mode support. It has proper styling for both light and dark modes.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-gray-100 dark:bg-slate-700
              text-gray-900 dark:text-white
              hover:bg-gray-200 dark:hover:bg-slate-600
              transition-colors duration-300
            "
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-purple-600 hover:bg-purple-700
              text-white
              transition-colors duration-300
            "
          >
            Confirm
          </button>
        </div>
      </DarkModeCard>
    </div>
  );
}

export default FormExample;
