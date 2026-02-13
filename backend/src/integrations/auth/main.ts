import { BaseAuth } from './BaseAuth.ts';
import { EmailPasswordAuth } from './EmailPasswordAuth.ts';
import { GoogleAuth } from './GoogleAuth.ts';
import { AuthProvider } from './types.ts';

const instanceMap = new Map<AuthProvider, BaseAuth>();

export function getAuthProvider(params?: { authProvider?: AuthProvider }): AuthProvider {
    let { authProvider } = params || {};

    if (!authProvider) {
        // Default to Google if no provider specified
        authProvider = AuthProvider.Google;
    }

    return authProvider;
}

export function getInstance(params?: { authProvider?: AuthProvider }): BaseAuth {
    const authProvider = getAuthProvider(params);

    if (instanceMap.has(authProvider)) {
        return instanceMap.get(authProvider)!;
    }

    switch (authProvider) {
        case AuthProvider.Google:
            instanceMap.set(AuthProvider.Google, new GoogleAuth());
            break;
        case AuthProvider.EmailPassword:
            instanceMap.set(AuthProvider.EmailPassword, new EmailPasswordAuth());
            break;
        default:
            throw new Error(`Unknown auth provider: ${authProvider}`);
    }

    return instanceMap.get(authProvider)!;
}
