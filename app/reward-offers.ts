import { ensureControlTables } from "../db/control-store";

export type RewardProgress = {
  id: number;
  title: string;
  description: string;
  qualifyingOrders: number;
  windowDays: number;
  rewardType: "FREE_DELIVERY";
  minOrder: number;
  completedOrders: number;
  claimCount: number;
  cycleNumber: number;
  remainingOrders: number;
  eligible: boolean;
};

export async function getRewardProgress(mobile: string) {
  const db = await ensureControlTables();
  const result = await db
    .prepare(
      `SELECT r.id,r.title,r.description,r.qualifying_orders qualifyingOrders,
              r.window_days windowDays,r.reward_type rewardType,r.min_order minOrder,
              (SELECT count(*) FROM market_orders o
               WHERE o.mobile=? AND o.status='DELIVERED'
                 AND datetime(o.created_at)>=datetime('now','-' || r.window_days || ' days')
                 AND NOT EXISTS (
                   SELECT 1 FROM market_reward_claims used
                   WHERE used.offer_id=r.id AND used.order_code=o.order_code
                 )) completedOrders,
              (SELECT count(*) FROM market_reward_claims claimed
               WHERE claimed.offer_id=r.id AND claimed.mobile=?
                 AND datetime(claimed.created_at)>=datetime('now','-' || r.window_days || ' days')) claimCount
       FROM market_reward_offers r WHERE r.is_active=1 ORDER BY r.created_at ASC`,
    )
    .bind(mobile, mobile)
    .all<Omit<RewardProgress, "remainingOrders" | "eligible" | "cycleNumber">>();

  return result.results.map((offer) => {
    const earnedCycles = Math.floor(
      Number(offer.completedOrders) / Number(offer.qualifyingOrders),
    );
    const eligible = earnedCycles > Number(offer.claimCount);
    const progressInCycle =
      Number(offer.completedOrders) % Number(offer.qualifyingOrders);
    return {
      ...offer,
      completedOrders: Number(offer.completedOrders),
      claimCount: Number(offer.claimCount),
      cycleNumber: earnedCycles,
      remainingOrders: eligible
        ? 0
        : Number(offer.qualifyingOrders) - progressInCycle,
      eligible,
    };
  });
}
