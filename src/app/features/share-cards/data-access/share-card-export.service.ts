import { Injectable } from '@angular/core';

import {
  ShareCardExportRequest,
  shareCardDimensions,
} from '../models/share-card';

interface ShareCardAssets {
  posterDataUrl?: string;
  backdropDataUrl?: string;
}

export type ShareCardDelivery =
  | 'shared'
  | 'copied'
  | 'downloaded'
  | 'cancelled';

@Injectable({ providedIn: 'root' })
export class ShareCardExportService {
  async download(request: ShareCardExportRequest): Promise<void> {
    const { blob, filename } = await this.render(request);
    downloadBlob(blob, filename);
  }

  async share(request: ShareCardExportRequest): Promise<ShareCardDelivery> {
    const { blob, filename } = await this.render(request);

    return deliverShareCardBlob(blob, filename, request.source.title);
  }

  private async render(
    request: ShareCardExportRequest,
  ): Promise<{ blob: Blob; filename: string }> {
    const [posterDataUrl, backdropDataUrl] = await Promise.all([
      loadImageDataUrl(request.source.posterUrl),
      loadImageDataUrl(request.source.backdropUrl),
    ]);
    const dimensions = shareCardDimensions[request.configuration.format];
    const svg = buildShareCardSvg(request, {
      posterDataUrl,
      backdropDataUrl,
    });
    const svgUrl = URL.createObjectURL(
      new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
    );

    try {
      const image = await loadImage(svgUrl);
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('This browser cannot create the share card.');
      }

      context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
      const png = await canvasToBlob(canvas);

      return {
        blob: png,
        filename: `${createShareCardFilename(request.source.title)}-${request.configuration.format}.png`,
      };
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }
}

export async function deliverShareCardBlob(
  blob: Blob,
  filename: string,
  title: string,
): Promise<ShareCardDelivery> {
  const file = new File([blob], filename, { type: 'image/png' });
  const shareData: ShareData = {
    title: `${title} · Drama Watch`,
    text: `My Drama Watch card for ${title}`,
    files: [file],
  };

  if (
    typeof navigator.share === 'function' &&
    navigator.canShare?.(shareData)
  ) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return 'copied';
    } catch {
      // Fall back to a download when clipboard permission is unavailable.
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

export function buildShareCardSvg(
  request: ShareCardExportRequest,
  assets: ShareCardAssets = {},
): string {
  const { source, configuration } = request;
  const { width, height } = shareCardDimensions[configuration.format];
  const palette = cardPalette(configuration.theme);
  const isStory = configuration.format === 'story';
  const isLandscape = configuration.format === 'landscape';
  const margin = isStory ? 92 : 76;
  const titleFontSize = isStory ? 104 : isLandscape ? 72 : 88;
  const titleLineHeight = Math.round(titleFontSize * 1.02);
  const titleMaxCharacters = isLandscape ? 25 : isStory ? 17 : 19;
  const titleMaxLines = isLandscape ? 3 : 4;
  const titleLines = wrapText(
    source.title,
    titleMaxCharacters,
    titleMaxLines,
  );
  const contentStart = isStory ? 1040 : isLandscape ? 142 : 400;
  const titleStart = contentStart + 84;
  const titleMarkup = svgTextLines(
    titleLines,
    margin,
    titleStart,
    titleLineHeight,
  );
  const titleBottom =
    titleStart + Math.max(0, titleLines.length - 1) * titleLineHeight;
  const statY = titleBottom + (isStory ? 158 : 112);
  const descriptionLines =
    configuration.includeDescription && source.description
      ? wrapText(source.description, isLandscape ? 52 : isStory ? 34 : 39, 3)
      : [];
  const descriptionY = statY + (isStory ? 190 : 126);
  const imageDataUrl =
    configuration.theme === 'poster'
      ? (assets.backdropDataUrl ?? assets.posterDataUrl)
      : (assets.backdropDataUrl ?? assets.posterDataUrl);
  const imageOpacity =
    configuration.theme === 'poster' ? 0.86 : configuration.theme === 'light' ? 0.13 : 0.28;
  const metric = cardMetric(request);
  const supportingLine = cardSupportingLine(request);
  const username =
    configuration.includeUsername && source.username
      ? `@${source.username.replace(/^@/, '')}`
      : '';
  const poster = assets.posterDataUrl
    ? `<image href="${escapeXml(assets.posterDataUrl)}" x="${width - margin - (isStory ? 250 : 180)}" y="${margin}" width="${isStory ? 250 : 180}" height="${isStory ? 375 : 270}" preserveAspectRatio="xMidYMid slice" clip-path="url(#poster-clip)" />`
    : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<defs>',
    `<linearGradient id="card-overlay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.background}" stop-opacity="${configuration.theme === 'poster' ? '0.18' : '0.58'}"/><stop offset="0.48" stop-color="${palette.background}" stop-opacity="0.72"/><stop offset="1" stop-color="${palette.background}" stop-opacity="0.98"/></linearGradient>`,
    `<radialGradient id="accent-glow" cx="0.15" cy="0.08" r="0.9"><stop offset="0" stop-color="${palette.accent}" stop-opacity="0.48"/><stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/></radialGradient>`,
    `<clipPath id="poster-clip"><rect x="${width - margin - (isStory ? 250 : 180)}" y="${margin}" width="${isStory ? 250 : 180}" height="${isStory ? 375 : 270}" rx="28"/></clipPath>`,
    '</defs>',
    `<rect width="${width}" height="${height}" fill="${palette.background}"/>`,
    imageDataUrl
      ? `<image href="${escapeXml(imageDataUrl)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="${imageOpacity}"/>`
      : '',
    `<rect width="${width}" height="${height}" fill="url(#accent-glow)"/>`,
    `<rect width="${width}" height="${height}" fill="url(#card-overlay)"/>`,
    configuration.theme !== 'poster' ? poster : '',
    `<text x="${margin}" y="${margin + 28}" fill="${palette.accent}" font-family="Inter, Arial, sans-serif" font-size="${isStory ? 30 : 24}" font-weight="800" letter-spacing="4">DRAMA WATCH</text>`,
    `<text x="${margin}" y="${contentStart}" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="${isStory ? 34 : 26}" font-weight="800" letter-spacing="3">${escapeXml(cardTemplateLabel(configuration.template).toUpperCase())}</text>`,
    `<text fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="${titleFontSize}" font-weight="850" letter-spacing="-3">${titleMarkup}</text>`,
    metric
      ? `<text x="${margin}" y="${statY}" fill="${palette.accent}" font-family="Inter, Arial, sans-serif" font-size="${isStory ? 96 : isLandscape ? 62 : 78}" font-weight="900">${escapeXml(metric)}</text>`
      : '',
    supportingLine
      ? `<text x="${margin}" y="${statY + (isStory ? 62 : 46)}" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="${isStory ? 30 : 23}" font-weight="650">${escapeXml(supportingLine)}</text>`
      : '',
    descriptionLines.length > 0
      ? `<text fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="${isStory ? 34 : 25}" font-weight="500">${svgTextLines(descriptionLines, margin, descriptionY, isStory ? 48 : 36)}</text>`
      : '',
    `<line x1="${margin}" y1="${height - margin - 42}" x2="${width - margin}" y2="${height - margin - 42}" stroke="${palette.border}" stroke-width="2"/>`,
    username
      ? `<text x="${margin}" y="${height - margin}" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="${isStory ? 32 : 24}" font-weight="750">${escapeXml(username)}</text>`
      : '',
    `<text x="${width - margin}" y="${height - margin}" text-anchor="end" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="${isStory ? 28 : 22}" font-weight="650">dahyun.best</text>`,
    '</svg>',
  ].join('');
}

