import { parseOrwptList } from '../orwpt';

describe('parseOrwptList enhancements', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { process.env = { ...OLD_ENV }; });
  afterAll(() => { process.env = OLD_ENV; });

  it('counts nameSplitFailed when no comma', () => {
    const r = parseOrwptList(['1^JOHNDOE']);
    expect(r.stats?.nameSplitFailed).toBe(1);
  });

  it('drops invalid DOB when strict flag enabled', () => {
    process.env.VISTA_PARSE_STRICT_DOB = 'true';
    const r = parseOrwptList(['2^DOE,JOHN^^M^13/40/2020']);
    expect(r.patients.length).toBe(0);
    expect(r.stats?.droppedForStrictDob).toBe(1);
  });
});
