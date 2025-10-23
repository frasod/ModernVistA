export interface PatientSummary {
  id: string;
  name: string;
  lastName?: string;
  firstName?: string;
  icn?: string;
  gender?: string;
  dob?: string;
  dobIso?: string;
}

export interface PatientSearchIssue {
  line: string;
  reason: string;
  index: number;
}

export interface PatientSearchResponseV1 {
  schemaVersion: 1;
  ok: boolean;
  term: string;
  patients: PatientSummary[];
  issues: PatientSearchIssue[];
  raw: string[];
  mock: boolean;
}

export type PatientSearchResponse = PatientSearchResponseV1; // future union on version bump
