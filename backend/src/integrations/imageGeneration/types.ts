export enum ImageProvider {
    Google = 'Google'
}

export interface GenerateImageRequest {
    prompt: string;
    userId: string;
    model?: string;
    negativePrompt?: string;
    aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
}

export interface GeneratedImageResult {
    url: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
}
