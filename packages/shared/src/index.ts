export const VERDICTS = ['satisfied', 'partial', 'not_demonstrated', 'needs_info'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABEL: Record<Verdict, string> = {
  satisfied: 'Satisfied',
  partial: 'Partially',
  not_demonstrated: 'Not demonstrated',
  needs_info: 'Needs info',
};

export type ReviewState = 'pending' | 'accepted' | 'rejected' | 'corrected';
export type Risk = 'low' | 'medium' | 'high';
export type FileStatus = 'New' | 'In review' | 'Awaiting info' | 'Decision pending' | 'Closed';
export type DecisionValue = 'conforms' | 'conforms_with_conditions' | 'does_not_conform';

export const DECISION_LABEL: Record<DecisionValue, string> = {
  conforms: 'Conforms',
  conforms_with_conditions: 'Conforms with conditions',
  does_not_conform: 'Does not conform',
};

export interface Clause {
  id: string;
  section: string;
  sectionTitle: string;
  group: string;
  title: string;
  text: string;
  keywords: string[];
}

export interface Standard {
  id: string;
  title: string;
  clauses: Clause[];
}

export interface FileMeta {
  id: string;
  title: string;
  deviceClass: 'I' | 'IIa' | 'IIb' | 'III';
  manufacturer: string;
  pages: number;
  due: string; // ISO date
  status: FileStatus;
  risk: Risk;
  assignee: string;
  aiCoverage: number; // 0-100
  hasDocument: boolean;
}

export interface Evidence {
  page: number;
  quote: string;
}

export interface Correction {
  ts: string;
  by: string;
  action: 'accept' | 'reject' | 'edit';
  verdict: Verdict;
  reason: string;
  evidence: Evidence;
}

export interface Finding {
  id: string;
  fileId: string;
  clauseId: string;
  confidence: number; // 0-1
  source: { kind: 'rules' | 'bedrock'; name: string };
  rationale: string;
  original: { verdict: Verdict; evidence: Evidence };
  current: { verdict: Verdict; evidence: Evidence; reason: string };
  state: ReviewState;
  updatedAt: string;
  history?: Correction[];
}

export interface ClauseStatus {
  verdict?: Verdict;
  reviewer?: string;
  comment?: string;
  updatedAt?: string;
}

/** A clause row as shown in the checklist and the matrix. */
export interface ClauseRow extends Clause {
  status: ClauseStatus;
  finding?: Omit<Finding, 'history'>;
}

export interface Decision {
  decision: DecisionValue;
  rationale: string;
  signedBy: string;
  signedAt: string;
}

export const effectiveVerdict = (row: Pick<ClauseRow, 'status' | 'finding'>): Verdict | undefined =>
  row.status.verdict ?? row.finding?.current.verdict;

export const REVIEWER = 'Demo Reviewer';
