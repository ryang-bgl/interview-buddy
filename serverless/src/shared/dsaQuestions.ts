import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export interface DsaQuestion {
  index: number;
  title: string;
  slug: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  relatedQuestions: number[];
}

let dsaQuestionsCache: DsaQuestion[] | null = null;

export async function getAllDsaQuestions(): Promise<DsaQuestion[]> {
  if (dsaQuestionsCache) {
    return dsaQuestionsCache;
  }

  try {
    const csvPath = path.join(__dirname, 'dsa_questions_summary.csv');
    const csvContent = await readFile(csvPath, 'utf-8');

    const lines = csvContent.split('\n');
    const questions: DsaQuestion[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line handling quoted fields
      const fields = parseCSVLine(line);
      if (fields.length < 6) continue;

      const index = parseInt(fields[0], 10);
      const title = fields[1] || '';
      const slug = fields[2] || '';
      const tagsString = fields[3] || '';
      const difficulty = fields[4] as 'Easy' | 'Medium' | 'Hard' || 'Medium';
      const relatedQuestionsString = fields[5] || '';

      // Parse tags from comma-separated string
      const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];

      // Parse related questions from comma-separated string
      const relatedQuestions = relatedQuestionsString
        ? relatedQuestionsString.split(',').map(q => parseInt(q.trim(), 10)).filter(q => !isNaN(q))
        : [];

      questions.push({
        index,
        title,
        slug,
        tags,
        difficulty,
        relatedQuestions
      });
    }

    dsaQuestionsCache = questions;
    return questions;
  } catch (error) {
    console.error('Error reading DSA questions CSV:', error);
    throw new Error('Failed to load DSA questions');
  }
}

export function getDsaQuestionByIndex(index: number): DsaQuestion | null {
  if (!dsaQuestionsCache) {
    throw new Error('DSA questions not loaded. Call getAllDsaQuestions() first.');
  }

  return dsaQuestionsCache.find(q => q.index === index) || null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}