import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, type ChatMessage, type StreamOptions } from "../base-provider";

export class GoogleProvider extends AIProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    super();
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async *chat(messages: ChatMessage[], options: StreamOptions): AsyncGenerator<string> {
    const model = this.genAI.getGenerativeModel({
      model: options.model,
      systemInstruction: options.systemPrompt || undefined,
    });

    // Convert to Google's content format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      },
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}
