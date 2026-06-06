"use client";

import { motion } from "framer-motion";
import { Award, Calendar, Eye, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { STATUS_COLORS, CATEGORY_COLORS } from "./constants";

const StatusIcon = ({ status }) => {
  if (status === "Verified") return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === "Rejected") return <XCircle className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
};

export default function AchievementCard({ achievement, onPreview, index = 0, showStudent = false }) {
  const categoryStyle =
    CATEGORY_COLORS[achievement.category] || CATEGORY_COLORS.Other;
  const statusStyle =
    STATUS_COLORS[achievement.verificationStatus] || STATUS_COLORS.Pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-gradient-to-br ${categoryStyle} border rounded-2xl p-5 backdrop-blur-xl hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{achievement.title}</h4>
            {showStudent && (
              <p className="text-xs text-gray-400">{achievement.studentName}</p>
            )}
            <p className="text-xs text-gray-500">{achievement.category}</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-medium ${statusStyle}`}
        >
          <StatusIcon status={achievement.verificationStatus} />
          {achievement.verificationStatus}
        </span>
      </div>

      <p className="text-xs text-gray-400 mt-3 line-clamp-2">{achievement.description}</p>

      <div className="flex items-center justify-between mt-4">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {achievement.achievementDate?.slice(0, 10)}
        </span>
        <div className="flex items-center gap-2">
          {achievement.certificateUrl && (
            <>
              <button
                onClick={() => onPreview?.(achievement)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400 transition"
                aria-label="Preview certificate"
              >
                <Eye className="w-4 h-4" />
              </button>
              <a
                href={achievement.certificateUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/10 rounded-lg text-green-400 transition"
                aria-label="Download certificate"
              >
                <Download className="w-4 h-4" />
              </a>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
