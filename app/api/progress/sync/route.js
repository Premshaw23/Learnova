/**
 * app/api/progress/sync/route.js
 *
 * Offline progress synchronization endpoint with server-side validation.
 * Validates all offline changes against server state before applying.
 *
 * This prevents:
 * - Students from marking lessons complete without prerequisites
 * - Progress from decreasing (going backwards)
 * - Lessons from being marked complete unreasonably fast
 * - Replay attacks via timestamp validation
 */

import { validateOfflineSync } from '@/lib/offline-progress-validation';
import { connectDb } from '@/lib/mongodb';

export async function POST(req) {
  try {
    // Validate request has required auth context
    // In production, use proper auth middleware/context
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const syncRequest = await req.json();

    if (!syncRequest) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID from auth context (simplified)
    // In production, extract from verified token
    const userId = syncRequest.userId || 'unknown';

    // Fetch server state for validation
    const db = await connectDb();
    const userProgress = await db.collection('userProgress').findOne({ userId });
    const serverProgress = userProgress?.progress || {};

    // Fetch lesson metadata needed for validation
    const lessons = await db.collection('lessons').find({}).toArray();
    const lessonMetadata = {};
    for (const lesson of lessons) {
      lessonMetadata[lesson._id.toString()] = {
        estimatedDurationMinutes: lesson.estimatedDurationMinutes,
        prerequisites: lesson.prerequisites || [],
      };
    }

    const serverState = {
      progress: serverProgress,
      lessonMetadata,
    };

    // Validate entire sync request
    const validation = validateOfflineSync(syncRequest, serverState);

    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Sync validation failed',
          details: validation.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // All validations passed - apply changes
    const { offlineChanges } = syncRequest;

    // Update progress for each validated change
    const updateOps = [];
    for (const change of offlineChanges) {
      const { lessonId, progress, completed, timeSpentMs } = change;

      updateOps.push(
        db.collection('userProgress').updateOne(
          { userId, 'progress.lessonId': lessonId },
          {
            $set: {
              [`progress.${lessonId}`]: progress,
              [`completionData.${lessonId}`]: {
                completed,
                timeSpentMs,
                syncedAt: new Date(),
              },
            },
          },
          { upsert: true }
        )
      );
    }

    if (updateOps.length > 0) {
      await Promise.all(updateOps);
    }

    // Return success with updated state
    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${offlineChanges.length} changes`,
        syncedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Progress sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
