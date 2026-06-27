import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { AppError, ValidationError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  createWebhook,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  listWebhooks,
} from "@/lib/models/webhookModel";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["admin"]);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `webhooks_create_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const body = await parseJSON(request, 1024 * 10);
  const { url, secret, events, description } = body;

  if (!url || !secret || !events) {
    throw new ValidationError("url, secret, and events are required");
  }

  if (!Array.isArray(events) || events.length === 0) {
    throw new ValidationError("events must be a non-empty array");
  }

  try {
    new URL(url);
  } catch {
    throw new ValidationError("Invalid webhook URL");
  }

  const webhook = await createWebhook({
    url,
    secret,
    events,
    description: description || "",
    status: "active",
    createdBy: decodedToken.uid,
  });

  return jsonSuccess({ webhook }, 201);
});

export const GET = withErrorHandler(async (request) => {
  await requireRole(request, ["admin"]);
  const { searchParams } = new URL(request.url);
  const filter = {};
  if (searchParams.get("status")) filter.status = searchParams.get("status");
  const webhooks = await listWebhooks(filter);
  return jsonSuccess({ webhooks });
});

export const PUT = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["admin"]);
  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get("webhookId");

  if (!webhookId) {
    throw new ValidationError("webhookId query parameter is required");
  }

  const existing = await getWebhookById(webhookId);
  if (!existing) {
    throw new AppError("Webhook not found", 404);
  }

  const body = await parseJSON(request, 1024 * 10);
  const allowedFields = ["url", "secret", "events", "status", "description"];
  const updates = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (updates.url) {
    try {
      new URL(updates.url);
    } catch {
      throw new ValidationError("Invalid webhook URL");
    }
  }

  if (updates.events && (!Array.isArray(updates.events) || updates.events.length === 0)) {
    throw new ValidationError("events must be a non-empty array");
  }

  const webhook = await updateWebhook(webhookId, updates);
  return jsonSuccess({ webhook });
});

export const DELETE = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["admin"]);
  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get("webhookId");

  if (!webhookId) {
    throw new ValidationError("webhookId query parameter is required");
  }

  const existing = await getWebhookById(webhookId);
  if (!existing) {
    throw new AppError("Webhook not found", 404);
  }

  await deleteWebhook(webhookId);
  return jsonSuccess({ message: "Webhook deleted successfully" });
});
