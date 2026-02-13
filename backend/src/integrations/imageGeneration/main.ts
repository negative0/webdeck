import { BaseImageGenerator } from './BaseImageGenerator.ts';
import { GoogleImageProvider } from './providers/GoogleImageProvider.ts';
import { ImageProvider } from './types.ts';

export function getInstance(params: { provider?: ImageProvider; apiKey?: string }): BaseImageGenerator {
    const { apiKey, provider = process.env.IMAGE_GENERATION_PROVIDER } = params;
    switch (provider) {
        case ImageProvider.Google: {
            const key = apiKey || process.env.IMAGE_GENERATION_API_KEY;
            if (!key) throw new Error('IMAGE_GENERATION_API_KEY is required');

            const defaultModel = process.env.IMAGE_GENERATION_MODEL || 'gemini-2.5-flash-image';
            return new GoogleImageProvider({ apiKey: key, defaultModel });
        }
        default:
            throw new Error(`Unknown image provider: ${provider}`);
    }
}
