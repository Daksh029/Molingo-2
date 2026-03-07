import { NextResponse } from "next/server";
import { getLessonsByUnit } from "@/lib/curriculum";

export async function GET(_request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const parsed = Number(unitId);

  if (!Number.isInteger(parsed)) {
    return NextResponse.json({ error: "Invalid unit id" }, { status: 400 });
  }

  const lessons = getLessonsByUnit(parsed);

  if (!lessons.length) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  return NextResponse.json(lessons);
}
