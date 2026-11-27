import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ResendProvider } from './resend.provider';

const mockSendFn = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: (...args: any[]) => mockSendFn(...args),
        },
      };
    }),
  };
});

describe('ResendProvider', () => {
  let resendProvider: ResendProvider;
  let mockSend: jest.Mock;

  beforeEach(() => {
    resendProvider = new ResendProvider();
    mockSend = mockSendFn;
    mockSend.mockClear();
  });

  it('should send an email successfully', async () => {
    const mockResponse = { id: '123', sent: true };
    mockSend.mockResolvedValue(mockResponse);

    const result = await resendProvider.sendEmail(
      'to@example.com',
      'Subject',
      '<h1>HTML</h1>',
      'From Name',
      'from@example.com'
    );

    expect(mockSend).toHaveBeenCalledWith({
      from: 'From Name <from@example.com>',
      to: 'to@example.com',
      subject: 'Subject',
      html: '<h1>HTML</h1>',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should send an email with replyTo successfully', async () => {
    const mockResponse = { id: '123', sent: true };
    mockSend.mockResolvedValue(mockResponse);

    const result = await resendProvider.sendEmail(
      'to@example.com',
      'Subject',
      '<h1>HTML</h1>',
      'From Name',
      'from@example.com',
      'reply-to@example.com'
    );

    expect(mockSend).toHaveBeenCalledWith({
      from: 'From Name <from@example.com>',
      to: 'to@example.com',
      subject: 'Subject',
      html: '<h1>HTML</h1>',
      reply_to: 'reply-to@example.com',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should return { sent: false } when resend.emails.send throws an error', async () => {
    const loggerSpy = jest.spyOn(Logger, 'log').mockImplementation();
    mockSend.mockRejectedValue(new Error('Resend error'));

    const result = await resendProvider.sendEmail(
      'to@example.com',
      'Subject',
      '<h1>HTML</h1>',
      'From Name',
      'from@example.com'
    );

    expect(result).toEqual({ sent: false });
    expect(loggerSpy).toHaveBeenCalledWith(expect.any(Error));
    loggerSpy.mockRestore();
  });
});
