
export enum AppView {
  LITERATURE_REVIEW = 'LITERATURE_REVIEW',
  COMPOSITION = 'COMPOSITION',
  DATA_ANALYSIS = 'DATA_ANALYSIS'
}

export enum ReviewType {
  SLR = 'Systematic Literature Review',
  SCOPING = 'Scoping Review',
  NARRATIVE = 'Narrative Review'
}

export type ScopusQuartile = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type SectionType = 'intro' | 'lr' | 'method' | 'analysis' | 'disc' | 'conc' | 'refs';

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  scopusLevel: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Unranked';
  url: string;
  capturedData?: CapturedDetails;
}

export interface CapturedDetails {
  methodology: string;
  findings: string[];
  limitations: string;
  citation: string;
  relevanceScore: number;
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  chartData: any[];
  chartType: 'bar' | 'line' | 'scatter' | 'area';
  recommendations: string[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ResearchContext {
  topic: string;
  reviewType: string;
  synthesis: string;
  draft: string;
  references: string;
  analysisResult?: AnalysisResult;
  sections?: Record<SectionType, string>;
}
