/**
 * Reputation and gamification system
 *
 * Tracks member reputation points based on community activity
 * and assigns level titles for display.
 */

import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { communityMembers } from '../schema.js';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';

// ---------------------------------------------------------------------------
// Reputation Point Values
// ---------------------------------------------------------------------------

export const REPUTATION_POINTS = {
  POST_CREATED: 2,
  REPLY_CREATED: 1,
  UPVOTE_RECEIVED: 5,
  DOWNVOTE_RECEIVED: -2,
  ANSWER_ACCEPTED: 15,
  POST_UPVOTED_BY_MEMBER: 0, // cost to the voter (kept at 0)
} as const;

export type ReputationAction = keyof typeof REPUTATION_POINTS;

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Add reputation points to a member based on an action.
 * Returns the updated reputation value.
 */
export async function addReputation(
  db: DrizzleClient,
  memberId: string,
  action: ReputationAction,
): Promise<number> {
  const d = db as any;
  const points = REPUTATION_POINTS[action];

  if (points === 0) return 0;

  const [updated] = await d
    .update(communityMembers)
    .set({
      reputation: sql`${communityMembers.reputation} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(communityMembers.id, memberId))
    .returning({ reputation: communityMembers.reputation });

  return updated?.reputation ?? 0;
}

/**
 * Get the leaderboard of top contributors by reputation.
 */
export async function getLeaderboard(
  db: DrizzleClient,
  siteId: string,
  limit: number = 20,
): Promise<Array<{ member: Record<string, unknown>; reputation: number; postCount: number }>> {
  const d = db as any;

  const results = await d
    .select({
      id: communityMembers.id,
      displayName: communityMembers.displayName,
      avatarUrl: communityMembers.avatarUrl,
      reputation: communityMembers.reputation,
      postCount: communityMembers.postCount,
      role: communityMembers.role,
    })
    .from(communityMembers)
    .where(eq(communityMembers.siteId, siteId))
    .orderBy(desc(communityMembers.reputation))
    .limit(limit);

  return results.map((r: any) => ({
    member: {
      id: r.id,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      role: r.role,
      title: getReputationTitle(r.reputation),
    },
    reputation: r.reputation,
    postCount: r.postCount,
  }));
}

// ---------------------------------------------------------------------------
// Reputation Titles
// ---------------------------------------------------------------------------

/**
 * Get a display title based on reputation score.
 */
export function getReputationTitle(reputation: number): string {
  if (reputation >= 1000) return 'Legend';
  if (reputation >= 500) return 'Expert';
  if (reputation >= 200) return 'Trusted';
  if (reputation >= 50) return 'Regular';
  if (reputation >= 10) return 'Contributor';
  return 'Newcomer';
}
