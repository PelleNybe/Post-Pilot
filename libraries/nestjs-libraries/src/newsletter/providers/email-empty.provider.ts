import { NewsletterInterface } from '@postpilot/nestjs-libraries/newsletter/newsletter.interface';
import { Logger } from '@nestjs/common';

export class EmailEmptyProvider implements NewsletterInterface {
  name = 'empty';
  async register(email: string) {
    Logger.log('Could have registered to newsletter:', email);
  }
}
