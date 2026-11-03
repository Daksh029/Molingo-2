import { Hero } from "@/components/Hero";
import { UnitPath } from "@/components/UnitPath";
import { units } from "@/lib/curriculum";
import { getProgressSummary } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function loadProgress() {
  return getProgressSummary("molingo-local-learner");
}

export default async function HomePage() {
  const progress = await loadProgress();

  return (
    <main>
      <Hero />
      <section className="molingo-card animate-pop" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, opacity: 0.75 }}>Streak</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{progress.streakDays} days</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, opacity: 0.75 }}>Checkpoints</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>
              {progress.completedItems}/{progress.totalItems}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, opacity: 0.75 }}>Unlocks By</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Quizzes</div>
          </div>
        </div>
      </section>
      <UnitPath units={units} progress={progress.unitProgress} />
    </main>
  );
}

