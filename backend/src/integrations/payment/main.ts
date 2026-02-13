import { BasePaymentProvider } from './BasePaymentProvider.ts';
import { StripePaymentProvider } from './StripePaymentProvider.ts';
import { PaymentProvider } from './types.ts';

const instanceMap = new Map<PaymentProvider, BasePaymentProvider>();

export function getInstance(): BasePaymentProvider {
    const paymentProvider = PaymentProvider.Stripe; // Currently only Stripe is supported

    if (instanceMap.has(paymentProvider)) {
        return instanceMap.get(paymentProvider)!;
    }
    switch (paymentProvider) {
        case PaymentProvider.Stripe:
            instanceMap.set(PaymentProvider.Stripe, new StripePaymentProvider());
            break;
        default:
            throw new Error(`Unknown payment provider: ${paymentProvider}`);
    }
    return instanceMap.get(paymentProvider)!;
}
