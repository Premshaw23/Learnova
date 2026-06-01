export const DEFAULT_SYSTEM_METRICS = {
  database: { status: "operational", latency: "12ms", connections: "0" },
  api: { status: "operational", uptime: "100%", errors: "0%" },
  storage: { status: "operational", used: "0%", available: "100%" },
};

export const DEFAULT_CRITICAL_ALERTS = [
  {
    id: "sys-1",
    severity: "info",
    message: "System operations normal. Monitoring active.",
    time: "Just now",
  }
];

export const DEFAULT_FEATURE_USAGE = {
  faceRecognition: { enabled: 0, total: 0, percentage: 0 },
  geofencing: { enabled: 0, total: 0, percentage: 0 },
  analytics: { enabled: 0, total: 0, percentage: 0 },
};
