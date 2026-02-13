import { BaseAuth } from './BaseAuth.ts';
import { AuthProvider, EmailPasswordCredentials, StandardUserProfile } from './types.ts';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * EmailPasswordAuth - Email/Password authentication integration
 *
 * This class ONLY handles:
 * - Validating email format
 * - Password strength validation
 * - Returning standardized user profile
 *
 * It does NOT handle:
 * - Database operations
 * - Password hashing (done in business layer)
 * - JWT token generation
 * - User creation
 *
 * Note: Unlike OAuth providers, email/password auth is mostly handled in the
 * business layer. This integration layer just provides validation and structure.
 */
export class EmailPasswordAuth extends BaseAuth {
    private readonly minPasswordLength = 8;
    private readonly maxPasswordLength = 128;

    constructor() {
        super();
    }

    getAuthProviderName(): AuthProvider {
        return AuthProvider.EmailPassword;
    }

    supportsEmailPassword(): boolean {
        return true;
    }

    /**
     * Validate credentials and return profile for registration
     * Note: Password hashing happens in business layer, not here
     */
    // eslint-disable-next-line require-await
    async registerWithEmailPassword(credentials: EmailPasswordCredentials): Promise<StandardUserProfile> {
        const { email, password } = credentials;

        // Validate email format
        this.validateEmail(email);

        // Validate password strength
        this.validatePassword(password);

        // Return standardized profile
        // The business layer will hash the password and store it in metadata
        return {
            provider: AuthProvider.EmailPassword,
            providerId: email, // Email is the unique identifier
            email,
            rawProfile: {
                registeredAt: new Date().toISOString()
            }
        };
    }

    /**
     * Validate credentials for login
     * Note: Actual password verification happens in business layer with DB
     */
    // eslint-disable-next-line require-await
    async authenticateWithEmailPassword(credentials: EmailPasswordCredentials): Promise<StandardUserProfile> {
        const { email, password } = credentials;

        // Validate email format
        this.validateEmail(email);

        // Basic validation (non-empty password)
        if (!password || password.trim() === '') {
            throw new Error('Password is required');
        }

        // Return profile structure
        // Business layer will verify password hash from DB
        return {
            provider: AuthProvider.EmailPassword,
            providerId: email,
            email,
            rawProfile: {
                loginAt: new Date().toISOString()
            }
        };
    }

    // ========== Validation Helper Methods ==========

    private validateEmail(email: string): void {
        if (!email || email.trim() === '') {
            throw new Error('Email is required');
        }

        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Check length
        if (email.length > 255) {
            throw new Error('Email is too long');
        }
    }

    private validatePassword(password: string): void {
        if (!password || password.trim() === '') {
            throw new Error('Password is required');
        }

        // Check minimum length
        if (password.length < this.minPasswordLength) {
            throw new Error(`Password must be at least ${this.minPasswordLength} characters long`);
        }

        // Check maximum length
        if (password.length > this.maxPasswordLength) {
            throw new Error(`Password must be less than ${this.maxPasswordLength} characters`);
        }

        // Check password strength (at least one letter and one number)
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (!hasLetter || !hasNumber) {
            throw new Error('Password must contain at least one letter and one number');
        }

        // Optional: Check for common weak passwords
        const weakPasswords = ['password', '12345678', 'qwerty123', 'abc12345'];
        if (weakPasswords.includes(password.toLowerCase())) {
            throw new Error('Password is too weak. Please choose a stronger password');
        }
    }
}
