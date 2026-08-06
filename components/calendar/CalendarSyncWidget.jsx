"use client";

import React, { useState } from "react";
import { Calendar, Link as LinkIcon, CheckCircle, Copy, ExternalLink, CalendarDays } from "lucide-react";

/**
 * CalendarSyncWidget Component
 * 
 * Provides dynamic iCal/Google Calendar subscription links for a course.
 * Automatically pushes assignment deadlines, live webinars, and study group 
 * meetings to the user's personal calendar to reduce scheduling friction.
 */
export default function CalendarSyncWidget({ courseId = "CS-101", courseName = "Introduction to Computer Science" }) {
  const [copied, setCopied] = useState(false);

  // Mock dynamic iCal feed URL generated for the specific user and course
  const iCalFeedUrl = `https://learnova.app/api/calendar/feed/${courseId}/user_abc123.ics`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iCalFeedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleCalendarSync = () => {
    // Standard format for subscribing to an iCal feed via Google Calendar
    const googleCalUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(iCalFeedUrl)}`;
    window.open(googleCalUrl, "_blank");
  };

  const handleAppleCalendarSync = () => {
    // Using webcal:// protocol opens the default calendar app (Apple Calendar, Outlook, etc.)
    const webcalUrl = iCalFeedUrl.replace("https://", "webcal://");
    window.location.href = webcalUrl;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-md mx-auto my-8">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
          <CalendarDays size={28} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Calendar Sync</h3>
          <p className="text-sm text-gray-500 font-medium">{courseName}</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
        Never miss a deadline or live session. Sync this course schedule directly with your personal calendar app. It updates automatically!
      </p>

      <div className="space-y-3 mb-6">
        <button 
          onClick={handleGoogleCalendarSync}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 hover:border-blue-400 hover:shadow-sm rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3 font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.1h5.3c-.2 1.3-.9 2.4-2 3.1v2.5h3.3c1.9-1.8 3-4.5 3-5.5z"/>
              <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.3-2.5c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4.1h-3.4v2.6C5 19.9 8.2 22 12 22z"/>
              <path fill="#FBBC05" d="M6.6 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9v-2.6H3.2C2.4 8.7 2 9.8 2 11s.4 2.3 1.2 3.5l3.4-2.6z"/>
              <path fill="#EA4335" d="M12 4.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2 14.7 1 12 1 8.2 1 5 3.1 3.2 6.5l3.4 2.6c.8-2.4 2.9-4.2 5.4-4.2z"/>
            </svg>
            Google Calendar
          </div>
          <ExternalLink size={18} className="text-gray-400 group-hover:text-blue-500" />
        </button>

        <button 
          onClick={handleAppleCalendarSync}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 hover:border-gray-400 hover:shadow-sm rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3 font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
            <Calendar size={24} className="text-red-500" />
            Apple Calendar / Outlook
          </div>
          <ExternalLink size={18} className="text-gray-400 group-hover:text-gray-600" />
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">iCal Subscription URL</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 flex items-center gap-2 overflow-hidden">
            <LinkIcon size={16} className="text-gray-400 shrink-0" />
            <input 
              type="text" 
              readOnly 
              value={iCalFeedUrl} 
              className="w-full text-sm outline-none text-gray-600 bg-transparent"
            />
          </div>
          <button 
            onClick={copyToClipboard}
            className={`p-2.5 rounded-lg border transition-all shrink-0 ${
              copied 
                ? "bg-green-500 border-green-500 text-white" 
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
            title="Copy URL"
          >
            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
