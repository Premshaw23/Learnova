import type { FC } from "react";

type SpatialCapacityMeterProps = {
  fillPercentage: number;
  status: "Optimal Fit" | "Volumetric Overflow";
  label?: string;
};

const SpatialCapacityMeter: FC<SpatialCapacityMeterProps> = ({
  fillPercentage,
  status,
  label = "Spatial Capacity",
}) => {
  const normalizedFill = Math.min(Math.max(fillPercentage, 0), 100);
  const barColor = status === "Optimal Fit" ? "#2ecc71" : "#e74c3c";
  const textColor = status === "Optimal Fit" ? "text-emerald-500" : "text-red-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className={textColor}>{fillPercentage.toFixed(1)}%</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${normalizedFill}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 14px ${barColor}40`,
          }}
        />
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        {status}
      </div>
    </div>
  );
};

export default SpatialCapacityMeter;
