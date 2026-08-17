import Constants from "expo-constants";

export const AI_API_KEY =
  Constants.expoConfig?.extra?.geminiApiKey ?? "";

export const GEMINI_API_KEY = AI_API_KEY;

// Current model used by your project
export const GEMINI_MODEL = "gemini-2.0-flash";// "gemini-3.6-flash" ❌

if (!AI_API_KEY) {
  console.warn("[Gemini] API key is missing.");
}