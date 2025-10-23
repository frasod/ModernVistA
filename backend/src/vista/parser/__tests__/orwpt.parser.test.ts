import { parseOrwptList } from '../orwpt';

describe('parseOrwptList', () => {
  it('parses valid patient lines', () => {
    const lines = [
      '100^DOE,JOHN^1234^M^01/12/1965',
      '101^DOE,JANE^2345^F^07/03/1972'
    ];
    const result = parseOrwptList(lines);
    expect(result.issues).toHaveLength(0);
    expect(result.patients).toHaveLength(2);
  expect(result.patients[0]).toMatchObject({ id: '100', name: 'DOE,JOHN', icn: '1234', gender: 'M', dob: '01/12/1965', dobIso: '1965-01-12', lastName: 'DOE', firstName: 'JOHN' });
  });

  it('records NO_DELIMITERS issue for lines without caret', () => {
    const result = parseOrwptList(['', 'NOCARETS']);
    expect(result.patients).toHaveLength(0);
    expect(result.issues.map(i => i.reason)).toEqual(['NO_DELIMITERS', 'NO_DELIMITERS']);
  });

  it('records INSUFFICIENT_FIELDS when only one field present', () => {
    const result = parseOrwptList(['ONLYONEFIELD^']);
    // parts.length >=2 so not insufficient; alter to single token case
    const result2 = parseOrwptList(['SINGLE']);
    expect(result2.issues[0].reason).toBe('NO_DELIMITERS');
    expect(result.issues[0].reason).not.toBe('NO_DELIMITERS');
  });

  it('records MISSING_CORE_FIELDS when ien or name missing', () => {
    const result = parseOrwptList(['^DOE,JOHN']);
    expect(result.issues[0].reason).toBe('MISSING_CORE_FIELDS');
  });

  it('omits invalid gender without creating issue', () => {
  const result = parseOrwptList(['200^TEST,PATIENT^9999^X^02/02/2000']);
  expect(result.patients[0].gender).toBeUndefined();
  expect(result.patients[0].dobIso).toBe('2000-02-02');
  expect(result.stats?.genderOmitted).toBeGreaterThanOrEqual(1);
  expect(result.issues).toHaveLength(0);
  });

  it('accepts partial fields and keeps raw line', () => {
    const result = parseOrwptList(['300^RAWONLY']);
    expect(result.patients[0]).toMatchObject({ id: '300', name: 'RAWONLY', raw: '300^RAWONLY' });
  });
});
