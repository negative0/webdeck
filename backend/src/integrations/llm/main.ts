import { BaseLLM } from './BaseLLM.ts';
import { AnthropicProvider } from './providers/AnthropicProvider.ts';
import { GeminiProvider } from './providers/GeminiProvider.ts';
import { OpenAIProvider } from './providers/OpenAIProvider.ts';
import { LLMProvider } from './types.ts';

export function getInstance(params: { provider: LLMProvider; apiKey?: string }): BaseLLM {
    const { provider, apiKey } = params;

    switch (provider) {
        case LLMProvider.Anthropic: {
            const key = apiKey || process.env.ANTHROPIC_API_KEY;
            if (!key) throw new Error('ANTHROPIC_API_KEY is required');

            const defaultModel = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
            return new AnthropicProvider({ apiKey: key, defaultModel });
        }
        case LLMProvider.OpenAI: {
            const key = apiKey || process.env.OPENAI_API_KEY;
            if (!key) throw new Error('OPENAI_API_KEY is required');

            const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o';
            return new OpenAIProvider({ apiKey: key, defaultModel });
        }
        case LLMProvider.Gemini: {
            const key = apiKey || process.env.GEMINI_API_KEY;
            if (!key) throw new Error('GEMINI_API_KEY is required');

            const defaultModel = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
            return new GeminiProvider({ apiKey: key, defaultModel });
        }
        default:
            throw new Error(`Unknown LLM provider: ${provider}`);
    }
}
