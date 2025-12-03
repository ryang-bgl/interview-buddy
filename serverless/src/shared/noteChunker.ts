export interface ChunkAnchor {
  front?: string | null;
  back?: string | null;
  extra?: string | null;
}

interface ChunkOptions {
  anchor?: ChunkAnchor | null;
  targetSize?: number;
  overlapBlocks?: number;
}

const DEFAULT_TARGET_SIZE = 500;

export function chunkArticleContent(
  rawContent: string,
  options: ChunkOptions = {}
): string[] {
  const { anchor = null, targetSize = DEFAULT_TARGET_SIZE, overlapBlocks = 2 } =
    options;
  let working = (rawContent ?? "").trim();
  if (!working) {
    return [];
  }

  working = trimContentAfterAnchor(working, anchor);

  const blocks = working
    .split(/\r?\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  if (!blocks.length) {
    return working ? [working] : [];
  }

  const chunks: string[] = [];
  const maxSize = Math.max(targetSize + 200, targetSize);
  let start = 0;

  while (start < blocks.length) {
    let end = start;
    let size = 0;
    while (end < blocks.length) {
      const block = blocks[end];
      const blockSize = block.length + 1;
      if (end > start && size + blockSize > maxSize) {
        break;
      }
      size += blockSize;
      end += 1;
      if (size >= targetSize) {
        break;
      }
    }

    if (end === start) {
      end += 1;
    }

    const adjustedEnd = adjustChunkBoundary(blocks, start, end);
    const safeEnd = Math.max(adjustedEnd, start + 1);
    const text = blocks.slice(start, safeEnd).join("\n").trim();
    if (text) {
      chunks.push(text);
    }

    const overlappedStart = Math.max(safeEnd - overlapBlocks, start + 1);
    start = Math.max(overlappedStart, 0);
  }

  return chunks;
}

function adjustChunkBoundary(blocks: string[], start: number, end: number) {
  const cappedEnd = Math.min(end, blocks.length);
  for (let index = Math.min(cappedEnd - 2, blocks.length - 2); index >= start; index -= 1) {
    const nextBlock = blocks[index + 1];
    if (isLikelyHeading(nextBlock)) {
      return index + 1;
    }
  }
  return cappedEnd;
}

function isLikelyHeading(block?: string) {
  if (!block) {
    return false;
  }
  const trimmed = block.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith("#")) {
    return true;
  }
  if (/^[-*]\s/.test(trimmed)) {
    return false;
  }
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount > 12) {
    return false;
  }
  if (/[.!?]$/.test(trimmed)) {
    return false;
  }
  return true;
}

function trimContentAfterAnchor(content: string, anchor?: ChunkAnchor | null) {
  if (!anchor) {
    return content;
  }
  const searchTargets = [anchor.front, anchor.back, anchor.extra]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  if (!searchTargets.length) {
    return content;
  }

  const haystack = content.toLowerCase();
  for (const target of searchTargets) {
    const needle = target.toLowerCase();
    const matchIndex = haystack.indexOf(needle);
    if (matchIndex >= 0) {
      const sliceIndex = matchIndex + needle.length;
      const nextNewlineIndex = content.indexOf("\n", sliceIndex);
      const finalIndex = nextNewlineIndex >= 0 ? nextNewlineIndex + 1 : sliceIndex;
      return content.slice(finalIndex).trimStart();
    }
  }
  return content;
}
