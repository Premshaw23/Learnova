import { GraduationCap, Users, Building, Settings } from "lucide-react";

export const USER_ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  INSTITUTE: "institute",
  ADMIN: "admin",
};

export const ROLE_CONFIG = {
  [USER_ROLES.STUDENT]: {
    icon: GraduationCap,
    title: "Student",
    description: "Track your attendance and view academic progress",
    color: "from-blue-500 to-cyan-500",
  },
  [USER_ROLES.TEACHER]: {
    icon: Users,
    title: "Teacher/Faculty",
    description: "Manage classes, take attendance, and monitor students",
    color: "from-green-500 to-emerald-500",
  },
  [USER_ROLES.INSTITUTE]: {
    icon: Building,
    title: "Institute",
    description: "Oversee entire institution and manage departments",
    color: "from-purple-500 to-violet-500",
  },
  [USER_ROLES.ADMIN]: {
    icon: Settings,
    title: "Admin",
    description: "System administration and technical support",
    color: "from-orange-500 to-red-500",
  },
};