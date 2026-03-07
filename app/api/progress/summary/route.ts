import { NextResponse } from "next/server";
import { getLearnerIdFromHeaders } from "@/lib/identity";
import { getProgressSummary } from "@/lib/storage";

export async function GET(request: Request) {
  const learnerId = getLearnerIdFromHeaders(request.headers);
  const summary = await getProgressSummary(learnerId);
  return NextResponse.json(summary);
}
