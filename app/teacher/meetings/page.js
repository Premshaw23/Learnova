"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function TeacherMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!startDate || !startTime || !endTime) return;

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Meeting slot created successfully");
        setStartDate("");
        setStartTime("");
        setEndTime("");
        fetchMeetings();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to create slot");
      }
    } catch (err) {
      toast.error("An error occurred while creating slot");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Meeting Slots</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Add New Availability Slot</h2>
        <form onSubmit={handleCreateSlot} className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm mb-1 text-gray-500">Date</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-500">Start Time</label>
            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-500">End Time</label>
            <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Add Slot
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Your Meeting Slots</h2>
        {meetings.length === 0 ? (
          <p className="text-gray-500">No meeting slots created yet.</p>
        ) : (
          <ul className="space-y-3">
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
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    meeting.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {meeting.status}
                  </span>
                  {meeting.parentId && (
                    <div className="text-sm text-gray-500 mt-1">
                      Booked by: {meeting.parentName || "Parent"}
                    </div>
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
