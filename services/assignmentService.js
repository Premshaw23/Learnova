/**
 * assignmentService.js
 * 
 * Service for managing assignments and triggering notifications.
 */

import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  createAssignmentNotification,
  createBulkNotifications,
} from "./notificationService";

/**
 * Create a new assignment
 * @param {Object} assignmentData - Assignment details
 * @param {string} assignmentData.title - Assignment title
 * @param {string} assignmentData.description - Assignment description
 * @param {string} assignmentData.subject - Subject name
 * @param {string} assignmentData.dueDate - Due date string
 * @param {Array<string>} assignmentData.studentIds - Array of student IDs to assign to
 * @returns {Promise<string>} - Assignment ID
 */
export async function createAssignment(assignmentData) {
  try {
    const assignment = {
      title: assignmentData.title,
      description: assignmentData.description,
      subject: assignmentData.subject,
      dueDate: assignmentData.dueDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      studentIds: assignmentData.studentIds || [],
    };

    const docRef = await addDoc(collection(db, "assignments"), assignment);

    // Create notifications for all assigned students
    if (assignmentData.studentIds && assignmentData.studentIds.length > 0) {
      try {
        await createBulkNotifications(
          assignmentData.studentIds,
          {
            type: "assignment",
            title: "New Assignment",
            message: `You have a new assignment: ${assignmentData.title}`,
            metadata: {
              assignmentId: docRef.id,
              dueDate: assignmentData.dueDate,
              subject: assignmentData.subject,
            },
            actionUrl: `/assignments/${docRef.id}`,
          }
        );
      } catch (error) {
        console.error("Error creating assignment notifications:", error);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
}

/**
 * Get assignments for a specific student
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} - Array of assignments
 */
export async function getStudentAssignments(studentId) {
  try {
    const q = query(
      collection(db, "assignments"),
      where("studentIds", "array-contains", studentId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    throw error;
  }
}

/**
 * Create assignment deadline reminders for students with upcoming deadlines
 * @param {string} assignmentId - Assignment ID
 * @param {Array<string>} studentIds - Array of student IDs
 * @param {string} dueDate - Due date string
 * @returns {Promise<void>}
 */
export async function createAssignmentReminders(
  assignmentId,
  studentIds,
  dueDate
) {
  try {
    const assignmentRef = await getDocs(
      query(collection(db, "assignments"), where("__name__", "==", assignmentId))
    );

    if (assignmentRef.empty) {
      throw new Error("Assignment not found");
    }

    const assignment = assignmentRef.docs[0].data();

    await createBulkNotifications(
      studentIds,
      {
        type: "alert",
        title: "Assignment Deadline Reminder",
        message: `Reminder: "${assignment.title}" is due on ${dueDate}`,
        metadata: {
          assignmentId,
          dueDate,
          subject: assignment.subject,
        },
        actionUrl: `/assignments/${assignmentId}`,
      }
    );
  } catch (error) {
    console.error("Error creating assignment reminders:", error);
    throw error;
  }
}
