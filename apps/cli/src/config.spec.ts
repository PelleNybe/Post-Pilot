import { getConfig } from './config';

describe('getConfig (CLI)', () => {
  const originalKey = process.env.POSTPILOT_API_KEY;
  const originalUrl = process.env.POSTPILOT_API_URL;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalKey !== undefined) process.env.POSTPILOT_API_KEY = originalKey;
    else delete process.env.POSTPILOT_API_KEY;
    if (originalUrl !== undefined) process.env.POSTPILOT_API_URL = originalUrl;
    else delete process.env.POSTPILOT_API_URL;
  });

  it('returns apiKey and optional apiUrl when POSTPILOT_API_KEY is present', () => {
    process.env.POSTPILOT_API_KEY = 'abc-123';
    process.env.POSTPILOT_API_URL = 'https://api.example.com';

    expect(getConfig()).toEqual({
      apiKey: 'abc-123',
      apiUrl: 'https://api.example.com',
    });
  });

  it('exits with code 1 when POSTPILOT_API_KEY is missing', () => {
    delete process.env.POSTPILOT_API_KEY;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as any);

    expect(() => getConfig()).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});
