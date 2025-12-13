// Import the JSON data directly
import dsaQuestionsJson from './dsaQuestionsData.json';

export interface DsaQuestion {
  index: number;
  title: string;
  slug: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  relatedQuestions: number[];
}

// The JSON data is already parsed
const dsaQuestionsCache: DsaQuestion[] = dsaQuestionsJson;

export function getAllDsaQuestions(): DsaQuestion[] {
  // Return cached data - no async needed since it's imported
  return dsaQuestionsCache;
}

export function getDsaQuestionByIndex(index: number): DsaQuestion | null {
  return dsaQuestionsCache.find(q => q.index === index) || null;
}