export function createShareCardFilename(title: string): string {
  const normalized = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  return normalized || 'drama-watch-card';
}

function cardTemplateLabel(
  template: ShareCardExportRequest['configuration']['template'],
): string {
  switch (template) {
    case 'rating':
      return 'My rating';
    case 'progress':
      return 'Currently watching';
    case 'completed':
      return 'Completed';
    case 'wheel_result':
      return 'Wheel winner';
    default:
      return 'Recommendation';
  }
}

function cardMetric(request: ShareCardExportRequest): string {
  const { source, configuration } = request;

  if (configuration.template === 'wheel_result') {
    return source.wheelTitle ?? 'Tonight’s pick';
  }

  if (configuration.template === 'completed') {
    return 'Watched';
  }

  if (configuration.includeRating && source.rating !== undefined) {
    return `${formatRating(source.rating)} / 10`;
  }

  if (configuration.includeProgress && source.progress) {
    return `S${source.progress.currentSeason} · E${source.progress.currentEpisode}`;
  }

  return configuration.template === 'recommendation' ? 'Worth watching' : '';
}

function cardSupportingLine(request: ShareCardExportRequest): string {
  const { source, configuration } = request;

  if (configuration.includeProgress && source.progress) {
    const total = source.progress.totalEpisodes;
    return total
      ? `${source.progress.completedEpisodes} of ${total} episodes`
      : `${source.progress.completedEpisodes} episodes completed`;
  }

  if (
    configuration.includeRating &&
    source.rating !== undefined &&
    configuration.template !== 'rating'
  ) {
    return `Rated ${formatRating(source.rating)} out of 10`;
  }

  return source.originalTitle && source.originalTitle !== source.title
    ? source.originalTitle
    : '';
}

function formatRating(rating: number): string {
  return Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);
}

function cardPalette(theme: ShareCardExportRequest['configuration']['theme']) {
  if (theme === 'light') {
    return {
      background: '#f7f1f5',
      text: '#17101f',
      muted: '#62576b',
      accent: '#b51f58',
      border: '#b9acb8',
    };
  }

  return {
    background: '#100d18',
    text: '#f8f7fb',
    muted: '#c7bdcf',
    accent: '#ff719a',
    border: '#62566f',
  };
}

function wrapText(
  value: string,
  maxCharacters: number,
  maxLines: number,
): string[] {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];

  for (const word of words) {
    const current = lines.at(-1);

    if (!current) {
      lines.push(word);
      continue;
    }

    if (`${current} ${word}`.length <= maxCharacters) {
      lines[lines.length - 1] = `${current} ${word}`;
      continue;
    }

    if (lines.length === maxLines) {
      const roomForEllipsis = Math.max(1, maxCharacters - 1);
      lines[lines.length - 1] = `${current.slice(0, roomForEllipsis).trimEnd()}…`;
      return lines;
    }

    lines.push(word);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  return lines
    .slice(0, maxLines)
    .map((line) => truncateLine(line, maxCharacters));
}

function truncateLine(value: string, maxCharacters: number): string {
  return value.length > maxCharacters
    ? `${value.slice(0, Math.max(1, maxCharacters - 1)).trimEnd()}…`
    : value;
}

function svgTextLines(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
): string {
  return lines
    .map(
      (line, index) =>
        `<tspan x="${x}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function loadImageDataUrl(url: string | undefined): Promise<string | undefined> {
  if (!url) {
    return undefined;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return undefined;
    }

    return await blobToDataUrl(await response.blob());
  } catch {
    return undefined;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () =>
      reject(new Error('The share card image could not be prepared.')),
    );
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('The share card could not be exported.'));
      }
    }, 'image/png');
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
