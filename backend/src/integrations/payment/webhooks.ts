import ApiError from '../../utils/ApiError.ts';
import { getInstance } from './main.ts';
import type Stripe from 'stripe';

export function verifyWebhook(params: { payload: string | Buffer; signature: string; secret: string }): Stripe.Event {
    const paymentProvider = getInstance();

    const isValid = paymentProvider.verifyWebhookSignature(params);
    if (!isValid) {
        throw new ApiError(400, 'Invalid webhook signature');
    }

    return paymentProvider.constructWebhookEvent(params) as Stripe.Event;
}
