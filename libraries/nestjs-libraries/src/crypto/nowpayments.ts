import { Injectable } from '@nestjs/common';
import { makeId } from '@postpilot/nestjs-libraries/services/make.is';
import { AuthService } from '@postpilot/helpers/auth/auth.service';
import { SubscriptionService } from '@postpilot/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import crypto from 'crypto';

export interface ProcessPayment {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount: number;
  outcome_currency: string;
}

@Injectable()
export class Nowpayments {
  constructor(private _subscriptionService: SubscriptionService) {}

  async processPayment(
    path: string,
    body: ProcessPayment,
    signature?: string
  ) {
    if (process.env.NOWPAYMENTS_IPN_SECRET && signature) {
      const hmac = crypto.createHmac(
        'sha512',
        process.env.NOWPAYMENTS_IPN_SECRET
      );
      const sortedBody = JSON.stringify(
        body,
        Object.keys(body).sort()
      );
      hmac.update(sortedBody);
      const expectedSignature = hmac.digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const signatureBuf = Buffer.from(signature, 'utf8');
      if (
        expectedBuf.length !== signatureBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, signatureBuf)
      ) {
        return;
      }
    } else if (process.env.NOWPAYMENTS_IPN_SECRET && !signature) {
      return;
    }

    const decrypt = AuthService.verifyJWT(path) as any;
    if (!decrypt || !decrypt.order_id) {
      return;
    }

    if (decrypt.order_id !== body.order_id) {
      return;
    }

    if (
      body.payment_status !== 'confirmed' &&
      body.payment_status !== 'finished'
    ) {
      return;
    }

    const [org, make] = body.order_id.split('_');
    await this._subscriptionService.lifeTime(org, make, 'PRO');
    return body;
  }

  async createPaymentPage(orgId: string) {
    const onlyId = makeId(5);
    const make = orgId + '_' + onlyId;
    const signRequest = AuthService.signJWT({ order_id: make });

    const { id, invoice_url } = await (
      await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        },
        body: JSON.stringify({
          price_amount: process.env.NOWPAYMENTS_AMOUNT,
          price_currency: 'USD',
          order_id: make,
          pay_currency: 'SOL',
          order_description: 'Lifetime deal account for PostPilot',
          ipn_callback_url:
            process.env.NEXT_PUBLIC_BACKEND_URL +
            `/public/crypto/${signRequest}`,
          success_url: process.env.FRONTEND_URL + `/launches?check=${onlyId}`,
          cancel_url: process.env.FRONTEND_URL,
        }),
      })
    ).json();

    return {
      id,
      invoice_url,
    };
  }
}
