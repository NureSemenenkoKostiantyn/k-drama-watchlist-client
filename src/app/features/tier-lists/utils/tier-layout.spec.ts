import { TierList } from '../models/tier-list';
import { layoutOf, moveTitle, removeTier, UNRANKED } from './tier-layout';

export function exampleTierList(): TierList {
  const media = (id: number) => ({
    id: `tv:${id}`,
    mediaType: 'tv' as const,
    tmdbId: id,
    title: `Drama ${id}`,
    originalTitle: `Drama ${id}`,
  });
  return {
    id: '507f1f77bcf86cd799439011',
    title: 'My dramas',
    description: '',
    visibility: 'private',
    source: 'manual',
    capacity: 300,
    revision: 4,
    itemCount: 3,
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
    tiers: [
      { id: 's', label: 'S', color: 'red', items: [media(1), media(2)] },
      { id: 'a', label: 'A', color: 'green', items: [] },
    ],
    unranked: [media(3)],
  };
}

describe('tier layout operations', () => {
  it('moves between tiers without temporarily unassigning or changing the source object', () => {
    const board = exampleTierList();
    const previous = structuredClone(board);
    const layout = moveTitle(board, { mediaId: 'tv:1', targetId: 'a', index: 0 });
    expect(layout.tiers[0].mediaIds).toEqual(['tv:2']);
    expect(layout.tiers[1].mediaIds).toEqual(['tv:1']);
    expect(layout.unrankedMediaIds).toEqual(['tv:3']);
    expect(board).toEqual(previous);
  });
  it('reorders within a tier and moves into or out of Unranked', () => {
    const board = exampleTierList();
    expect(
      moveTitle(board, { mediaId: 'tv:1', targetId: 's', index: 1 }).tiers[0].mediaIds,
    ).toEqual(['tv:2', 'tv:1']);
    expect(
      moveTitle(board, { mediaId: 'tv:3', targetId: 's', index: 1 }).tiers[0].mediaIds,
    ).toEqual(['tv:1', 'tv:3', 'tv:2']);
    expect(
      moveTitle(board, { mediaId: 'tv:1', targetId: UNRANKED, index: 1 }).unrankedMediaIds,
    ).toEqual(['tv:3', 'tv:1']);
  });
  it('preserves all titles when a tier is removed and keeps at least one tier', () => {
    const board = exampleTierList();
    const layout = removeTier(board, 's');
    expect(layout.tiers.map((tier) => tier.id)).toEqual(['a']);
    expect(layout.unrankedMediaIds).toEqual(['tv:3', 'tv:1', 'tv:2']);
    board.tiers = board.tiers.slice(0, 1);
    expect(removeTier(board, 's')).toEqual(layoutOf(board));
  });
  it('ignores invalid move targets without losing a title', () => {
    const board = exampleTierList();
    expect(moveTitle(board, { mediaId: 'tv:1', targetId: 'missing', index: 0 })).toEqual(
      layoutOf(board),
    );
  });
});
