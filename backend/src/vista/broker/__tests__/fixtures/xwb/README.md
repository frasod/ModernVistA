# XWB Fixture Directory

Sanitized fixtures for authentic XWB header / frame parsing tests.

Do NOT place raw PHI or live capture data here.

Expected fixture format (example placeholder):
```jsonc
{
  "description": "Sign-on response minimal example (sanitized)",
  "hex": "01 00 0A 58 57 42 2D 52 45 53 50", // start + length + ASCII payload (placeholder)
  "payloadText": "XWB-RESP" // already sanitized
}
```

Guidelines:
- Replace names, IDs, SSNs with synthetic tokens (e.g., PATIENT_001).
- Keep length field consistent with payload bytes.
- If multi-part frames exist, represent as array of frame objects.
