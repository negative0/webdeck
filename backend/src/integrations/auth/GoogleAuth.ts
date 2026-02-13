import { BaseAuth } from './BaseAuth.ts';
import { AuthProvider, OAuthAuthorizationUrlParams, OAuthCallbackParams, StandardUserProfile } from './types.ts';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * GoogleAuth - Pure OAuth integration for Google Sign-In
 *
 * This class ONLY handles OAuth flow with Google:
 * - Generates authorization URLs
 * - Exchanges OAuth codes for user profiles
 * - Returns standardized user data
 *
 * It does NOT handle:
 * - Database operations
 * - JWT token generation
 * - Session management
 * - User creation
 */
export class GoogleAuth extends BaseAuth {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;

    // Google OAuth endpoints
    private readonly AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
    private readonly TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
    private readonly USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';
    private readonly CERTS_ENDPOINT = 'https://www.googleapis.com/oauth2/v1/certs';

    constructor() {
        super();

        this.clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
        this.clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
        this.redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || '';

        if (!this.clientId) throw new Error('GOOGLE_OAUTH_CLIENT_ID is required');
        if (!this.clientSecret) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET is required');
        if (!this.redirectUri) throw new Error('GOOGLE_OAUTH_REDIRECT_URI is required');
    }

    getAuthProviderName(): AuthProvider {
        return AuthProvider.Google;
    }

    supportsOAuth(): boolean {
        return true;
    }

    // eslint-disable-next-line require-await
    async getAuthorizationUrl(params?: OAuthAuthorizationUrlParams): Promise<string> {
        const redirectUri = params?.redirectUri || this.redirectUri;
        const scope = params?.scope || ['openid', 'email', 'profile'];

        // Encode original redirect URI from env in base64 as state parameter
        const state = Buffer.from(
            JSON.stringify({
                originalRedirectUrl:
                    process.env.NODE_ENV === 'production'
                        ? this.redirectUri
                        : `${process.env.BACKEND_DOMAIN}/auth/google/callback`
            })
        ).toString('base64');

        const authUrl = new URL(this.AUTHORIZATION_ENDPOINT);
        authUrl.searchParams.append('client_id', this.clientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', scope.join(' '));
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('access_type', 'offline');
        authUrl.searchParams.append('prompt', 'consent');

        return authUrl.toString();
    }

    /**
     * Verify Google ID token by fetching Google's public keys and validating signature
     */
    private async verifyIdToken(idToken: string): Promise<any> {
        // Decode token without verification first to get header
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid ID token format');
        }

        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        const signature = parts[2];

        // Validate basic claims
        if (payload.aud !== this.clientId) {
            throw new Error('ID token audience mismatch');
        }

        if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
            throw new Error('ID token issuer mismatch');
        }

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            throw new Error('ID token expired');
        }

        // Fetch Google's public keys
        const certsResponse = await fetch(this.CERTS_ENDPOINT);
        if (!certsResponse.ok) {
            throw new Error('Failed to fetch Google certificates');
        }

        const certs = await certsResponse.json();
        const cert = certs[header.kid];
        if (!cert) {
            throw new Error('Certificate not found for key ID');
        }

        // Verify signature
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(`${parts[0]}.${parts[1]}`);
        const isValid = verifier.verify(cert, signature, 'base64url');

        if (!isValid) {
            throw new Error('ID token signature verification failed');
        }

        return payload;
    }

    async handleOAuthCallback(params: OAuthCallbackParams): Promise<StandardUserProfile> {
        const { code } = params;

        // Exchange authorization code for tokens
        const tokenResponse = await fetch(this.TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            throw new Error(`Failed to exchange authorization code: ${errorData}`);
        }

        const tokens = await tokenResponse.json();

        // Verify ID token is present
        if (!tokens.id_token) {
            throw new Error('No ID token received from Google');
        }

        // Verify and decode ID token - this ensures token authenticity and integrity
        const payload = await this.verifyIdToken(tokens.id_token);

        // Fetch additional user profile data using access token
        const userInfoResponse = await fetch(this.USERINFO_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`
            }
        });

        if (!userInfoResponse.ok) {
            const errorData = await userInfoResponse.text();
            throw new Error(`Failed to fetch user info: ${errorData}`);
        }

        const userInfo = await userInfoResponse.json();

        // Return standardized user profile (using verified payload data)
        return {
            provider: AuthProvider.Google,
            providerId: payload.sub, // Use verified ID from token
            email: payload.email, // Use verified email from token
            name: userInfo.name || payload.name, // Prefer additional data, fallback to token
            picture: userInfo.picture || payload.picture,
            rawProfile: { ...payload, ...userInfo }
        };
    }
}
