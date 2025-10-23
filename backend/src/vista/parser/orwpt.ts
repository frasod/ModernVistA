export interface OrwptPatient {
  id: string;         // internal entry number
  name: string;       // LAST,FIRST
  lastName?: string;  // extracted last name
  firstName?: string; // extracted first name
  icn?: string;       // optional future field
  gender?: string;    // M/F if available
  dob?: string;       // MM/DD/YYYY (original) normalized to ISO later
  dobIso?: string;    // ISO normalized date (YYYY-MM-DD) if valid
  raw?: string;       // original raw line (for traceability)
}

export interface OrwptParseIssue {
  line: string;
  reason: string;
  index: number;
}

export interface OrwptParseResult {
  patients: OrwptPatient[];
  issues: OrwptParseIssue[];
  stats?: {
    dobNormalized: number;
    dobInvalid: number;
    genderOmitted: number;
    nameSplitFailed: number;
    droppedForStrictDob: number;
  };
}

// Basic line pattern: IEN ^ NAME ^ ICN? ^ GENDER? ^ DOB?
// Current mock lines: 100^DOE,JOHN^1234^M^01/12/1965

export function parseOrwptList(lines: string[]): OrwptParseResult {
  const patients: OrwptPatient[] = [];
  const issues: OrwptParseIssue[] = [];
  let dobNormalized = 0;
  let dobInvalid = 0;
  let genderOmitted = 0;
  let nameSplitFailed = 0;
  let droppedForStrictDob = 0;
  const strictDob = process.env.VISTA_PARSE_STRICT_DOB === 'true';
  lines.forEach((line, idx) => {
    if (!line || !line.includes('^')) {
      issues.push({ line, reason: 'NO_DELIMITERS', index: idx });
      return;
    }
    const parts = line.split('^');
    if (parts.length < 2) {
      issues.push({ line, reason: 'INSUFFICIENT_FIELDS', index: idx });
      return;
    }
    const [ien, name, icn, gender, dob] = parts;
    if (!ien || !name) {
      issues.push({ line, reason: 'MISSING_CORE_FIELDS', index: idx });
      return;
    }
    const patient: OrwptPatient = { id: ien, name, raw: line };
    if (name.includes(',')) {
      const [last, first] = name.split(',');
      if (last) patient.lastName = last.trim();
      if (first) patient.firstName = first.trim();
    } else {
      nameSplitFailed += 1;
    }
    if (icn) patient.icn = icn;
    if (gender && /^[MF]$/i.test(gender)) {
      patient.gender = gender.toUpperCase();
    } else {
      genderOmitted += 1;
    }
    let dobValid = true;
    if (dob) {
      if (/\d{2}\/\d{2}\/\d{4}/.test(dob)) {
        patient.dob = dob;
        // Normalize to ISO
        const [mm, dd, yyyy] = dob.split('/');
        const iso = `${yyyy}-${mm}-${dd}`;
        if (!isNaN(Date.parse(iso))) {
          patient.dobIso = iso;
          dobNormalized += 1;
        } else {
          dobInvalid += 1;
          dobValid = false;
        }
      } else {
        dobInvalid += 1;
        dobValid = false;
      }
    }
    if (strictDob && !dobValid) {
      droppedForStrictDob += 1;
      return; // drop patient from list
    }
    patients.push(patient);
  });
  return { patients, issues, stats: { dobNormalized, dobInvalid, genderOmitted, nameSplitFailed, droppedForStrictDob } };
}
