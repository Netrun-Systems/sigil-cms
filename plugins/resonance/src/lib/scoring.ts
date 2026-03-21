/**
 * Resonance Score Algorithm
 *
 * Computes a composite engagement score (0-100) for individual content blocks
 * based on viewport time, click-through rate, scroll continuation, and bounce
 * avoidance. Also provides A/B experiment evaluation with significance testing.
 */

export interface ResonanceMetrics {
  avgViewportTimeMs: number;
  /** clicks / impressions */
  clickRate: number;
  /** sessions that scrolled past this block / total sessions */
  scrollContinuationRate: number;
  /** bounce_point events / impressions */
  bounceRate: number;
}

/**
 * Compute a resonance score (0-100) from raw engagement metrics.
 *
 * The score weighs:
 * - Viewport time (40%) — longer attention = higher resonance
 * - Click-through rate (30%) — actions taken = strong signal
 * - Scroll continuation (20%) — visitors keep scrolling past = content didn't stop them
 * - Bounce avoidance (10%) — not being the last block seen = good
 *
 * Each component is normalized to 0-100 based on reasonable benchmarks:
 * - Viewport time: 0ms = 0, 10000ms+ = 100
 * - Click rate: 0 = 0, 0.15+ = 100 (15% CTR is exceptional)
 * - Scroll continuation: direct 0-100 mapping (already a percentage)
 * - Bounce avoidance: inverted bounce rate (low bounce = high score)
 */
export function computeResonanceScore(metrics: ResonanceMetrics): number {
  // Normalize viewport time: 0ms → 0, 10s+ → 100
  const viewportScore = Math.min(100, (metrics.avgViewportTimeMs / 10000) * 100);

  // Normalize click rate: 0 → 0, 15%+ → 100
  const clickScore = Math.min(100, (metrics.clickRate / 0.15) * 100);

  // Scroll continuation is already 0-1, map to 0-100
  const scrollScore = Math.min(100, metrics.scrollContinuationRate * 100);

  // Bounce avoidance: invert bounce rate (low bounce = high score)
  const bounceAvoidanceScore = Math.max(0, Math.min(100, (1 - metrics.bounceRate) * 100));

  // Weighted composite
  const composite =
    viewportScore * 0.4 +
    clickScore * 0.3 +
    scrollScore * 0.2 +
    bounceAvoidanceScore * 0.1;

  return Math.round(Math.max(0, Math.min(100, composite)));
}

export interface ExperimentArm {
  impressions: number;
  resonanceScore: number;
}

export interface ExperimentResult {
  winner: 'original' | 'variant' | 'inconclusive';
  lift: number;
}

/**
 * Determine experiment winner using a simple significance test.
 *
 * Uses the difference in resonance scores and requires:
 * 1. Both arms have at least `minSessions` impressions
 * 2. The winning arm's score is at least 5 points higher (minimum detectable effect)
 *
 * Returns the winner and the percentage lift of the winner over the loser.
 */
export function evaluateExperiment(
  original: ExperimentArm,
  variant: ExperimentArm,
  minSessions: number,
): ExperimentResult {
  // Not enough data yet
  if (original.impressions < minSessions || variant.impressions < minSessions) {
    return { winner: 'inconclusive', lift: 0 };
  }

  const diff = variant.resonanceScore - original.resonanceScore;
  const minimumDetectableEffect = 5; // 5-point minimum difference

  if (Math.abs(diff) < minimumDetectableEffect) {
    return { winner: 'inconclusive', lift: 0 };
  }

  // Calculate standard error approximation for the score difference.
  // Treat resonance score as a proportion (score/100) and use a pooled
  // proportion confidence approach.
  const pOriginal = original.resonanceScore / 100;
  const pVariant = variant.resonanceScore / 100;
  const pooled = (pOriginal * original.impressions + pVariant * variant.impressions)
    / (original.impressions + variant.impressions);
  const se = Math.sqrt(
    pooled * (1 - pooled) * (1 / original.impressions + 1 / variant.impressions),
  );

  // z-score for the observed difference (in proportion terms)
  const zScore = se > 0 ? Math.abs(pVariant - pOriginal) / se : 0;

  // Require ~90% confidence (z > 1.645)
  if (zScore < 1.645) {
    return { winner: 'inconclusive', lift: 0 };
  }

  const baseScore = diff > 0 ? original.resonanceScore : variant.resonanceScore;
  const lift = baseScore > 0 ? Math.round((Math.abs(diff) / baseScore) * 100) : 0;

  return {
    winner: diff > 0 ? 'variant' : 'original',
    lift,
  };
}
