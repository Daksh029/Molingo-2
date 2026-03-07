import { NextResponse } from "next/server";
import { units } from "@/lib/curriculum";
import { getLearnerIdFromHeaders } from "@/lib/identity";
import { getProgressSummary } from "@/lib/storage";

export async function GET(request: Request) {
  const learnerId = getLearnerIdFromHeaders(request.headers);
  const progress = await getProgressSummary(learnerId);

  const payload = units.map((unit) => {
    const unitProgress = progress.unitProgress.find((entry) => entry.unitId === unit.id);
    return {
      ...unit,
      unlocked: unitProgress?.unlocked ?? unit.id === 1,
      completed: unitProgress?.completed ?? 0,
      total: unitProgress?.total ?? 20
    };
  });

  return NextResponse.json(payload);
}
