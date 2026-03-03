import { OpenAIProvider } from "./openai";

export class DeepSeekProvider extends OpenAIProvider {
  constructor(apiKey: string) {
    super(apiKey, "https://api.deepseek.com/v1");
  }
}
