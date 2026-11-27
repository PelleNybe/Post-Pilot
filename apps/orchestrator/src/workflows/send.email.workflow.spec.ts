jest.mock('@temporalio/workflow', () => {
  const sendEmail = jest.fn();
  const condition = jest.fn();
  const sleep = jest.fn();
  const continueAsNew = jest.fn();
  const setHandler = jest.fn();
  const logError = jest.fn();

  return {
    __mocks: { sendEmail, condition, sleep, continueAsNew, setHandler, logError },
    proxyActivities: () => ({ sendEmail }),
    setHandler: (signal: unknown, handler: (item: any) => void) =>
      setHandler(signal, handler),
    condition: (...args: any[]) => condition(...args),
    sleep: (...args: any[]) => sleep(...args),
    continueAsNew: (...args: any[]) => continueAsNew(...args),
    defineSignal: (name: string) => ({ name }),
    log: { error: (...args: any[]) => logError(...args) },
  };
});

import * as workflow from '@temporalio/workflow';
import { sendEmailWorkflow } from './send.email.workflow';

const {
  sendEmail: mockSendEmail,
  condition: mockCondition,
  sleep: mockSleep,
  continueAsNew: mockContinueAsNew,
  logError: mockLogError,
} = (workflow as any).__mocks;

describe('sendEmailWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSleep.mockResolvedValue(undefined);
    mockSendEmail.mockResolvedValue(undefined);
    mockContinueAsNew.mockResolvedValue('continued');
  });

  it('exits cleanly when inactivity timeout expires (condition returns false)', async () => {
    mockCondition.mockResolvedValue(false);

    await sendEmailWorkflow({ queue: [] });

    expect(mockCondition).toHaveBeenCalledWith(expect.any(Function), '1 hour');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('processes queued emails and logs activity failures without crashing', async () => {
    mockCondition
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockSendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('SMTP down'));

    await sendEmailWorkflow({
      queue: [
        { to: 'a@example.com', subject: 'Hi', html: '<p>One</p>' },
        { to: 'b@example.com', subject: 'Fail', html: '<p>Two</p>' },
      ] as any,
    });

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenCalledWith(
      'Failed to send queued email',
      expect.objectContaining({ err: expect.any(Error) })
    );
  });

  it('calls continueAsNew after processing 30 emails in one run', async () => {
    mockCondition.mockResolvedValue(true);
    const queue = Array.from({ length: 32 }, (_, i) => ({
      to: `user${i}@example.com`,
      subject: `Sub ${i}`,
      html: '<p>body</p>',
    }));

    const result = await sendEmailWorkflow({ queue: queue as any });

    expect(mockSendEmail).toHaveBeenCalledTimes(30);
    expect(mockContinueAsNew).toHaveBeenCalledWith({
      queue: expect.arrayContaining([
        expect.objectContaining({ to: 'user30@example.com' }),
        expect.objectContaining({ to: 'user31@example.com' }),
      ]),
    });
    expect(result).toBe('continued');
  });
});
