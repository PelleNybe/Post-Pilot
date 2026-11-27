import { Resend } from 'resend';
import { EmailInterface } from '@postpilot/nestjs-libraries/emails/email.interface';
import { Logger } from '@nestjs/common';

const resend = new Resend(process.env.RESEND_API_KEY || 're_132');

export class ResendProvider implements EmailInterface {
  name = 'resend';
  validateEnvKeys = ['RESEND_API_KEY'];
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    emailFromName: string,
    emailFromAddress: string,
    replyTo?: string
  ) {
    try {
      const sends = await resend.emails.send({
        from: `${emailFromName} <${emailFromAddress}>`,
        to,
        subject,
        html,
        ...(replyTo && { reply_to: replyTo }),
      });

      return sends;
    } catch (err) {
      Logger.log(err);
    }

    return { sent: false };
  }
}
