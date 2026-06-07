import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { getAllWebhooks, createWebhook, updateWebhook, deleteWebhook } from "@/db/webhookStore";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const decodedToken = await requireAdmin(request);
    if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const webhooks = await getAllWebhooks();
    return NextResponse.json(webhooks);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decodedToken = await requireAdmin(request);
    if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    if (!body.url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const webhook = await createWebhook({
      ...body,
      userId: decodedToken.uid
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const decodedToken = await requireAdmin(request);
    if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { webhookId, ...updates } = body;
    
    if (!webhookId) {
      return NextResponse.json({ error: "webhookId is required" }, { status: 400 });
    }

    const webhook = await updateWebhook(webhookId, updates);
    return NextResponse.json(webhook);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const decodedToken = await requireAdmin(request);
    if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const webhookId = url.searchParams.get("id");
    
    if (!webhookId) {
      return NextResponse.json({ error: "webhookId parameter is required" }, { status: 400 });
    }

    await deleteWebhook(webhookId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
