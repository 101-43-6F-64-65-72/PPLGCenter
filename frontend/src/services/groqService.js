import { generateReplyzAiResponse, getAiApiKey, getAiProvider } from "@/services/aiService";
import { REPLYZ_SYSTEM_PROMPT } from "@/config/replyzSystemPrompt";
import { dispatchAiAction } from "@/utils/aiActionDispatcher";

export const groqService = {
  getApiKey: getAiApiKey,
  getProvider: getAiProvider,
  getSystemPrompt: () => REPLYZ_SYSTEM_PROMPT,
  generateResponse: generateReplyzAiResponse,
  dispatchAction: dispatchAiAction,
};

export default groqService;
