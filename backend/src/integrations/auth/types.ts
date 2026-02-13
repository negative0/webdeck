// Auth Provider Types
export enum AuthProvider {
    Google = 'Google',
    EmailPassword = 'EmailPassword'
    // Future: EmailOTP, PhoneOTP, GitHub, Facebook, etc.
}

// Standardized user profile returned by all auth providers
export interface StandardUserProfile {
    provider: AuthProvider;
    providerId: string; // Unique ID from the provider
    email: string;
    name?: string;
    picture?: string;
    rawProfile?: Record<string, any>; // Original provider response
}

// OAuth-specific types
export interface OAuthAuthorizationUrlParams {
    state?: string;
    redirectUri?: string;
    scope?: string[];
}

export interface OAuthCallbackParams {
    code: string;
    state?: string;
}

// Future: Email/Password types
export interface EmailPasswordCredentials {
    email: string;
    password: string;
}

// Future: OTP types
export interface OTPSendParams {
    identifier: string; // email or phone
}

export interface OTPVerifyParams {
    identifier: string; // email or phone
    code: string;
}
