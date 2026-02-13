import { GenerateImageRequest, GeneratedImageResult, ImageProvider } from './types.ts';

export abstract class BaseImageGenerator {
    protected apiKey: string;
    protected defaultModel: string;

    constructor(params: { apiKey: string; defaultModel: string }) {
        this.apiKey = params.apiKey;
        this.defaultModel = params.defaultModel;
    }

    abstract getImageProviderName(): ImageProvider;
    abstract generateImage(request: GenerateImageRequest): Promise<GeneratedImageResult>;
}
