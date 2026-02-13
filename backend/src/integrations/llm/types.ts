import { FlexibleSchema } from 'ai';

export enum LLMProvider {
    Anthropic = 'anthropic',
    OpenAI = 'openai',
    Gemini = 'gemini'
}

export interface MessagePart {
    type: 'text' | 'file' | string;
    text?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content?: string;
    parts?: MessagePart[];
}

export interface StreamOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}

export interface ChatRequest {
    messages: ChatMessage[];
    provider?: LLMProvider;
    model?: string;
    options?: StreamOptions;
    stream?: boolean;
    outputSchema?: FlexibleSchema<unknown>;
}
