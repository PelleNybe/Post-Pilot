let externalMessageHandler:
  | ((msg: any, sender: any, sendResponse: (r: any) => void) => any)
  | undefined;
let alarmHandler: ((alarm: { name: string }) => void) | undefined;

const mockCookiesGetAll = jest.fn();
const mockStorageGet = jest.fn().mockResolvedValue({});
const mockStorageSet = jest.fn();
const mockAlarmsGet = jest.fn();
const mockAlarmsCreate = jest.fn();
const mockAlarmsClear = jest.fn();

(globalThis as any).chrome = {
  cookies: { getAll: mockCookiesGetAll },
  storage: { local: { get: mockStorageGet, set: mockStorageSet } },
  alarms: {
    get: mockAlarmsGet,
    create: mockAlarmsCreate,
    clear: mockAlarmsClear,
    onAlarm: {
      addListener: jest.fn((fn) => {
        alarmHandler = fn;
      }),
    },
  },
  runtime: {
    onMessageExternal: {
      addListener: jest.fn((fn) => {
        externalMessageHandler = fn;
      }),
    },
  },
};

// Load after globalThis.chrome is initialized so module top-level listeners attach cleanly
require('./background');

describe('Extension background script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageGet.mockResolvedValue({});
  });

  it('rejects unauthorized origins and accepts localhost/postpilot PING', () => {
    expect(externalMessageHandler).toBeDefined();
    const unauthorizedSend = jest.fn();
    externalMessageHandler!(
      { type: 'PING' },
      { origin: 'https://evil.example.com' },
      unauthorizedSend
    );
    expect(unauthorizedSend).toHaveBeenCalledWith({ error: 'Unauthorized origin' });

    const validSend = jest.fn();
    externalMessageHandler!(
      { type: 'PING' },
      { origin: 'https://app.coraxcolab.com' },
      validSend
    );
    expect(validSend).toHaveBeenCalledWith({ status: 'ok', version: '2.0.0' });
  });

  it('extracts cookies and returns missing required cookie errors', async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: 'auth_token', value: 'tok-åäö-123' },
    ]);

    const sendResp = jest.fn();
    externalMessageHandler!(
      { type: 'GET_COOKIES', provider: 'skool' },
      { origin: 'http://localhost:4200' },
      sendResp
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResp).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        provider: 'skool',
        missingCookies: expect.any(Array),
      })
    );
  });

  it('refreshes stored UTF-8 non-Latin1 cookies without throwing InvalidCharacterError', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true });
    (globalThis as any).fetch = fetchSpy;
    mockStorageGet.mockResolvedValue({
      refreshEntries: {
        int1: {
          jwt: 'jwt-1',
          backendUrl: 'https://api.coraxcolab.com',
          provider: 'skool',
        },
      },
    });
    mockCookiesGetAll.mockResolvedValue([
      { name: 'client_id', value: 'värde-🚀' },
      { name: 'auth_token', value: 'token' },
    ]);

    const provSend = jest.fn();
    externalMessageHandler!(
      { type: 'GET_PROVIDERS' },
      { origin: 'http://localhost:4200' },
      provSend
    );
    expect(provSend).toHaveBeenCalledWith({
      providers: expect.arrayContaining([
        expect.objectContaining({ identifier: 'skool' }),
      ]),
    });

    expect(alarmHandler).toBeDefined();
    alarmHandler!({ name: 'cookie-refresh' });
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.coraxcolab.com/integrations/extension-refresh',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
