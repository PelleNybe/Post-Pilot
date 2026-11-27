import { EmailService } from '@postpilot/nestjs-libraries/services/email.service';
import { EmptyProvider } from '@postpilot/nestjs-libraries/emails/empty.provider';
import { ResendProvider } from '@postpilot/nestjs-libraries/emails/resend.provider';
import { NodeMailerProvider } from '@postpilot/nestjs-libraries/emails/node.mailer.provider';

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EMAIL_PROVIDER;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createTemporalMock = () => ({
    client: {
      getRawClient: jest.fn().mockReturnValue({
        workflow: {
          signalWithStart: jest.fn().mockResolvedValue({ workflowId: 'send_email' }),
        },
      }),
    },
  });

  it('falls back to EmptyProvider when EMAIL_PROVIDER is unset', () => {
    const service = new EmailService(createTemporalMock() as any);
    expect(service.hasProvider()).toBe(false);
    expect(service.emailService).toBeInstanceOf(EmptyProvider);
  });

  it('selects ResendProvider or NodeMailerProvider based on provider name', () => {
    const service = new EmailService(createTemporalMock() as any);
    expect(service.selectProvider('resend')).toBeInstanceOf(ResendProvider);
    expect(service.selectProvider('nodemailer')).toBeInstanceOf(NodeMailerProvider);
  });

  it('delegates sendEmail to Temporal signalWithStart', async () => {
    const temporalMock = createTemporalMock();
    const service = new EmailService(temporalMock as any);

    await service.sendEmail('user@example.com', 'Welcome', '<p>Hi</p>', 'top', 'reply@example.com');

    expect(temporalMock.client.getRawClient().workflow.signalWithStart).toHaveBeenCalledWith(
      'sendEmailWorkflow',
      expect.objectContaining({
        taskQueue: 'main',
        workflowId: 'send_email',
        signal: 'sendEmail',
        signalArgs: [
          {
            to: 'user@example.com',
            subject: 'Welcome',
            html: '<p>Hi</p>',
            replyTo: 'reply@example.com',
            addTo: 'top',
          },
        ],
      })
    );
  });

  it('skips sendEmailSync when recipient has no @ or sender env vars are missing', async () => {
    const service = new EmailService(createTemporalMock() as any);
    const spy = jest.spyOn(service.emailService, 'sendEmail');

    await service.sendEmailSync('invalid-email', 'Subj', '<p>Hi</p>');
    await service.sendEmailSync('user@example.com', 'Subj', '<p>Hi</p>');

    expect(spy).not.toHaveBeenCalled();
  });
});
