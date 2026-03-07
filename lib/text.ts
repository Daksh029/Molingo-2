export function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenSet(input: string): Set<string> {
  return new Set(normalizeForMatch(input).split(" ").filter(Boolean));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);

  if (setA.size === 0 && setB.size === 0) {
    return 1;
  }

  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;

  if (union === 0) {
    return 0;
  }

  return intersection / union;
}
