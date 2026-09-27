import { TierLayout, TierList } from '../models/tier-list';

export interface TierMove {
  mediaId: string;
  targetId: string;
  index: number;
}
export const UNRANKED = '__unranked';

export function layoutOf(board: TierList): TierLayout {
  return {
    revision: board.revision,
    tiers: board.tiers.map(({ id, label, color, items }) => ({
      id,
      label,
      color,
      mediaIds: items.map((item) => item.id),
    })),
    unrankedMediaIds: board.unranked.map((item) => item.id),
  };
}

export function moveTitle(board: TierList, move: TierMove): TierLayout {
  const layout = layoutOf(board);
  const groups = new Map([
    ...layout.tiers.map((tier) => [tier.id, tier.mediaIds] as const),
    [UNRANKED, layout.unrankedMediaIds] as const,
  ]);
  const target = groups.get(move.targetId);
  const source = [...groups.values()].find((ids) => ids.includes(move.mediaId));
  if (!target || !source || !Number.isInteger(move.index)) return layout;
  source.splice(source.indexOf(move.mediaId), 1);
  target.splice(Math.max(0, Math.min(move.index, target.length)), 0, move.mediaId);
  return layout;
}

export function removeTier(board: TierList, tierId: string): TierLayout {
  const layout = layoutOf(board);
  if (layout.tiers.length <= 1) return layout;
  const row = layout.tiers.find((tier) => tier.id === tierId);
  if (!row) return layout;
  layout.unrankedMediaIds.push(...row.mediaIds);
  layout.tiers = layout.tiers.filter((tier) => tier.id !== tierId);
  return layout;
}
