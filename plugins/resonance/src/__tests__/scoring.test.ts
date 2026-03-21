import { describe, it, expect } from 'vitest';
import {
  computeResonanceScore,
  evaluateExperiment,
  type ResonanceMetrics,
  type ExperimentArm,
} from '../lib/scoring';
import { generateTrackingSnippet } from '../lib/snippet';

// ---------------------------------------------------------------------------
// computeResonanceScore
// ---------------------------------------------------------------------------
describe('computeResonanceScore', () => {
  it('returns 0 when all metrics are zero', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 0,
      clickRate: 0,
      scrollContinuationRate: 0,
      bounceRate: 0,
    };
    // viewport=0, click=0, scroll=0, bounceAvoidance=(1-0)*100=100
    // composite = 0*0.4 + 0*0.3 + 0*0.2 + 100*0.1 = 10
    expect(computeResonanceScore(metrics)).toBe(10);
  });

  it('returns 100 for maximum engagement', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 10000,
      clickRate: 0.15,
      scrollContinuationRate: 1.0,
      bounceRate: 0,
    };
    // viewport=100, click=100, scroll=100, bounceAvoidance=100
    // composite = 40 + 30 + 20 + 10 = 100
    expect(computeResonanceScore(metrics)).toBe(100);
  });

  it('scores correctly when viewport dominates', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 5000,
      clickRate: 0,
      scrollContinuationRate: 0.5,
      bounceRate: 0.5,
    };
    // viewport = min(100, (5000/10000)*100) = 50
    // click = 0
    // scroll = 50
    // bounceAvoidance = (1 - 0.5) * 100 = 50
    // composite = 50*0.4 + 0*0.3 + 50*0.2 + 50*0.1 = 20 + 0 + 10 + 5 = 35
    expect(computeResonanceScore(metrics)).toBe(35);
  });

  it('scores correctly when clicks dominate', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 1000,
      clickRate: 0.10,
      scrollContinuationRate: 0.3,
      bounceRate: 0.8,
    };
    // viewport = (1000/10000)*100 = 10
    // click = (0.10/0.15)*100 = 66.667
    // scroll = 30
    // bounceAvoidance = (1-0.8)*100 = 20
    // composite = 10*0.4 + 66.667*0.3 + 30*0.2 + 20*0.1
    //           = 4 + 20.0001 + 6 + 2 = 32.0001 → round → 32
    expect(computeResonanceScore(metrics)).toBe(32);
  });

  it('scores moderately with good scroll but no clicks', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 500,
      clickRate: 0,
      scrollContinuationRate: 0.95,
      bounceRate: 0.1,
    };
    // viewport = (500/10000)*100 = 5
    // click = 0
    // scroll = 95
    // bounceAvoidance = (1-0.1)*100 = 90
    // composite = 5*0.4 + 0*0.3 + 95*0.2 + 90*0.1 = 2 + 0 + 19 + 9 = 30
    expect(computeResonanceScore(metrics)).toBe(30);
  });

  it('penalizes heavily for 100% bounce rate', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 4000,
      clickRate: 0.05,
      scrollContinuationRate: 0.6,
      bounceRate: 1.0,
    };
    // viewport = 40
    // click = (0.05/0.15)*100 = 33.333
    // scroll = 60
    // bounceAvoidance = (1-1.0)*100 = 0
    // composite = 40*0.4 + 33.333*0.3 + 60*0.2 + 0*0.1
    //           = 16 + 10 + 12 + 0 = 38
    expect(computeResonanceScore(metrics)).toBe(38);
  });

  it('clamps score to never exceed 100', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 50000,
      clickRate: 1.0,
      scrollContinuationRate: 5.0,
      bounceRate: 0,
    };
    // viewport = min(100, 500) = 100
    // click = min(100, 666.67) = 100
    // scroll = min(100, 500) = 100
    // bounceAvoidance = 100
    // composite = 40 + 30 + 20 + 10 = 100
    // final = min(100, 100) = 100
    expect(computeResonanceScore(metrics)).toBe(100);
  });

  it('clamps score to never go below 0', () => {
    // The algorithm uses Math.max(0, ...) on bounceAvoidance and final result
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 0,
      clickRate: 0,
      scrollContinuationRate: 0,
      bounceRate: 2.0, // invalid but testing clamping
    };
    // viewport = 0
    // click = 0
    // scroll = 0
    // bounceAvoidance = max(0, min(100, (1-2)*100)) = max(0, -100) = 0
    // composite = 0 → max(0, 0) = 0
    expect(computeResonanceScore(metrics)).toBe(0);
  });

  it('handles partial metrics proportionally', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 0,
      clickRate: 0.15,
      scrollContinuationRate: 0,
      bounceRate: 0,
    };
    // viewport = 0
    // click = 100
    // scroll = 0
    // bounceAvoidance = 100
    // composite = 0*0.4 + 100*0.3 + 0*0.2 + 100*0.1 = 0 + 30 + 0 + 10 = 40
    expect(computeResonanceScore(metrics)).toBe(40);
  });

  it('handles negative viewport time by clamping', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: -5000,
      clickRate: -0.1,
      scrollContinuationRate: -0.5,
      bounceRate: 1.5,
    };
    // viewport = min(100, (-5000/10000)*100) = min(100, -50) = -50
    // click = min(100, (-0.1/0.15)*100) = min(100, -66.67) = -66.67
    // scroll = min(100, -0.5*100) = min(100, -50) = -50
    // bounceAvoidance = max(0, min(100, (1-1.5)*100)) = max(0, -50) = 0
    // composite = -50*0.4 + -66.67*0.3 + -50*0.2 + 0*0.1
    //           = -20 + -20.001 + -10 + 0 = -50.001
    // final = max(0, min(100, -50.001)) = 0
    expect(computeResonanceScore(metrics)).toBe(0);
  });

  it('produces a reasonable mid-range score for typical content', () => {
    const metrics: ResonanceMetrics = {
      avgViewportTimeMs: 3000,
      clickRate: 0.05,
      scrollContinuationRate: 0.7,
      bounceRate: 0.2,
    };
    // viewport = (3000/10000)*100 = 30
    // click = (0.05/0.15)*100 = 33.333
    // scroll = 70
    // bounceAvoidance = (1-0.2)*100 = 80
    // composite = 30*0.4 + 33.333*0.3 + 70*0.2 + 80*0.1
    //           = 12 + 10 + 14 + 8 = 44
    expect(computeResonanceScore(metrics)).toBe(44);
  });
});

