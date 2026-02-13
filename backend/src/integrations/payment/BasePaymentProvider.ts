import { CheckoutSession, CreateCheckoutSessionParams, PaymentProvider } from './types.ts';

export abstract class BasePaymentProvider {
    abstract createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession>;

    abstract verifyWebhookSignature(params: { payload: string | Buffer; signature: string; secret: string }): boolean;

    abstract constructWebhookEvent(params: { payload: string | Buffer; signature: string; secret: string }): unknown;

    abstract getProviderName(): PaymentProvider;
}
