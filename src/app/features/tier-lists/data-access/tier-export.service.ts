import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { deliverShareCardBlob } from '../../share-cards/data-access/share-card-export.service';
import { TierMedia, TierRow, TIER_COLORS } from '../models/tier-list';

interface ExportBoard {
  title: string;
  tiers: Omit<TierRow, 'id'>[];
}
const WIDTH = 1200;
const COLUMNS = 10;
const TILE_HEIGHT = 170;

export function tierExportLayout(board: ExportBoard) {
  let y = 112;
  const rows = board.tiers.map((row) => {
    const height = Math.max(1, Math.ceil(row.items.length / COLUMNS)) * TILE_HEIGHT + 16;
    const result = { row, y, height };
    y += height + 6;
    return result;
  });
  return { width: WIDTH, height: y + 48, rows };
}

@Injectable({ providedIn: 'root' })
export class TierExportService {
  private readonly document = inject(DOCUMENT);

  async export(board: ExportBoard, share = false): Promise<string> {
    const { blob, missingPosters } = await this.render(board);
    const filename = `${board.title.replace(/[^\p{L}\p{N}_-]/gu, '-').slice(0, 70) || 'tier-list'}.png`;
    let delivery = 'downloaded';
    if (share) delivery = await deliverShareCardBlob(blob, filename, board.title);
    else {
      const url = URL.createObjectURL(blob);
      const link = this.document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return `PNG ${delivery}.${missingPosters ? ` ${missingPosters} posters were unavailable; title placeholders were used.` : ''}`;
  }

  async render(board: ExportBoard): Promise<{ blob: Blob; missingPosters: number }> {
    const layout = tierExportLayout(board);
    const canvas = this.document.createElement('canvas');
    canvas.width = layout.width;
    canvas.height = layout.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('PNG export is not supported in this browser.');
    ctx.fillStyle = '#100d18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f7fb';
    ctx.font = 'bold 32px sans-serif';
    fitText(ctx, board.title, 24, 52, WIDTH - 48);
    ctx.fillStyle = '#bdb4ca';
    ctx.font = '16px sans-serif';
    ctx.fillText('DRAMA WATCH · MY TIER LIST', 24, 86);
    const jobs: { item: TierMedia; x: number; y: number }[] = [];
    for (const { row, y, height } of layout.rows) {
      ctx.fillStyle = '#211a2d';
      ctx.fillRect(24, y, WIDTH - 48, height);
      ctx.fillStyle = TIER_COLORS[row.color];
      ctx.fillRect(24, y, 116, height);
      ctx.fillStyle = '#181321';
      ctx.font = 'bold 18px sans-serif';
      const words = row.label.match(/.{1,10}/gu) ?? [''];
      words
        .slice(0, 4)
        .forEach((line, index) =>
          ctx.fillText(line, 32, y + height / 2 - (words.length - 1) * 11 + index * 22),
        );
      row.items.forEach((item, index) =>
        jobs.push({
          item,
          x: 150 + (index % COLUMNS) * 102,
          y: y + 8 + Math.floor(index / COLUMNS) * TILE_HEIGHT,
        }),
      );
    }
    let cursor = 0;
    let missingPosters = 0;
    const deadline = Date.now() + 15_000;
    const worker = async () => {
      while (cursor < jobs.length) {
        const job = jobs[cursor++];
        const remaining = deadline - Date.now();
        const image =
          remaining > 0 ? await this.poster(job.item.posterUrl, Math.min(8000, remaining)) : null;
        ctx.fillStyle = '#35283e';
        ctx.fillRect(job.x, job.y, 94, 135);
        if (image) {
          const scale = Math.max(94 / image.naturalWidth, 135 / image.naturalHeight);
          ctx.save();
          ctx.beginPath();
          ctx.rect(job.x, job.y, 94, 135);
          ctx.clip();
          ctx.drawImage(
            image,
            job.x + (94 - image.naturalWidth * scale) / 2,
            job.y + (135 - image.naturalHeight * scale) / 2,
            image.naturalWidth * scale,
            image.naturalHeight * scale,
          );
          ctx.restore();
        } else {
          missingPosters++;
          ctx.fillStyle = '#bdb4ca';
          ctx.font = '12px sans-serif';
          ctx.fillText('No poster', job.x + 16, job.y + 72);
        }
        ctx.fillStyle = '#f8f7fb';
        ctx.font = '12px sans-serif';
        fitText(ctx, job.item.title, job.x, job.y + 151, 94);
      }
    };
    await Promise.all(Array.from({ length: Math.min(6, jobs.length) }, worker));
    ctx.fillStyle = '#bdb4ca';
    ctx.font = '14px sans-serif';
    ctx.fillText('dahyun.best · Unranked titles are not included', 24, layout.height - 16);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error('The tier list could not be exported.')),
        'image/png',
      ),
    );
    return { blob, missingPosters };
  }

  private poster(url: string | undefined, timeoutMs: number): Promise<HTMLImageElement | null> {
    if (!url) return Promise.resolve(null);
    return new Promise((resolve) => {
      const image = this.document.createElement('img');
      image.crossOrigin = 'anonymous';
      const finish = (value: HTMLImageElement | null) => {
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        if (!value) image.src = '';
        resolve(value);
      };
      const timeout = setTimeout(() => finish(null), timeoutMs);
      image.onload = () => finish(image.naturalWidth && image.naturalHeight ? image : null);
      image.onerror = () => finish(null);
      image.src = url.replace(/^(https:\/\/image\.tmdb\.org\/t\/p\/)w\d+\//, '$1w185/');
    });
  }
}

function fitText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
): void {
  let text = value;
  while (text.length > 1 && ctx.measureText(text).width > width) text = text.slice(0, -1);
  if (text !== value) text = `${text.slice(0, -1)}…`;
  ctx.fillText(text, x, y);
}
