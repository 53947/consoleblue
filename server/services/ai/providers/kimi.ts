import { AIProvider, type ChatMessage, type StreamOptions } from "../base-provider";

export class KimiProvider extends AIProvider {
  private apiKey: string;
  private baseURL = "https://api.kimi.com/coding/v1";

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async *chat(messages: ChatMessage[], options: StreamOptions): AsyncGenerator<string> {
    const formattedMessages: Array<{ role: string; content: string }> = [];

    if (options.systemPrompt) {
      formattedMessages.push({ role: "system", content: options.systemPrompt });
    }

    for (const m of messages) {
      let content = m.content;

      const docAttachments = m.attachments?.filter(
        (a) => !a.mimeType.startsWith("image/"),
      );
      if (docAttachments?.length) {
        const docText = docAttachments
          .map((a) =>
            `[Attached file: ${a.filename}]\n${a.base64 ? Buffer.from(a.base64, "base64").toString("utf-8") : ""}`,
          )
          .join("\n\n");
        content = docText + "\n\n" + content;
      }

      formattedMessages.push({ role: m.role, content });
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": "claude-code/1.0",
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.error?.message || parsed.message || errorBody;
      } catch {
        errorMessage = errorBody;
      }
      throw new Error(`Kimi API error (${response.status}): ${errorMessage}`);
    }

    if (!response.body) {
      throw new Error("Kimi API returned no response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        } catch {
          // Skip malformed SSE chunks
        }
      }
    }
  }
}
