import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, type ChatMessage, type StreamOptions } from "../base-provider";

export class AnthropicProvider extends AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async *chat(messages: ChatMessage[], options: StreamOptions): AsyncGenerator<string> {
    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const stream = this.client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt || systemMessages.map((m) => m.content).join("\n") || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
