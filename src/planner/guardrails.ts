import type { EditOperation, EditingPattern, StyleProfile } from "../core/types.js";

export interface GuardrailResult {
  accepted: EditOperation[];
  rejected: Array<{ operation: EditOperation; reason: string }>;
}

export function applyEditingGuardrails(
  operations: EditOperation[],
  patterns: Map<string, EditingPattern>,
  style: StyleProfile,
): GuardrailResult {
  const accepted: EditOperation[] = [];
  const rejected: Array<{ operation: EditOperation; reason: string }> = [];

  for (const operation of [...operations].sort((a, b) => a.start - b.start)) {
    const pattern = patterns.get(operation.patternId);
    if (!pattern) {
      rejected.push({ operation, reason: "unknown_pattern" });
      continue;
    }

    const previousSame = [...accepted].reverse().find((item) => item.patternId === operation.patternId);
    if (previousSame && operation.start - previousSame.start < style.minimumSamePatternGapSeconds) {
      rejected.push({ operation, reason: "same_pattern_cooldown" });
      continue;
    }

    if (operation.intensity === "high") {
      const windowStart = Math.max(0, operation.start - 30);
      const strongInWindow = accepted.filter(
        (item) => item.intensity === "high" && item.start >= windowStart && item.start <= operation.start,
      ).length;
      if (strongInWindow >= style.strongEffectBudgetPer30s) {
        rejected.push({ operation, reason: "strong_effect_budget" });
        continue;
      }
    }

    accepted.push(operation);
  }

  return { accepted, rejected };
}
