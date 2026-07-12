"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function ParentMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    // In a real app, fetch teachers for this parent's students
    // For now, we will just simulate a fetch or allow fetching all available meetings
    fetchMeetings();
  }, [user]);

  const fetchMeetings = async (teacherId = "") => {
    setLoading(true);
    try {
      const url = teacherId ? `/api/meetings?teacherId=${teacherId}` : "/api/meetings";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
        
        // Extract unique teachers from available meetings if we haven't selected one
        if (!teacherId && data.length > 0) {
          const uniqueTeachers = Array.from(new Set(data.map(m => m.teacherId)))
            .map(id => {
              return {
                id,
                name: data.find(m => m.teacherId === id).teacherName
              }
            });
          setTeachers(uniqueTeachers);
        }
      }
    } catch (err) {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherChange = (e) => {
    const tid = e.target.value;
    setSelectedTeacherId(tid);
    fetchMeetings(tid);
  };

  const bookMeeting = async (meetingId) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        toast.success("Meeting booked successfully!");
        fetchMeetings(selectedTeacherId);
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to book meeting");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  if (loading && meetings.length === 0) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Book a Parent-Teacher Meeting</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8 border border-gray-100 dark:border-gray-700">
        <label className="block text-sm font-medium mb-2">Select Teacher</label>
        <select 
          value={selectedTeacherId} 
          onChange={handleTeacherChange}
          className="w-full max-w-md px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">-- All Teachers --</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Available Slots</h2>
        {meetings.length === 0 ? (
          <p className="text-gray-500">No meeting slots found.</p>
        ) : (
          <ul className="space-y-4">
            {meetings.map((meeting) => (
              <li key={meeting._id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <div>
                  <div className="font-medium">
                    {new Date(meeting.startTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 mt-1">
                    Teacher: {meeting.teacherName}
                  </div>
                </div>
                <div className="text-right">
                  {meeting.status === 'available' ? (
                    <button 
                      onClick={() => bookMeeting(meeting._id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm"
                    >
                      Book Slot
                    </button>
                  ) : meeting.parentId === user?.uid ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Booked by you
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Booked
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
