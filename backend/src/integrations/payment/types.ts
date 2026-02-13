export enum PaymentProvider {
    Stripe = 'Stripe'
}

export enum PaymentStatus {
    Pending = 'PENDING',
    Succeeded = 'SUCCEEDED',
    Failed = 'FAILED',
    Refunded = 'REFUNDED'
}

export interface CreateCheckoutSessionParams {
    amount: number;
    currency: string;
    productName: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
}

export interface CheckoutSession {
    id: string;
    url: string;
    paymentStatus: string;
    amountTotal: number;
    currency: string;
}

export interface WebhookEvent {
    id: string;
    type: string;
    data: unknown;
}
