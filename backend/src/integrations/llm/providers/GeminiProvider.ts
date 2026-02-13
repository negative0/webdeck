import { BaseLLM } from '../BaseLLM.ts';
import { ChatRequest, LLMProvider } from '../types.ts';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { FinishReason, LanguageModelUsage, ModelMessage, Output, generateText, streamText } from 'ai';

export class GeminiProvider extends BaseLLM {
    private get provider() {
        return createGoogleGenerativeAI({
            apiKey: this.apiKey
        });
    }

    getLLMProviderName(): LLMProvider {
        return LLMProvider.Gemini;
    }

    // eslint-disable-next-line require-await
    async createStream(request: ChatRequest): Promise<Response> {
        const model = request.model || this.defaultModel;

        const baseOptions = {
            model: this.provider(model),
            messages: request.messages.map(m => ({
                role: m.role as any,
                content:
                    m.content ||
                    (m.parts
                        ? m.parts
                              .filter((p: any) => p.type === 'text')
                              .map((p: any) => p.text)
                              .join('')
                        : '')
            })) as ModelMessage[],
            temperature: request.options?.temperature,
            maxOutputTokens: request.options?.maxTokens,
            topP: request.options?.topP,
            onError({ error }: { error: unknown }) {
                console.error('[Gemini Stream] Error:', error);
            },
            onFinish({
                text,
                usage,
                finishReason
            }: {
                text: string;
                usage: LanguageModelUsage;
                finishReason: FinishReason;
            }) {
                console.log('[Gemini Stream] Finished:', {
                    textLength: text.length,
                    finishReason,
                    usage
                });
            }
        };

        const result = request.outputSchema
            ? streamText({ ...baseOptions, output: Output.object({ schema: request.outputSchema }) })
            : streamText(baseOptions);

        return result.toUIMessageStreamResponse();
    }

    async generateText(request: ChatRequest): Promise<unknown> {
        const model = request.model || this.defaultModel;

        try {
            const baseOptions = {
                model: this.provider(model),
                messages: request.messages.map(m => ({
                    role: m.role as any,
                    content:
                        m.content ||
                        (m.parts
                            ? m.parts
                                  .filter((p: any) => p.type === 'text')
                                  .map((p: any) => p.text)
                                  .join('')
                            : '')
                })) as ModelMessage[],
                temperature: request.options?.temperature,
                maxOutputTokens: request.options?.maxTokens,
                topP: request.options?.topP,
                onFinish({
                    text,
                    usage,
                    finishReason
                }: {
                    text: string;
                    usage: LanguageModelUsage;
                    finishReason: FinishReason;
                }) {
                    console.log('[Gemini Generate] Finished:', {
                        textLength: text.length,
                        finishReason,
                        usage
                    });
                }
            };

            const result = request.outputSchema
                ? await generateText({ ...baseOptions, output: Output.object({ schema: request.outputSchema }) })
                : await generateText(baseOptions);

            return {
                text: result.text,
                output: result.output,
                usage: result.usage,
                finishReason: result.finishReason
            };
        } catch (error) {
            console.error('[Gemini Generate] Error:', error);
            throw error;
        }
    }
}
