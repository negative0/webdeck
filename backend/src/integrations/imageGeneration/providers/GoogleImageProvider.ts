import ApiError from '../../../utils/ApiError.ts';
import * as Storage from '../../storage/index.ts';
import { BaseImageGenerator } from '../BaseImageGenerator.ts';
import { GenerateImageRequest, GeneratedImageResult, ImageProvider } from '../types.ts';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { randomUUID } from 'crypto';

export class GoogleImageProvider extends BaseImageGenerator {
    private get provider() {
        return createGoogleGenerativeAI({
            apiKey: this.apiKey
        });
    }

    getImageProviderName(): ImageProvider {
        return ImageProvider.Google;
    }

    async generateImage(request: GenerateImageRequest): Promise<GeneratedImageResult> {
        try {
            const model = request.model || this.defaultModel;

            const googleOptions: {
                responseModalities: ['IMAGE'];
                imageConfig?: { aspectRatio: string };
            } = {
                responseModalities: ['IMAGE']
            };

            if (request.aspectRatio) {
                googleOptions.imageConfig = {
                    aspectRatio: request.aspectRatio
                };
            }

            const result = await generateText({
                model: this.provider(model),
                prompt: request.prompt,
                providerOptions: {
                    google: googleOptions
                }
            });

            const imageFile = result.files.find(file => file.mediaType.startsWith('image/'));

            if (!imageFile) {
                throw new Error('No image generated in response');
            }

            const extension = imageFile?.mediaType.split('/')[1] || 'png';

            const imageBuffer = Buffer.from(imageFile.base64, 'base64');

            const storage = Storage.getInstance();
            const storageKey = `images/${randomUUID()}.${extension}`;

            await storage.uploadData({
                data: imageBuffer,
                destinationKey: storageKey,
                contentType: imageFile.mediaType
            });

            const signedUrl = await storage.generateDownloadSignedUrl({
                key: storageKey
            });

            return {
                url: signedUrl,
                storageKey,
                mimeType: imageFile.mediaType,
                fileSize: imageBuffer.length
            };
        } catch (error: unknown) {
            const err = error as Error;
            throw new ApiError(500, `Gemini image generation error: ${err.message}`);
        }
    }
}
