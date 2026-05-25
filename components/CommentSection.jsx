"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// REMOVE db AND useAuth IMPORTS FOR NOW TO PREVENT CRASHES

const CommentSection = ({ noticeId }) => {
  // 1. FAKE USER BYPASS: This pretends you are logged in as a Teacher or Student
  const mockUser = {
    uid: "mock_user_123",
    displayName: "Prem Shaw",
    role: "Contributor" // Displays a premium-looking badge next to your name
  };

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 2. Load existing fake comments or persistent local storage comments
  useEffect(() => {
    if (!noticeId) return;
    
    // Check if we have comments stored in the browser for this notice
    const savedComments = localStorage.getItem(`comments_${noticeId}`);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    } else {
      // Seed data so the screen isn't empty when you first look at it
      const defaultComments = [
        {
          id: "seed_1",
          userName: "Ananya Rao",
          userRole: "Teacher",
          text: "Please make sure to review this notice before Monday's class.",
        },
        {
          id: "seed_2",
          userName: "Rahul Sharma",
          userRole: "Student",
          text: "Got it! Thanks for the update.",
        }
      ];
      setComments(defaultComments);
      localStorage.setItem(`comments_${noticeId}`, JSON.stringify(defaultComments));
    }
  }, [noticeId]);

  // 3. Handle comment submission without needing a live backend database connection
  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const freshComment = {
      id: `comment_${Date.now()}`,
      userName: mockUser.displayName,
      userRole: mockUser.role,
      text: newComment.trim(),
    };

    const updatedComments = [...comments, freshComment];
    setComments(updatedComments);
    
    // Save to browser memory so it stays there when you refresh the page
    localStorage.setItem(`comments_${noticeId}`, JSON.stringify(updatedComments));
    setNewComment("");
  };

  return (
    <div className="mt-8 border-t border-slate-300 dark:border-slate-800/80 pt-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <MessageSquare className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <span>Discussion ({comments.length})</span>
      </div>

      {/* Comment Feed Layout */}
      <div className="mb-4 max-h-60 space-y-3 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="rounded-2xl border border-slate-300 dark:border-slate-800/40 bg-slate-100 dark:bg-slate-950/40 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{comment.userName}</span>
                <span className="rounded-md bg-slate-300 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  {comment.userRole}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{comment.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Interactive Input form box */}
      <form onSubmit={handleSubmitComment} className="relative flex items-center gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment or share feedback..."
          className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-2.5 pl-4 pr-12 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-indigo-500 p-1.5 text-white transition hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;