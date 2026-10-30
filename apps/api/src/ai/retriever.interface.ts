export interface RetrieveParams {
  question: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  lessonId?: string;
  gradeId?: string;
  maxDisplayOrder?: number;
  maxGradeRank?: number;
  isFeatured?: boolean;
}

export interface RetrievedSegment {
  lessonId: string;
  slug: string;
  title: string;
  heading?: string;
  content: string;
  score: number;
}

export interface RetrieverResult {
  accepted: boolean;
  effectiveQuery: string;
  segments: RetrievedSegment[];
  sources: Array<{ lessonId: string; title: string; slug: string }>;
}

export interface Retriever {
  retrieve(params: RetrieveParams): Promise<RetrieverResult>;
}

export const RETRIEVER = Symbol('RETRIEVER');
