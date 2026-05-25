/**
 * notificationService.js
 * 
 * Service for creating and managing notifications in Firestore.
 * Provides helper functions to trigger notifications for different events.
 */

import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";

/**
 * Notification types
 */
export const NotificationTypes = {
  ASSIGNMENT: "assignment",
  ATTENDANCE: "attendance",
  ANNOUNCEMENT: "announcement",
  ALERT: "alert",
  INFO: "info",
  SUCCESS: "success",
};

/**
 * Create a notification for a specific user
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.recipientId - User ID to receive the notification
 * @param {string} notificationData.type - Type of notification
 * @param {string} notificationData.title - Title of the notification
 * @param {string} notificationData.message - Message content
 * @param {Object} notificationData.metadata - Additional metadata
 * @param {string} notificationData.actionUrl - Optional URL to navigate to
 * @returns {Promise<string>} - Notification ID
 */
export async function createNotification(notificationData) {
  try {
    const notification = {
      recipientId: notificationData.recipientId,
      type: notificationData.type || NotificationTypes.INFO,
      title: notificationData.title || "",
      message: notificationData.message || "",
      read: false,
      createdAt: serverTimestamp(),
      metadata: notificationData.metadata || {},
      actionUrl: notificationData.actionUrl || null,
    };

    const docRef = await addDoc(collection(db, "notifications"), notification);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create a notification for multiple users
 * @param {Array<string>} recipientIds - Array of user IDs
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array<string>>} - Array of notification IDs
 */
export async function createBulkNotifications(recipientIds, notificationData) {
  try {
    const notificationPromises = recipientIds.map((recipientId) =>
      createNotification({
        ...notificationData,
        recipientId,
      })
    );

    const notificationIds = await Promise.all(notificationPromises);
    return notificationIds;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
}

/**
 * Create an assignment notification
 * @param {string} recipientId - User ID to receive the notification
 * @param {Object} assignmentData - Assignment details
 * @returns {Promise<string>} - Notification ID
 */
export async function createAssignmentNotification(recipientId, assignmentData) {
  return createNotification({
    recipientId,
    type: NotificationTypes.ASSIGNMENT,
    title: "New Assignment",
    message: `You have a new assignment: ${assignmentData.title}`,
    metadata: {
      assignmentId: assignmentData.id,
      dueDate: assignmentData.dueDate,
      subject: assignmentData.subject,
    },
    actionUrl: `/assignments/${assignmentData.id}`,
  });
}

/**
 * Create an assignment deadline reminder
 * @param {string} recipientId - User ID to receive the notification
 * @param {Object} assignmentData - Assignment details
 * @returns {Promise<string>} - Notification ID
 */
export async function createAssignmentReminder(recipientId, assignmentData) {
  return createNotification({
    recipientId,
    type: NotificationTypes.ALERT,
    title: "Assignment Deadline Reminder",
    message: `Reminder: "${assignmentData.title}" is due on ${assignmentData.dueDate}`,
    metadata: {
      assignmentId: assignmentData.id,
      dueDate: assignmentData.dueDate,
      subject: assignmentData.subject,
    },
    actionUrl: `/assignments/${assignmentData.id}`,
  });
}

/**
 * Create an attendance alert notification
 * @param {string} recipientId - User ID to receive the notification
 * @param {Object} attendanceData - Attendance details
 * @returns {Promise<string>} - Notification ID
 */
export async function createAttendanceAlert(recipientId, attendanceData) {
  return createNotification({
    recipientId,
    type: NotificationTypes.ATTENDANCE,
    title: "Attendance Alert",
    message: `Your attendance is ${attendanceData.percentage}%. Please maintain at least 75% attendance.`,
    metadata: {
      percentage: attendanceData.percentage,
      totalClasses: attendanceData.totalClasses,
      attendedClasses: attendanceData.attendedClasses,
    },
    actionUrl: "/attendance",
  });
}

/**
 * Create an announcement notification
 * @param {string} recipientId - User ID to receive the notification
 * @param {Object} announcementData - Announcement details
 * @returns {Promise<string>} - Notification ID
 */
export async function createAnnouncementNotification(recipientId, announcementData) {
  return createNotification({
    recipientId,
    type: NotificationTypes.ANNOUNCEMENT,
    title: announcementData.title || "New Announcement",
    message: announcementData.message,
    metadata: {
      announcementId: announcementData.id,
      priority: announcementData.priority || "normal",
    },
    actionUrl: `/announcements/${announcementData.id}`,
  });
}

/**
 * Create a bulk announcement for all users with a specific role
 * @param {string} role - User role (student, teacher, admin)
 * @param {Object} announcementData - Announcement details
 * @returns {Promise<Array<string>>} - Array of notification IDs
 */
export async function createRoleBasedAnnouncement(role, announcementData) {
  try {
    // Query all users with the specified role
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", role)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const recipientIds = querySnapshot.docs.map((doc) => doc.id);

    return createBulkNotifications(recipientIds, {
      type: NotificationTypes.ANNOUNCEMENT,
      title: announcementData.title || "New Announcement",
      message: announcementData.message,
      metadata: {
        announcementId: announcementData.id,
        priority: announcementData.priority || "normal",
      },
      actionUrl: `/announcements/${announcementData.id}`,
    });
  } catch (error) {
    console.error("Error creating role-based announcement:", error);
    throw error;
  }
}

/**
 * Create a general info notification
 * @param {string} recipientId - User ID to receive the notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} actionUrl - Optional action URL
 * @returns {Promise<string>} - Notification ID
 */
export async function createInfoNotification(recipientId, title, message, actionUrl = null) {
  return createNotification({
    recipientId,
    type: NotificationTypes.INFO,
    title,
    message,
    actionUrl,
  });
}

/**
 * Create a success notification
 * @param {string} recipientId - User ID to receive the notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} actionUrl - Optional action URL
 * @returns {Promise<string>} - Notification ID
 */
export async function createSuccessNotification(recipientId, title, message, actionUrl = null) {
  return createNotification({
    recipientId,
    type: NotificationTypes.SUCCESS,
    title,
    message,
    actionUrl,
  });
}
