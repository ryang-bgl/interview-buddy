export interface MarkdownChunk {
  id: string;
  content: string;
  title: string;
  level: number; // heading level (1-6)
  startIndex: number;
  endIndex: number;
}

export function chunkMarkdownBySections(markdown: string): MarkdownChunk[] {
  const chunks: MarkdownChunk[] = [];
  const lines = markdown.split('\n');

  let currentChunk: MarkdownChunk | null = null;
  let currentContent: string[] = [];
  let globalIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1; // +1 for newline
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous chunk if exists
      if (currentChunk) {
        currentChunk.content = currentContent.join('\n').trim();
        currentChunk.endIndex = globalIndex;
        chunks.push(currentChunk);
      }

      // Start new chunk
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      currentChunk = {
        id: `section-${chunks.length + 1}`,
        title,
        level,
        content: '',
        startIndex: globalIndex,
        endIndex: 0
      };
      currentContent = [line];
    } else if (currentChunk) {
      // Add line to current chunk
      currentContent.push(line);
    }

    globalIndex += lineLength;
  }

  // Save last chunk
  if (currentChunk) {
    currentChunk.content = currentContent.join('\n').trim();
    currentChunk.endIndex = globalIndex;
    chunks.push(currentChunk);
  }

  // If no headings were found, treat entire content as one chunk
  if (chunks.length === 0) {
    chunks.push({
      id: 'section-1',
      content: markdown.trim(),
      title: 'Content',
      level: 1,
      startIndex: 0,
      endIndex: markdown.length
    });
  }

  return chunks;
}

export function combineChunks(chunks: MarkdownChunk[]): string {
  return chunks.map(chunk => chunk.content).join('\n\n');
}

// Group smaller chunks to optimize API calls
export function groupChunksBySize(
  chunks: MarkdownChunk[],
  maxTokens: number = 3000
): MarkdownChunk[][] {
  const groups: MarkdownChunk[][] = [];
  let currentGroup: MarkdownChunk[] = [];
  let currentSize = 0;

  for (const chunk of chunks) {
    const estimatedTokens = estimateTokens(chunk.content);

    // If adding this chunk would exceed the limit, start a new group
    if (currentSize + estimatedTokens > maxTokens && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [chunk];
      currentSize = estimatedTokens;
    } else {
      currentGroup.push(chunk);
      currentSize += estimatedTokens;
    }
  }

  // Add last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

// Rough estimation: 1 token ≈ 4 characters
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}