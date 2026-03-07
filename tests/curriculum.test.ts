import { describe, expect, it } from "vitest";
import { getLessonsByUnit, lessonItems, units } from "@/lib/curriculum";

describe("curriculum integrity", () => {
  it("includes 6 units and 120 lesson items", () => {
    expect(units).toHaveLength(6);
    expect(lessonItems).toHaveLength(120);
  });

  it("ensures each lesson item has required teaching fields", () => {
    for (const item of lessonItems) {
      expect(item.target_audio_text.length).toBeGreaterThan(0);
      expect(item.romanized_gujarati.length).toBeGreaterThan(0);
      expect(item.acceptable_variants.length).toBeGreaterThan(0);
      expect(item.coach_tip.length).toBeGreaterThan(0);
    }
  });

  it("keeps each unit balanced at 20 items", () => {
    for (const unit of units) {
      expect(getLessonsByUnit(unit.id)).toHaveLength(20);
    }
  });
});
