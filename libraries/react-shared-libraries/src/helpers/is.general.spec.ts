import { isGeneral } from './is.general';

jest.mock('./variable.context', () => ({
  loadVars: jest.fn(() => ({ isGeneral: true })),
}));

describe('isGeneral', () => {
  const origEnv = process.env.IS_GENERAL;

  afterEach(() => {
    if (origEnv !== undefined) process.env.IS_GENERAL = origEnv;
    else delete process.env.IS_GENERAL;
  });

  it('returns false when IS_GENERAL env var is undefined', () => {
    delete process.env.IS_GENERAL;
    expect(isGeneral()).toBe(false);
  });

  it('returns loadVars().isGeneral when IS_GENERAL is defined', () => {
    process.env.IS_GENERAL = 'true';
    expect(isGeneral()).toBe(true);
  });
});
