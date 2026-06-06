import { z } from "zod";

export const settingsSchema = z
  .object({
    userId: z.string().optional(),
    theme: z.string().optional(),
    profile: z
      .object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
      })
      .strict()
      .optional(),
    notifications: z
      .union([
        z.boolean(),
        z
          .object({
            emailNotifications: z.boolean().optional(),
            pushNotifications: z.boolean().optional(),
            courseReminders: z.boolean().optional(),
            achievementAlerts: z.boolean().optional(),
            weeklyReports: z.boolean().optional(),
            marketingEmails: z.boolean().optional(),
            attendanceAlerts: z.boolean().optional(),
            gradeUpdates: z.boolean().optional(),
            classReminders: z.boolean().optional(),
            gradingAlerts: z.boolean().optional(),
            studentSubmissions: z.boolean().optional(),
            parentMessages: z.boolean().optional(),
            systemAlerts: z.boolean().optional(),
            maintenanceReminders: z.boolean().optional(),
            securityAlerts: z.boolean().optional(),
            reportReminders: z.boolean().optional(),
            performanceAlerts: z.boolean().optional(),
            enrollmentAlerts: z.boolean().optional(),
            performanceReports: z.boolean().optional(),
            childProgressAlerts: z.boolean().optional(),
            meetingReminders: z.boolean().optional(),
            childProgress: z.boolean().optional(),
            schoolUpdates: z.boolean().optional(),
          })
          .strict(),
      ])
      .optional(),
    institute: z
      .object({
        lowAttendanceThreshold: z.number().min(0).max(100).optional(),
        enableAttendanceAutomation: z.boolean().optional(),
      })
      .strict()
      .optional(),
    privacy: z
      .object({
        profileVisibility: z.string().optional(),
        showProgress: z.boolean().optional(),
        showAchievements: z.boolean().optional(),
        allowMessages: z.boolean().optional(),
        dataCollection: z.boolean().optional(),
      })
      .strict()
      .optional(),
    learning: z
      .object({
        dailyGoal: z.number().optional(),
        weeklyGoal: z.number().optional(),
        preferredLanguage: z.string().optional(),
        difficulty: z.string().optional(),
        autoplay: z.boolean().optional(),
        subtitles: z.boolean().optional(),
        studyReminders: z.boolean().optional(),
        assignmentAlerts: z.boolean().optional(),
        classReminders: z.boolean().optional(),
        gradingAlerts: z.boolean().optional(),
        systemAlerts: z.boolean().optional(),
        maintenanceReminders: z.boolean().optional(),
        reportReminders: z.boolean().optional(),
        performanceAlerts: z.boolean().optional(),
        childProgressAlerts: z.boolean().optional(),
        meetingReminders: z.boolean().optional(),
      })
      .strict()
      .optional(),
    appearance: z
      .object({
        theme: z.string().optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
