import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAuth } from "@/lib/rbac";
import { publishEvent } from "@/lib/ssePublisher";
import { v4 as uuidv4 } from "uuid";

export async function GET(request) {
  try {
    const token = await requireAuth(request);

    // Fetch all active polls
    const pollsSnapshot = await db
      .collection("polls")
      .where("isActive", "==", true)
      .get();

    const polls = pollsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // If teacher, return all data including answers
    if (token.role === "teacher" || token.role === "admin") {
      return NextResponse.json({ success: true, polls });
    }

    // If student, filter out correct answers and see if they already answered
    const studentPolls = await Promise.all(
      polls.map(async (poll) => {
        const answerDoc = await db
          .collection("polls")
          .doc(poll.id)
          .collection("answers")
          .doc(token.uid)
          .get();

        const { correctAnswerIndex, ...safePoll } = poll;

        return {
          ...safePoll,
          hasAnswered: answerDoc.exists,
          submittedAnswer: answerDoc.exists
            ? answerDoc.data().answerIndex
            : null,
        };
      })
    );

    return NextResponse.json({ success: true, polls: studentPolls });
  } catch (error) {
    console.error("Fetch Polls Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = await requireAuth(request);

    if (token.role !== "teacher" && token.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { question, options, correctAnswerIndex, xpReward } =
      await request.json();

    if (
      !question ||
      !options ||
      options.length < 2 ||
      correctAnswerIndex === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newPoll = {
      teacherId: token.uid,
      question,
      options,
      correctAnswerIndex,
      xpReward: xpReward || 10,
      isActive: true,
      createdAt: new Date(),
      totalResponses: 0,
      correctResponses: 0,
    };

    const pollRef = await db.collection("polls").add(newPoll);

    // Broadcast poll creation to active stream
    await publishEvent("polls", "POLL_CREATED", { id: pollRef.id, ...newPoll });

    return NextResponse.json({
      success: true,
      pollId: pollRef.id,
      message: "Poll created successfully",
    });
  } catch (error) {
    console.error("Create Poll Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
