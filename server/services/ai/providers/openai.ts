import OpenAI from "openai";
import { AIProvider, type ChatMessage, type StreamOptions } from "../base-provider";

export class OpenAIProvider extends AIProvider {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    super();
    this.client = new OpenAI({ apiKey, baseURL });
  }

  async *chat(messages: ChatMessage[], options: StreamOptions): AsyncGenerator<string> {
    const formattedMessages: OpenAI.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      formattedMessages.push({ role: "system", content: options.systemPrompt });
    }

    for (const m of messages) {
      formattedMessages.push({
        role: m.role,
        content: m.content,
      } as OpenAI.ChatCompletionMessageParam);
    }

    const stream = await this.client.chat.completions.create({
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      messages: formattedMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
