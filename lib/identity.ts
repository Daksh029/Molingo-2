const FALLBACK_ID = "molingo-local-learner";

export function getLearnerIdFromHeaders(headers: Headers): string {
  const raw = headers.get("x-learner-id")?.trim();
  if (!raw) {
    return FALLBACK_ID;
  }

  return raw.slice(0, 120);
}

export function generateLocalLearnerId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `learner-${crypto.randomUUID()}`;
    }
    return `${FALLBACK_ID}-${Math.random().toString(36).slice(2, 10)}`;
  } catch {
    return `${FALLBACK_ID}-${Date.now()}`;
  }
}
