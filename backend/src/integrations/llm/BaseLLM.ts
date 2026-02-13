import { ChatRequest, LLMProvider } from './types.ts';

export abstract class BaseLLM {
    protected apiKey: string;
    protected defaultModel: string;

    constructor(params: { apiKey: string; defaultModel: string }) {
        this.apiKey = params.apiKey;
        this.defaultModel = params.defaultModel;
    }

    abstract getLLMProviderName(): LLMProvider;
    abstract createStream(request: ChatRequest): Promise<Response>;
    abstract generateText(request: ChatRequest): Promise<unknown>;
}
