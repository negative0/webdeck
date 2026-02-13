import {
    AuthProvider,
    EmailPasswordCredentials,
    OAuthAuthorizationUrlParams,
    OAuthCallbackParams,
    OTPSendParams,
    OTPVerifyParams,
    StandardUserProfile
} from './types.ts';

/**
 * BaseAuth - Provider-agnostic authentication integration layer
 *
 * This acts as an IDP broker that handles authentication with various providers
 * and returns standardized user profiles. It does NOT handle:
 * - Database operations
 * - JWT token generation
 * - Session management
 * - User creation
 *
 * Those are responsibilities of the app's business layer.
 */
export abstract class BaseAuth {
    /**
     * Get the auth provider name
     */
    abstract getAuthProviderName(): AuthProvider;

    /**
     * Check if this provider supports OAuth flow
     */
    supportsOAuth(): boolean {
        return false;
    }

    /**
     * Check if this provider supports email/password authentication
     */
    supportsEmailPassword(): boolean {
        return false;
    }

    /**
     * Check if this provider supports OTP authentication
     */
    supportsOTP(): boolean {
        return false;
    }

    // ========== OAuth Methods ==========

    /**
     * Generate OAuth authorization URL
     * Only applicable for OAuth providers (Google, GitHub, etc.)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, require-await
    async getAuthorizationUrl(_params?: OAuthAuthorizationUrlParams): Promise<string> {
        return Promise.reject(new Error(`${this.getAuthProviderName()} does not support OAuth`));
    }

    /**
     * Handle OAuth callback and return standardized user profile
     * Only applicable for OAuth providers
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, require-await
    async handleOAuthCallback(_params: OAuthCallbackParams): Promise<StandardUserProfile> {
        return Promise.reject(new Error(`${this.getAuthProviderName()} does not support OAuth`));
    }

    // ========== Email/Password Methods ==========

    /**
     * Authenticate user with email and password
     * Only applicable for email/password providers
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, require-await
    async authenticateWithEmailPassword(_credentials: EmailPasswordCredentials): Promise<StandardUserProfile> {
        return Promise.reject(
            new Error(`${this.getAuthProviderName()} does not support email/password authentication`)
        );
    }

    /**
     * Register/create account with email and password
     * Only applicable for email/password providers
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, require-await
    async registerWithEmailPassword(_credentials: EmailPasswordCredentials): Promise<StandardUserProfile> {
        return Promise.reject(new Error(`${this.getAuthProviderName()} does not support email/password registration`));
    }

    // ========== OTP Methods ==========

    /**
     * Send OTP to user's email or phone
     * Only applicable for OTP providers
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, require-await
    async sendOTP(_params: OTPSendParams): Promise<{ success: boolean; message?: string }> {
        return Promise.reject(new Error(`${this.getAuthProviderName()} does not support OTP`));
    }

    /**
     * Verify OTP and return user profile
     * Only applicable for OTP providers
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, require-await
    async verifyOTP(_params: OTPVerifyParams): Promise<StandardUserProfile> {
        return Promise.reject(new Error(`${this.getAuthProviderName()} does not support OTP verification`));
    }
}
