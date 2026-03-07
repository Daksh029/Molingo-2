"use client";

import Link from "next/link";
import { Unit } from "@/lib/types";

const mascotEmojiByUnit: Record<number, string> = {
  1: "🦦",
  2: "🐼",
  3: "🦊",
  4: "🐰",
  5: "🐨",
  6: "🐧"
};

type UnitProgress = {
  unitId: number;
  completed: number;
  total: number;
  unlocked: boolean;
};

export function UnitPath({ units, progress }: { units: Unit[]; progress: UnitProgress[] }) {
  return (
    <section className="molingo-card animate-pop" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Learning Path</h2>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
        }}
      >
        {units.map((unit, index) => {
          const status = progress.find((entry) => entry.unitId === unit.id);
          const unlocked = status?.unlocked ?? unit.id === 1;
          const done = status ? `${status.completed}/${status.total}` : "0/4";

          return (
            <Link
              key={unit.id}
              href={unlocked ? `/learn/${unit.id}` : "#"}
              aria-disabled={!unlocked}
              style={{
                pointerEvents: unlocked ? "auto" : "none",
                opacity: unlocked ? 1 : 0.55,
                borderRadius: 20,
                border: "2px solid rgba(31, 50, 66, 0.09)",
                padding: 16,
                background: "#fff",
                display: "block"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: 28 }}>{mascotEmojiByUnit[unit.id] ?? "🐾"}</span>
                <span
                  style={{
                    background: unit.color,
                    color: "white",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  Unit {index + 1}
                </span>
              </div>
              <h3 style={{ margin: "10px 0 6px" }}>{unit.title}</h3>
              <p style={{ margin: 0, opacity: 0.8 }}>{unit.description}</p>
              <div style={{ marginTop: 10, fontWeight: 700 }}>Progress: {done}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
