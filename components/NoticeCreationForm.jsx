"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

const NoticeCreationForm = ({ onSuccess, onCancel }) => {
  const { user, userProfile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim())
      return toast.error("Fill all fields");

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: description.trim(),
          category: "general",
          priority: "medium",
          isPinned: false,
          tags: [],
          targetAudience: ["student", "teacher", "parent"],
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Notice published!");
        onSuccess();
      } else {
        toast.error(data.error || "Failed to publish.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-4 bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl"
    >
      <h3 className="text-xl font-bold text-white">Create Notice</h3>
      <input
        className="w-full p-3 bg-slate-800 rounded-lg text-white"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      {/* Character Counter Implementation */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
        rows={5}
        placeholder="Enter notice description..."
        className="w-full p-3 bg-slate-800 rounded-lg text-white resize-none"
        required
      />
      <div
        className={`text-xs text-right ${description.length > 900 ? "text-red-500" : "text-slate-500"}`}
      >
        {description.length} / 1000
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="text-slate-400">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 px-4 py-2 rounded-lg text-white"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
};

export default NoticeCreationForm;
