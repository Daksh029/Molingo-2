import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getLessonsByUnit, units } from "@/lib/curriculum";

export default async function UnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const parsed = Number(unitId);
  if (!Number.isInteger(parsed)) {
    notFound();
  }

  const unit = units.find((entry) => entry.id === parsed);
  if (!unit) {
    notFound();
  }

  const lessons = getLessonsByUnit(parsed);

  return (
    <main>
      <Link href="/" style={{ fontWeight: 700, display: "inline-block", marginBottom: 12 }}>
        Back to Path
      </Link>
      <LessonPlayer unit={unit} items={lessons} />
    </main>
  );
}
