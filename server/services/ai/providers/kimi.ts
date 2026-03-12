import { OpenAIProvider } from "./openai";

export class KimiProvider extends OpenAIProvider {
  constructor(apiKey: string) {
    super(apiKey, "https://api.kimi.com/coding/v1");
  }
}
