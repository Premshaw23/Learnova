"use client";
import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const mockTimetable = {
  Monday: [
    { time: "09:00-10:30", subject: "Data Structures", teacher: "Dr. Smith", room: "Lab-1", color: "blue" },
    { time: "10:45-12:15", subject: "Mathematics", teacher: "Prof. Johnson", room: "Room-205", color: "purple" },
    { time: "14:00-15:30", subject: "Database Systems", teacher: "Dr. Brown", room: "Lab-2", color: "green" },
  ],
  Tuesday: [
    { time: "09:00-10:30", subject: "Web Development", teacher: "Ms. Wilson", room: "Lab-3", color: "pink" },
    { time: "10:45-12:15", subject: "Computer Networks", teacher: "Dr. Davis", room: "Room-301", color: "orange" },
  ],
  Wednesday: [
    { time: "09:00-10:30", subject: "Machine Learning", teacher: "Prof. Lee", room: "Lab-1", color: "teal" },
    { time: "10:45-12:15", subject: "Software Engineering", teacher: "Dr. Miller", room: "Room-204", color: "blue" },
    { time: "14:00-15:30", subject: "AI Ethics", teacher: "Prof. Chen", room: "Room-101", color: "purple" },
  ],
  Thursday: [
    { time: "09:00-10:30", subject: "Data Structures", teacher: "Dr. Smith", room: "Lab-1", color: "blue" },
    { time: "10:45-12:15", subject: "Mobile Development", teacher: "Ms. Garcia", room: "Lab-4", color: "green" },
  ],
  Friday: [
    { time: "09:00-10:30", subject: "AI Ethics", teacher: "Prof. Chen", room: "Room-101", color: "purple" },
    { time: "10:45-12:15", subject: "Project Work", teacher: "Dr. Kumar", room: "Lab-2", color: "orange" },
  ],
  Saturday: [],
};

const colorMap = {
  blue: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20",
  purple: "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20",
  green: "border-green-500/50 bg-green-500/10 hover:bg-green-500/20",
  pink: "border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20",
  orange: "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20",
  teal: "border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20",
};

const textColorMap = {
  blue: "text-blue-400",
  purple: "text-purple-400",
  green: "text-green-400",
  pink: "text-pink-400",
  orange: "text-orange-400",
  teal: "text-teal-400",
};

export default function Timetable({ role = "student" }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const [selectedDay, setSelectedDay] = useState(
    days.includes(today) ? today : "Monday"
  );

  const classes = mockTimetable[selectedDay] || [];

  return (
    <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Weekly Timetable</h3>
            <p className="text-white/50 text-xs">
              {role === "teacher" ? "Your teaching schedule" : "Your class schedule"}
            </p>
          </div>
        </div>
        {classes.length > 0 && (
          <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">
            {classes.length} classes
          </span>
        )}
      </div>

      {/* Day Selector */}
      <div className="flex space-x-1 mb-6 overflow-x-auto pb-1">
        {days.map((day) => {
          const isToday = day === today;
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : isToday
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {day.slice(0, 3)}
              {isToday && (
                <span className="block w-1 h-1 bg-green-400 rounded-full mx-auto mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Classes List */}
      {classes.length > 0 ? (
        <div className="space-y-3">
          {classes.map((cls, index) => (
            <div
              key={index}
              className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${colorMap[cls.color]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className={`font-semibold text-sm ${textColorMap[cls.color]}`}>
                  {cls.subject}
                </h4>
                <span className="text-white/40 text-xs">{index + 1}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-white/60 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{cls.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-white/60 text-xs">
                  <User className="w-3 h-3" />
                  <span>{cls.teacher}</span>
                </div>
                <div className="flex items-center space-x-2 text-white/60 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{cls.room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No classes on {selectedDay}</p>
          <p className="text-white/20 text-xs mt-1">Enjoy your day off! 🎉</p>
        </div>
      )}
    </div>
  );
}