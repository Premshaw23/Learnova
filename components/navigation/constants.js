export const LEARNOVA_COLORS = {
  bgDeep: "#070B14",
  bgSurface: "#0B1120",
  accentIndigo: "#6366f1",
  accentViolet: "#8b5cf6",
};

export const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.96,
    transition: { duration: 0.13, ease: "easeIn" },
  },
};

export const mobileDrawerVariants = {
  hidden: { opacity: 0, x: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: 30,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 72 },
};

export const sidebarMobileVariants = {
  hidden: { x: "-100%", opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    x: "-100%",
    opacity: 0.8,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const staggerContainer = {
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

export const staggerItem = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export const SIDEBAR_LAYOUT_ID = "sidebar-active-indicator";
