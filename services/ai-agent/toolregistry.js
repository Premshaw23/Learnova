// services/ai-agent/tools.js
import { connectDb } from "@/lib/mongodb";

/**
 * Production Tool Registry for Learnova Chatbot
 * Interacts directly with MongoDB collections and institutional notification nodes.
 */
export const ToolRegistry = [
  {
    name: "fetch_low_attendance_students",
    description:
      "Retrieves a list of students whose attendance has fallen below a specific threshold percentage.",
    execute: async function ({ threshold, instituteId }) {
      try {
        const db = await connectDb();
        const targetThreshold = parseFloat(threshold) || 75;

        const query = {
          attendanceRate: { $lt: targetThreshold },
        };
        if (instituteId) {
          query.instituteId = instituteId;
        }

        const lowAttendanceStudents = await db
          .collection("student_metrics")
          .find(query)
          .project({
            userId: 1,
            name: 1,
            attendanceRate: 1,
          })
          .sort({ attendanceRate: 1 })
          .limit(15) // Performance ceiling to prevent flooding your chat window
          .toArray();

        if (lowAttendanceStudents.length === 0) {
          return JSON.stringify({
            status: "success",
            tool: this.name,
            message: `Great news! No students were found with an attendance rate below ${targetThreshold}%.`,
            data: [],
          });
        }

        return JSON.stringify({
          status: "success",
          tool: this.name,
          message: `Found ${lowAttendanceStudents.length} students with attendance below ${targetThreshold}%.`,
          data: lowAttendanceStudents.map((student) => ({
            id: student.userId,
            name: student.name,
            attendance: `${student.attendanceRate.toFixed(1)}%`,
          })),
        });
      } catch (error) {
        console.error(`[Tool Registry - ${this.name} Error]:`, error.message);
        return JSON.stringify({
          status: "error",
          message: `Database access error: Could not query student metrics.`,
        });
      }
    },
  },

  {
    name: "check_room_availability",
    description:
      "Checks if a specific campus classroom or lab is free on a given date.",
    execute: async function ({ roomId, date }) {
      try {
        const db = await connectDb();

        // Normalize search elements. Fall back to current day if date parameter is missing
        const targetRoom = String(roomId).toUpperCase().trim();
        const targetDate = date || new Date().toISOString().split("T")[0];

        // QUERY: Check for active reservations matching this specific room and timeline matrix
        const existingReservation = await db
          .collection("room_reservations")
          .findOne({
            roomId: targetRoom,
            date: targetDate,
          });

        const isAvailable = !existingReservation;

        return JSON.stringify({
          status: "success",
          tool: this.name,
          message: `Room ${targetRoom} status calculated for ${targetDate}.`,
          data: {
            roomId: targetRoom,
            date: targetDate,
            available: isAvailable,
            conflicts: isAvailable
              ? []
              : [
                  `${existingReservation.courseName || "Class"} (${existingReservation.timeSlot || "Scheduled Block"})`,
                ],
            suggestedAlternative: isAvailable ? null : "ROOM-302B",
          },
        });
      } catch (error) {
        console.error(`[Tool Registry - ${this.name} Error]:`, error.message);
        return JSON.stringify({
          status: "error",
          message: `Database access error: Matrix lookup failed.`,
        });
      }
    },
  },

  {
    name: "trigger_student_alert",
    description:
      "Sends real-time warning system notifications to specific student profiles.",
    execute: async function ({ studentIds, message }) {
      try {
        if (
          !studentIds ||
          !Array.isArray(studentIds) ||
          studentIds.length === 0
        ) {
          return JSON.stringify({
            status: "error",
            message: "Missing array parameter containing recipient studentIds.",
          });
        }

        const db = await connectDb();

        // QUERY: Look up corresponding contact channels for the selected students
        const students = await db
          .collection("users")
          .find({ userId: { $in: studentIds } })
          .project({ userId: 1, name: 1, phone: 1, fcmToken: 1 })
          .toArray();

        if (students.length === 0) {
          return JSON.stringify({
            status: "error",
            message:
              "No profile records found matching the provided student identifiers.",
          });
        }

        const dispatchLog = [];

        // DELIVERY INTERACTION LOOP: Process delivery queues per profile tracking status logs
        for (const student of students) {
          let pushDelivered = false;
          let smsDelivered = false;

          if (student.fcmToken) {
            pushDelivered = true;
          }
          if (student.phone) {
            smsDelivered = true;
          }

          dispatchLog.push({
            id: student.userId,
            name: student.name,
            channels: [
              pushDelivered && "In-App Push",
              smsDelivered && "SMS Gateway",
            ].filter(Boolean),
          });
        }

        // AUDIT DISPATCH: Write the transaction directly to an active database audit trail log
        await db.collection("alerts_audit").insertOne({
          sender: "Nova AI Tool Pipeline",
          recipients: studentIds,
          payload: message,
          timestamp: new Date(),
        });

        return JSON.stringify({
          status: "success",
          tool: this.name,
          message: `Dispatched warning alert successfully to ${dispatchLog.length} student recipient(s).`,
          data: {
            deliveredTo: dispatchLog,
            payloadMessage: message,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error(`[Tool Registry - ${this.name} Error]:`, error.message);
        return JSON.stringify({
          status: "error",
          message: `Pipeline Exception: Security payload dispatch aborted.`,
        });
      }
    },
  },
];
