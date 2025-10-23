/**
 * Patient Service for ModernVista Frontend
 * 
 * Handles all patient-related API calls with timeout handling,
 * error recovery, and graceful degradation.
 */

const API_BASE_URL = '/api/v1';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 second

export interface Patient {
  id: string;
  name: string;
  dob: string;
  ssn?: string;
  lastName?: string;
  firstName?: string;
  dobIso?: string;
  gender?: string;
  icn?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  timeout?: boolean;
  offline?: boolean;
}

export interface LabResult {
  id: string;
  test: string;
  value: string;
  collected: string;
  unit?: string;
  flag?: string;
}

export interface Medication {
  id: string;
  name: string;
  status?: string;
  start?: string;
  stop?: string;
  dose?: string;
  route?: string;
}

export interface VitalSign {
  id: string;
  type: string;
  value: string;
  unit?: string;
  observed: string; // ISO timestamp
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: string;
  onset: string; // ISO timestamp
  status: string;
  type: string;
}

/**
 * Create fetch with timeout and retry logic
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT,
    onResult?: (info: { status: number; durationMs: number; rpcName?: string; error?: string; }) => void
): Promise<Response> {
  const controller = new AbortController();
  
  // Set timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    try {
      const durationMs = Date.now() - start;
      // Attempt to peek rpcName header if backend later exposes it (placeholder) else parse JSON clone
      if (onResult) {
        let rpcName: string | undefined;
        try {
          // Cloning response is expensive; skip unless small and JSON
          if (response.headers.get('content-type')?.includes('application/json')) {
            const clone = response.clone();
            const data = await clone.json().catch(() => null);
            rpcName = data?.rpcName;
          }
        } catch { /* ignore */ }
        onResult({ status: response.status, durationMs, rpcName });
      }
    } catch { /* ignore */ }
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - start;
    if (onResult) onResult({ status: 0, durationMs, error: error?.message });
    if (error.name === 'AbortError') {
      throw new Error('REQUEST_TIMEOUT');
    }
    throw error;
  }
}

/**
 * Retry wrapper for API calls
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = RETRY_ATTEMPTS
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxAttempts) throw error;
      
      // Wait before retry (exponential backoff)
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`API call failed, retrying (${attempt}/${maxAttempts})...`);
    }
  }
  throw new Error('All retry attempts failed');
}

/**
 * Mock patient data for offline/fallback mode
 */
const MOCK_PATIENTS: Patient[] = [
  { id: '100', name: 'John Smith', dob: '1965-01-12' },
  { id: '101', name: 'Jane Doe', dob: '1972-07-03' },
  { id: '102', name: 'Carlos Alvarez', dob: '1959-11-22' },
  { id: '103', name: 'Mary Johnson', dob: '1980-05-09' },
];

/**
 * Test backend connectivity
 */
