"use client";

import Link from "next/link";
import { ChapterAnimal } from "@/components/ChapterAnimal";
import type { CSSProperties } from "react";
import { Unit } from "@/lib/types";

type UnitProgress = {
  unitId: number;
  completed: number;
  total: number;
  unlocked: boolean;
};

export function UnitPath({ units, progress }: { units: Unit[]; progress: UnitProgress[] }) {
  return (
    <section className="molingo-card animate-pop chapter-path">
      <div className="chapter-heading"><div><p className="chapter-eyebrow">YOUR GUJARATI ADVENTURE</p><h2>Little steps. Lovely company.</h2></div><p>Meet a new friend in every chapter.</p></div>
      <div className="chapter-grid">
        {units.map((unit, index) => {
          const status = progress.find((entry) => entry.unitId === unit.id);
          const unlocked = status?.unlocked ?? unit.id === 1;
          const completed = status?.completed ?? 0;
          const total = status?.total ?? 4;
          const done = `${completed}/${total}`;
          const contents = <>
            <div className="chapter-card-top"><span>CHAPTER {String(index + 1).padStart(2, "0")}</span><span>{unlocked ? "✦" : "Locked"}</span></div>
            <div className="chapter-portrait"><ChapterAnimal unitId={unit.id} decorative /></div>
            <p className="chapter-companion">With {unit.mascot}</p>
            <h3>{unit.title}</h3><p className="chapter-description">{unit.description}</p>
            <div className="chapter-progress" role="progressbar" aria-label={`${unit.title} progress`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><span style={{ width: `${total ? Math.min(100, completed / total * 100) : 0}%` }} /></div>
            <div className="chapter-card-bottom"><span>{done} completed</span><strong>{unlocked ? (completed ? "Continue →" : "Let's begin →") : "Up next"}</strong></div>
          </>;
          const style = { "--chapter-color": unit.color } as CSSProperties;
          return unlocked ? <Link key={unit.id} href={`/learn/${unit.id}`} className="chapter-card" style={style}>{contents}</Link> : <div key={unit.id} className="chapter-card chapter-locked" style={style} aria-disabled="true">{contents}</div>;
        })}
      </div>
    </section>
  );
}
