import ApiError from '../../utils/ApiError.ts';
import { BasePaymentProvider } from './BasePaymentProvider.ts';
import { CheckoutSession, CreateCheckoutSessionParams, PaymentProvider } from './types.ts';
import Stripe from 'stripe';

export class StripePaymentProvider extends BasePaymentProvider {
    private stripe: Stripe;
    originalWebhookUrl = `${process.env.BACKEND_DOMAIN}/payment/stripe/webhook`;

    constructor() {
        super();

        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined');
        }

        this.stripe = new Stripe(secretKey, {
            apiVersion: '2026-01-28.clover',
            typescript: true
        });
    }

    getProviderName(): PaymentProvider {
        return PaymentProvider.Stripe;
    }

    async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
        try {
            const session = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [
                    {
                        price_data: {
                            currency: params.currency,
                            product_data: {
                                name: params.productName
                            },
                            unit_amount: Math.round(params.amount * 100)
                        },
                        quantity: 1
                    }
                ],
                success_url: params.successUrl,
                cancel_url: params.cancelUrl,
                customer_email: params.customerEmail,
                metadata: {
                    ...params.metadata,
                    originalWebhookUrl: this.originalWebhookUrl
                }
            });

            return {
                id: session.id,
                url: session.url!,
                paymentStatus: session.payment_status,
                amountTotal: session.amount_total!,
                currency: session.currency!
            };
        } catch (error: unknown) {
            const err = error as Error;
            throw new ApiError(500, `Stripe error: ${err.message}`);
        }
    }

    verifyWebhookSignature(params: { payload: string | Buffer; signature: string; secret: string }): boolean {
        try {
            this.stripe.webhooks.constructEvent(params.payload, params.signature, params.secret);
            return true;
        } catch {
            return false;
        }
    }

    constructWebhookEvent(params: { payload: string | Buffer; signature: string; secret: string }): Stripe.Event {
        return this.stripe.webhooks.constructEvent(params.payload, params.signature, params.secret);
    }
}
