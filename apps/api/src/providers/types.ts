import type { Clause, Evidence, Finding, Verdict } from '@crs/shared';

export interface Passage {
  page: number;
  lines: string[];
  /** true when the page carries an explicit "Clause x.y.z" heading */
  explicit: boolean;
}

export interface Proposal {
  verdict: Verdict;
  confidence: number;
  evidence: Evidence;
  rationale: string;
  source: Finding['source'];
}

export interface FindingProvider {
  readonly name: 'rules' | 'bedrock';
  propose(clause: Clause, passages: Passage[]): Promise<Proposal | null>;
}
