"use client";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { getEngagementCategory } from "@/lib/engagementScore";

const EngagementScoreCard = ({
  overallScore = 0,
  attendanceScore = 0,
  activityScore = 0,
  assignmentScore = 0,
  academicScore = 0,
}) => {
  const category = getEngagementCategory(overallScore);
  const ringColor =
    overallScore >= 90
      ? "#34D399"
      : overallScore >= 75
      ? "#60A5FA"
      : overallScore >= 60
      ? "#FBBF24"
      : "#F87171";

  return (
    <section className="bg-card/50 dark:bg-slate-950/80 border border-border rounded-3xl p-6 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="w-full max-w-[220px] mx-auto">
          <CircularProgressbar
            value={overallScore}
            text={`${Math.round(overallScore)}%`}
            styles={buildStyles({
              textSize: "18px",
              pathColor: ringColor,
              textColor: "#F8FAFC",
              trailColor: "rgba(148,163,184,0.18)",
              backgroundColor: "rgba(15,23,42,0.8)",
            })}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Overall Engagement
            </p>
            <h2 className="text-3xl font-semibold text-foreground">{category}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Engagement score is normalized to 100, blending attendance,
              activity participation, assignments and academic performance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-900/70 p-3 border border-white/10">
              <p className="text-xs uppercase text-muted-foreground">Attendance</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {Math.round(attendanceScore)}%
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-3 border border-white/10">
              <p className="text-xs uppercase text-muted-foreground">Activity</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {Math.round(activityScore)}%
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-3 border border-white/10">
              <p className="text-xs uppercase text-muted-foreground">Assignments</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {Math.round(assignmentScore)}%
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-3 border border-white/10">
              <p className="text-xs uppercase text-muted-foreground">Academic</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {Math.round(academicScore)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EngagementScoreCard;
