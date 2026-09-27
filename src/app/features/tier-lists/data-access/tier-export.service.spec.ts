import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TierExportService, tierExportLayout } from './tier-export.service';
import { TierList } from '../models/tier-list';

describe('TierExportService', () => {
  afterEach(() => vi.restoreAllMocks());
  const board: TierList = {
    id: 'b',
    title: 'Ranking',
    description: '',
    revision: 0,
    visibility: 'private',
    itemCount: 2,
    createdAt: '',
    updatedAt: '',
    tiers: [
      {
        id: 's',
        label: 'S',
        color: 'red',
        items: [
          {
            id: 'tv:1',
            title: 'Public title',
            originalTitle: 'Public title',
            mediaType: 'tv',
            tmdbId: 1,
          },
        ],
      },
    ],
    unranked: [
      {
        id: 'tv:2',
        title: 'PRIVATE UNRANKED',
        originalTitle: 'Private',
        mediaType: 'tv',
        tmdbId: 2,
      },
    ],
  };
  it('keeps export size bounded for 300 titles and omits Unranked', () => {
    const large = {
      ...board,
      tiers: [
        { ...board.tiers[0], items: Array.from({ length: 300 }, () => board.tiers[0].items[0]) },
      ],
    };
    const layout = tierExportLayout(large);
    expect(layout.width).toBe(1200);
    expect(layout.height).toBeLessThan(6000);
    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].row.items).toHaveLength(300);
  });
  it('exports a PNG with a title placeholder when the poster is missing', async () => {
    const ctx = {
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 6 })),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
      callback(new Blob(['png'], { type: 'image/png' })),
    );
    const result = await TestBed.inject(TierExportService).render(board);
    expect(result.blob.type).toBe('image/png');
    expect(result.missingPosters).toBe(1);
    const drawnText = ctx.fillText.mock.calls.map((args) => args[0]).join(' ');
    expect(drawnText).toContain('Public title');
    expect(drawnText).not.toContain('PRIVATE UNRANKED');
  });
});