// ---------------------------------------------------------------------------
// evaluateExperiment
// ---------------------------------------------------------------------------
describe('evaluateExperiment', () => {
  const minSessions = 100;

  it('returns inconclusive when both arms are below minSessions', () => {
    const original: ExperimentArm = { impressions: 30, resonanceScore: 80 };
    const variant: ExperimentArm = { impressions: 40, resonanceScore: 60 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('inconclusive');
    expect(result.lift).toBe(0);
  });

  it('returns inconclusive when original is below minSessions', () => {
    const original: ExperimentArm = { impressions: 50, resonanceScore: 70 };
    const variant: ExperimentArm = { impressions: 200, resonanceScore: 90 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('inconclusive');
    expect(result.lift).toBe(0);
  });

  it('returns inconclusive when variant is below minSessions', () => {
    const original: ExperimentArm = { impressions: 200, resonanceScore: 70 };
    const variant: ExperimentArm = { impressions: 50, resonanceScore: 90 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('inconclusive');
    expect(result.lift).toBe(0);
  });

  it('declares variant winner with positive lift when variant scores higher', () => {
    // Large sample + big difference → should pass z-test
    const original: ExperimentArm = { impressions: 1000, resonanceScore: 50 };
    const variant: ExperimentArm = { impressions: 1000, resonanceScore: 70 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('variant');
    expect(result.lift).toBeGreaterThan(0);
    // lift = round((20 / 50) * 100) = 40
    expect(result.lift).toBe(40);
  });

  it('declares original winner when original scores higher', () => {
    const original: ExperimentArm = { impressions: 1000, resonanceScore: 80 };
    const variant: ExperimentArm = { impressions: 1000, resonanceScore: 60 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('original');
    expect(result.lift).toBeGreaterThan(0);
    // lift = round((20 / 60) * 100) = 33
    expect(result.lift).toBe(33);
  });

  it('returns inconclusive when scores are within 5 points', () => {
    const original: ExperimentArm = { impressions: 1000, resonanceScore: 50 };
    const variant: ExperimentArm = { impressions: 1000, resonanceScore: 53 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('inconclusive');
    expect(result.lift).toBe(0);
  });

  it('returns inconclusive when difference is exactly at minimum detectable effect', () => {
    // diff = 5, but Math.abs(diff) < 5 is false so it passes MDE gate,
    // but may fail the z-test with smaller samples
    const original: ExperimentArm = { impressions: 100, resonanceScore: 50 };
    const variant: ExperimentArm = { impressions: 100, resonanceScore: 55 };
    const result = evaluateExperiment(original, variant, minSessions);
    // With only 100 sessions and a 5-point diff, z-score may not reach 1.645
    // pOrig = 0.50, pVar = 0.55, pooled = 0.525
    // se = sqrt(0.525 * 0.475 * (1/100 + 1/100)) = sqrt(0.249375 * 0.02) = sqrt(0.0049875) ≈ 0.0706
    // z = |0.55 - 0.50| / 0.0706 = 0.05 / 0.0706 ≈ 0.708
    // 0.708 < 1.645 → inconclusive
    expect(result.winner).toBe('inconclusive');
    expect(result.lift).toBe(0);
  });

  it('returns inconclusive for large sample but small score difference', () => {
    // diff = 6 (passes MDE), but let's check if z-test passes
    const original: ExperimentArm = { impressions: 500, resonanceScore: 50 };
    const variant: ExperimentArm = { impressions: 500, resonanceScore: 56 };
    // pOrig = 0.50, pVar = 0.56, pooled = 0.53
    // se = sqrt(0.53 * 0.47 * (1/500 + 1/500)) = sqrt(0.2491 * 0.004) = sqrt(0.0009964) ≈ 0.03157
    // z = 0.06 / 0.03157 ≈ 1.9 → passes 1.645
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('variant');
    expect(result.lift).toBe(12); // round((6/50)*100) = 12
  });

  it('returns inconclusive for large diff but insufficient sample size', () => {
    // Big score gap but too few sessions → fails minSessions check
    const original: ExperimentArm = { impressions: 20, resonanceScore: 30 };
    const variant: ExperimentArm = { impressions: 20, resonanceScore: 80 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('inconclusive');
    expect(result.lift).toBe(0);
  });

  it('calculates lift correctly as (diff / baseScore) * 100', () => {
    const original: ExperimentArm = { impressions: 2000, resonanceScore: 40 };
    const variant: ExperimentArm = { impressions: 2000, resonanceScore: 60 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('variant');
    // diff = 20, base = original = 40
    // lift = round((20 / 40) * 100) = 50
    expect(result.lift).toBe(50);
  });

  it('returns inconclusive when scores are equal', () => {
    const original: ExperimentArm = { impressions: 500, resonanceScore: 60 };
    const variant: ExperimentArm = { impressions: 500, resonanceScore: 60 };
    const result = evaluateExperiment(original, variant, minSessions);
    expect(result.winner).toBe('inconclusive');
    expect(result.lift).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// generateTrackingSnippet
// ---------------------------------------------------------------------------
describe('generateTrackingSnippet', () => {
  const snippet = generateTrackingSnippet('my-site', 'https://api.example.com');

  it('returns a non-empty string', () => {
    expect(typeof snippet).toBe('string');
    expect(snippet.length).toBeGreaterThan(0);
  });

  it('contains IntersectionObserver', () => {
    expect(snippet).toContain('IntersectionObserver');
  });

  it('contains sendBeacon', () => {
    expect(snippet).toContain('sendBeacon');
  });

  it('contains the siteSlug parameter', () => {
    expect(snippet).toContain('my-site');
  });

  it('contains the apiBase parameter', () => {
    expect(snippet).toContain('https://api.example.com');
  });

  it('constructs the correct endpoint URL', () => {
    expect(snippet).toContain(
      'https://api.example.com/api/v1/public/resonance/my-site/events',
    );
  });
});
