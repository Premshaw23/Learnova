import { NextResponse } from "next/server";
import { getJob } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { jobId } = await params;

  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const job = await getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = {
    id: job.id,
    type: job.type,
    status: job.status,
    retries: Number(job.retries) || 0,
    maxRetries: Number(job.maxRetries) || 3,
    createdAt: Number(job.createdAt),
    updatedAt: Number(job.updatedAt),
  };

  if (job.status === "completed" && job.result) {
    body.result = job.result;
  }

  if (job.status === "failed" && job.error) {
    body.error = job.error;
  }

  return NextResponse.json(body);
}
