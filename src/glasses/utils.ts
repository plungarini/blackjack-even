import { TextContainerProperty } from '@evenrealities/even_hub_sdk';
import { getTextWidth } from '@evenrealities/pretext';
import type { HudLayoutDescriptor } from './types';

const CONTAINER_CONTENT_LIMIT_BYTES = 990;
const SPACE_WIDTH = getTextWidth(' ') || 5;

/** Count UTF-8 bytes for a string (BMP only — sufficient for G2 glyphs). */
export function byteLength(str: string): number {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7F) len += 1;
    else if (code <= 0x7FF) len += 2;
    else len += 3;
  }
  return len;
}

/** Truncate a string so its UTF-8 byte length does not exceed maxBytes. */
export function truncateBytes(value: string, maxBytes: number): string {
  if (byteLength(value) <= maxBytes) return value;
  let result = value;
  while (byteLength(result) > maxBytes && result.length > 0) {
    result = result.slice(0, -1);
  }
  return result.trimEnd();
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function instantiateLayout(layout: HudLayoutDescriptor, textContents: Record<string, string>) {
  return {
    containerTotalNum: layout.textDescriptors.length + (layout.imageObject?.length ?? 0),
    textObject: layout.textDescriptors.map(
      (descriptor) =>
        new TextContainerProperty({
          ...descriptor,
          content: truncateBytes(textContents[descriptor.containerName] ?? ' ', CONTAINER_CONTENT_LIMIT_BYTES),
        }),
    ),
    imageObject: layout.imageObject,
  };
}

export function spacesForPx(targetPx: number): string {
  if (targetPx <= 0) return '';
  return ' '.repeat(Math.floor(targetPx / SPACE_WIDTH));
}

export function padToWidth(text: string, widthPx: number): string {
  const gap = widthPx - getTextWidth(text) - 4;
  if (gap <= 0) return text;
  return `${text}${spacesForPx(gap)}`;
}

export function alignRow(left: string, right: string, innerWidthPx: number): string {
  const available = innerWidthPx - getTextWidth(left) - getTextWidth(right) - 4;
  if (available <= 0) return `${left} ${right}`;
  return `${left}${spacesForPx(available)}${right}`;
}

export function alignThree(left: string, center: string, right: string, innerWidthPx: number): string {
  const leftWidth = getTextWidth(left);
  const centerWidth = getTextWidth(center);
  const rightWidth = getTextWidth(right);
  const centerStart = Math.max(0, Math.floor((innerWidthPx - centerWidth) / 2));
  const leftEnd = leftWidth + 4;
  const rightStart = Math.max(centerStart + centerWidth + 4, innerWidthPx - rightWidth);

  if (leftEnd >= centerStart || centerStart + centerWidth >= rightStart) {
    return alignRow(`${left} ${center}`, right, innerWidthPx);
  }

  const gapAfterLeft = centerStart - leftEnd;
  const gapAfterCenter = rightStart - (centerStart + centerWidth);
  return `${left}${spacesForPx(gapAfterLeft)}${center}${spacesForPx(gapAfterCenter)}${right}`;
}

export function centerLine(text: string, innerWidthPx: number): string {
  const leftPx = Math.max(0, (innerWidthPx - getTextWidth(text) - 4) / 2);
  return `${spacesForPx(leftPx)}${text}`;
}

/**
 * Convert ASCII characters to their CJK fullwidth equivalents.
 * The G2 firmware font is proportional, so only fullwidth chars align in grids.
 * Space (U+0020) → ideographic space (U+3000).
 * All other printable ASCII (U+0021–U+007E) → fullwidth forms (U+FF01–U+FF5E).
 */
export function toFullwidth(str: string): string {
  return str.replace(/[\x20-\x7E]/g, (ch) =>
    ch === ' ' ? '\u3000' : String.fromCharCode(ch.charCodeAt(0) + 0xFEE0)
  );
}
