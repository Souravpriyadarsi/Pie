export interface PiMatch {
  position: number;
  before: string;
  match: string;
  after: string;
  atStart: boolean;
}

export interface SearchResult {
  query: string;
  count: number;
  matches: PiMatch[];
  digitsSearched: number;
  elapsedMs: number;
  truncated: boolean;
}

export interface DatasetStatus {
  digits: number;
  positionConvention: string;
}