export async function pingBackend(): Promise<ApiResponse<boolean>> {
  try {
    const response = await withRetry(() =>
      fetchWithTimeout(`${API_BASE_URL}/patients/ping`, {}, 5000)
    );
    
    if (response.ok) {
      const data = await response.json();
      return { data: data.ok === true };
    } else {
      return { error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error: any) {
    if (error.message === 'REQUEST_TIMEOUT') {
      return { timeout: true, error: 'Backend connection timeout' };
    }
    if (error.message.includes('fetch')) {
      return { offline: true, error: 'Backend appears to be offline' };
    }
    return { error: error.message || 'Unknown error connecting to backend' };
  }
}

/**
 * Search for patients with fallback to mock data
 * Allows optional logging callback to capture timing & rpcName.
 */
export async function searchPatients(query: string, onLog?: (info: { status: number; durationMs: number; rpcName?: string; error?: string; }) => void): Promise<ApiResponse<Patient[]>> {
  if (!query || query.length < 2) {
    return { data: [] };
  }

  try {
    const response = await withRetry(() =>
      fetchWithTimeout(`${API_BASE_URL}/patients-search?q=${encodeURIComponent(query)}`, {}, DEFAULT_TIMEOUT, onLog)
    );
    
    if (response.ok) {
      const data = await response.json();
      // Expect schemaVersion 1
      if (data.schemaVersion !== 1) {
        console.warn('Unexpected schemaVersion for patients-search', data.schemaVersion);
      }
      const patients: Patient[] = (data.patients || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        dob: p.dobIso || p.dob || '',
        dobIso: p.dobIso,
        lastName: p.lastName,
        firstName: p.firstName,
        gender: p.gender,
        icn: p.icn
      }));
      return { data: patients };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    console.warn('Backend search failed, falling back to mock data:', error.message);
    
    // Fallback to mock data
    const mockResults = MOCK_PATIENTS.filter(patient =>
      patient.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (error.message === 'REQUEST_TIMEOUT') {
      return { data: mockResults, timeout: true, error: 'Search timeout - showing cached results' };
    }
    if (error.message.includes('fetch')) {
      return { data: mockResults, offline: true, error: 'Offline mode - showing cached results' };
    }
    
    return { data: mockResults, error: `Backend error: ${error.message}` };
  }
}

/**
 * Get patient details by ID
 */
export async function getPatientDetails(patientId: string): Promise<ApiResponse<Patient>> {
  try {
    const response = await withRetry(() =>
      fetchWithTimeout(`${API_BASE_URL}/patients/${patientId}`)
    );
    
    if (response.ok) {
      const data = await response.json();
      return { data: data.patient };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    // Fallback to mock data
    const mockPatient = MOCK_PATIENTS.find(p => p.id === patientId);
    if (mockPatient) {
      return { 
        data: mockPatient, 
        error: error.message === 'REQUEST_TIMEOUT' ? 'Timeout - showing cached data' : 'Offline mode'
      };
    }
    
    return { error: `Patient not found: ${error.message}` };
  }
}

/**
 * Fetch labs for a patient (mock backend currently).
 */
export async function getLabs(patientId: string, onLog?: (info: { status: number; durationMs: number; rpcName?: string; error?: string; }) => void): Promise<ApiResponse<LabResult[]>> {
  try {
    const response = await withRetry(() => fetchWithTimeout(`${API_BASE_URL}/labs/${encodeURIComponent(patientId)}`, {}, DEFAULT_TIMEOUT, onLog));
    if (response.ok) {
      const data = await response.json();
      return { data: (data.labs || []) as LabResult[] };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error: any) {
    return { error: error.message || 'Labs fetch failed' };
  }
}

/**
 * Fetch medications for a patient (mock backend currently).
 */
export async function getMedications(patientId: string, onLog?: (info: { status: number; durationMs: number; rpcName?: string; error?: string; }) => void): Promise<ApiResponse<Medication[]>> {
  try {
    const response = await withRetry(() => fetchWithTimeout(`${API_BASE_URL}/meds/${encodeURIComponent(patientId)}`, {}, DEFAULT_TIMEOUT, onLog));
    if (response.ok) {
      const data = await response.json();
      return { data: (data.meds || []) as Medication[] };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error: any) {
    return { error: error.message || 'Medications fetch failed' };
  }
}

/**
 * Fetch vitals for a patient (mock backend currently).
 */
export async function getVitals(patientId: string, onLog?: (info: { status: number; durationMs: number; rpcName?: string; error?: string; }) => void): Promise<ApiResponse<VitalSign[]>> {
  try {
    const response = await withRetry(() => fetchWithTimeout(`${API_BASE_URL}/vitals/${encodeURIComponent(patientId)}`, {}, DEFAULT_TIMEOUT, onLog));
    if (response.ok) {
      const data = await response.json();
      return { data: (data.vitals || []) as VitalSign[] };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error: any) {
    return { error: error.message || 'Vitals fetch failed' };
  }
}

/**
 * Fetch allergies for a patient (mock backend currently).
 */
export async function getAllergies(patientId: string, onLog?: (info: { status: number; durationMs: number; rpcName?: string; error?: string; }) => void): Promise<ApiResponse<Allergy[]>> {
  try {
    const response = await withRetry(() => fetchWithTimeout(`${API_BASE_URL}/allergies/${encodeURIComponent(patientId)}`, {}, DEFAULT_TIMEOUT, onLog));
    if (response.ok) {
      const data = await response.json();
      return { data: (data.allergies || []) as Allergy[] };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error: any) {
    return { error: error.message || 'Allergies fetch failed' };
  }
}

/**
 * Check if we're in offline mode
 */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const result = await pingBackend();
    return !!result.data && !result.error && !result.timeout;
  } catch {
    return false;
  }
}