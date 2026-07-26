import {
  buildShareCardSvg,
  createShareCardFilename,
  deliverShareCardBlob,
} from './share-card-export.service';
import { vi } from 'vitest';

describe('share card export', () => {
  it.each([
    ['square', 1080, 1080],
    ['story', 1080, 1920],
    ['landscape', 1200, 630],
  ] as const)(
    'renders the documented %s dimensions',
    (format, width, height) => {
      const svg = buildShareCardSvg({
        source: {
          kind: 'media',
          title: 'Goblin',
          username: 'dahyun',
        },
        configuration: {
          template: 'recommendation',
          format,
          theme: 'dark',
          includeRating: false,
          includeDescription: false,
          includeProgress: false,
          includeUsername: true,
        },
      });

      expect(svg).toContain(`width="${width}" height="${height}"`);
      expect(svg).toContain('@dahyun');
    },
  );

  it('keeps private descriptions out unless explicitly included', () => {
    const request = {
      source: {
        kind: 'media' as const,
        title: 'A & B',
        description: 'Private <note>',
      },
      configuration: {
        template: 'recommendation' as const,
        format: 'square' as const,
        theme: 'dark' as const,
        includeRating: false,
        includeDescription: false,
        includeProgress: false,
        includeUsername: false,
      },
    };

    expect(buildShareCardSvg(request)).not.toContain('Private');

    const svg = buildShareCardSvg({
      ...request,
      configuration: {
        ...request.configuration,
        includeDescription: true,
      },
    });

    expect(svg).toContain('Private &lt;note&gt;');
    expect(svg).toContain('A &amp; B');
  });

  it('creates a safe and useful filename', () => {
    expect(createShareCardFilename('Crash Landing on You!')).toBe(
      'crash-landing-on-you',
    );
    expect(createShareCardFilename('도깨비')).toBe('drama-watch-card');
  });

  it('shares the generated PNG as a file when native sharing supports it', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      canShare: vi.fn().mockReturnValue(true),
      share,
    });

    await expect(
      deliverShareCardBlob(
        new Blob(['png'], { type: 'image/png' }),
        'goblin-square.png',
        'Goblin',
      ),
    ).resolves.toBe('shared');

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Goblin · Drama Watch',
        files: [expect.objectContaining({ name: 'goblin-square.png' })],
      }),
    );
    vi.unstubAllGlobals();
  });

  it('copies the PNG when native file sharing is unavailable', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    class TestClipboardItem {
      constructor(readonly items: Record<string, Blob>) {}
    }
    vi.stubGlobal('navigator', {
      canShare: vi.fn().mockReturnValue(false),
      clipboard: { write },
    });
    vi.stubGlobal('ClipboardItem', TestClipboardItem);

    await expect(
      deliverShareCardBlob(
        new Blob(['png'], { type: 'image/png' }),
        'goblin-square.png',
        'Goblin',
      ),
    ).resolves.toBe('copied');

    expect(write).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
