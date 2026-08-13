import * as FileSystem from "expo-file-system/legacy";

import {
  AI_API_KEY,
  GEMINI_MODEL,
} from "../ai/config";

/**
 * Local audio file -> Base64
 */
async function fileToBase64(
  uri: string
): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Speech-to-Text error types
 */
export class SpeechToTextError extends Error {
  code:
    | "NO_AUDIO"
    | "FILE_NOT_FOUND"
    | "API_KEY_MISSING"
    | "QUOTA_EXCEEDED"
    | "API_ERROR"
    | "EMPTY_RESPONSE"
    | "PARSE_ERROR"
    | "UNKNOWN";

  retryAfter?: number;

  constructor(
    message: string,
    code:
      | "NO_AUDIO"
      | "FILE_NOT_FOUND"
      | "API_KEY_MISSING"
      | "QUOTA_EXCEEDED"
      | "API_ERROR"
      | "EMPTY_RESPONSE"
      | "PARSE_ERROR"
      | "UNKNOWN",
    retryAfter?: number
  ) {
    super(message);

    this.name = "SpeechToTextError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/**
 * Extract retry seconds from Gemini 429 response
 */
function getRetrySeconds(
  responseText: string
): number | undefined {
  try {
    const data = JSON.parse(responseText);

    const retryDelay =
      data?.error?.details?.find(
        (item: any) =>
          item?.["@type"]?.includes(
            "RetryInfo"
          )
      )?.retryDelay;

    if (
      typeof retryDelay === "string"
    ) {
      const seconds = parseFloat(
        retryDelay.replace("s", "")
      );

      if (!Number.isNaN(seconds)) {
        return Math.ceil(seconds);
      }
    }

    const message =
      data?.error?.message ?? "";

    const match =
      message.match(
        /retry in ([\d.]+)s/i
      );

    if (match?.[1]) {
      return Math.ceil(
        parseFloat(match[1])
      );
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract text from Gemini response.
 */
function extractTranscript(
  data: any
): string {
  const candidates =
    data?.candidates;

  if (
    !Array.isArray(candidates) ||
    candidates.length === 0
  ) {
    return "";
  }

  const candidate =
    candidates[0];

  const parts =
    candidate?.content?.parts;

  if (
    !Array.isArray(parts) ||
    parts.length === 0
  ) {
    return "";
  }

  return parts
    .filter(
      (part: any) =>
        typeof part?.text === "string"
    )
    .map(
      (part: any) =>
        part.text
    )
    .join(" ")
    .trim();
}

/**
 * Clean Gemini transcript.
 */
function cleanTranscript(
  text: string
): string {
  return text
    .replace(
      /^```(?:text|txt)?\s*/i,
      ""
    )
    .replace(
      /\s*```$/i,
      ""
    )
    .replace(
      /^["']([\s\S]*)["']$/,
      "$1"
    )
    .replace(
      /^Transcript:\s*/i,
      ""
    )
    .trim();
}

/**
 * Convert recorded voice to text using Gemini.
 */
export async function speechToText(
  audioUri: string
): Promise<string> {
  try {
    console.log(
      "================================"
    );

    console.log(
      "[speechToText] Starting..."
    );

    // --------------------------------------------------
    // 1. API KEY CHECK
    // --------------------------------------------------

    if (!AI_API_KEY) {
      console.error(
        "[speechToText] API key missing"
      );

      throw new SpeechToTextError(
        "Gemini API key is missing.",
        "API_KEY_MISSING"
      );
    }

    // --------------------------------------------------
    // 2. AUDIO URI CHECK
    // --------------------------------------------------

    if (!audioUri) {
      console.log(
        "[speechToText] No audio URI"
      );

      throw new SpeechToTextError(
        "No audio recording found.",
        "NO_AUDIO"
      );
    }

    console.log(
      "[speechToText] Audio URI:",
      audioUri
    );

    // --------------------------------------------------
    // 3. FILE CHECK
    // --------------------------------------------------

    const fileInfo =
      await FileSystem.getInfoAsync(
        audioUri
      );

    console.log(
      "[speechToText] File info:",
      fileInfo
    );

    if (!fileInfo.exists) {
      console.error(
        "[speechToText] Audio file does not exist"
      );

      throw new SpeechToTextError(
        "Audio recording file not found.",
        "FILE_NOT_FOUND"
      );
    }

    // --------------------------------------------------
    // 4. READ AUDIO
    // --------------------------------------------------

    console.log(
      "[speechToText] Reading audio..."
    );

    const base64Audio =
      await fileToBase64(
        audioUri
      );

    console.log(
      "[speechToText] Base64 audio length:",
      base64Audio.length
    );

    // --------------------------------------------------
    // 5. VERY SMALL AUDIO CHECK
    // --------------------------------------------------

    if (
      !base64Audio ||
      base64Audio.length < 1000
    ) {
      console.log(
        "[speechToText] Audio data is too small"
      );

      throw new SpeechToTextError(
        "Audio recording is too short or empty.",
        "NO_AUDIO"
      );
    }

    // --------------------------------------------------
    // 6. MIME TYPE & MODEL
    // --------------------------------------------------

    const mimeType = "audio/aac";
    const selectedModel = GEMINI_MODEL || "gemini-1.5-flash";

    console.log(
      "[speechToText] MIME type:",
      mimeType
    );

    console.log(
      "[speechToText] Model:",
      selectedModel
    );

    // Dynamic URL generation using valid query key parameter
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${AI_API_KEY}`;

    // --------------------------------------------------
    // 7. REQUEST BODY (CamelCase schema for REST API)
    // --------------------------------------------------

    const requestBody = {
      contents: [
        {
          role: "user",

          parts: [
            {
              text: `
Generate a transcript of the speech in this audio.

Rules:
- Return ONLY the words spoken by the user.
- Do NOT answer the user's question.
- Do NOT explain anything.
- Do NOT add "Transcript:".
- Do NOT add any introduction.
- Preserve the original language.
- Hindi is allowed.
- English is allowed.
- Hinglish is allowed.
- Preserve names and place names.
- If there is no understandable speech, return an empty string.
              `.trim(),
            },

            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],

      generationConfig: {
        temperature: 0,
        maxOutputTokens: 300,
      },
    };

    // --------------------------------------------------
    // 8. SEND REQUEST
    // --------------------------------------------------

    console.log(
      "[speechToText] Sending audio to Gemini..."
    );

    const response =
      await fetch(
        geminiUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

    // --------------------------------------------------
    // 9. READ RESPONSE ONCE
    // --------------------------------------------------

    const responseText =
      await response.text();

    console.log(
      "[speechToText] Gemini status:",
      response.status
    );

    // --------------------------------------------------
    // 10. QUOTA ERROR
    // --------------------------------------------------

    if (
      response.status === 429
    ) {
      const retryAfter =
        getRetrySeconds(
          responseText
        );

      console.error(
        "[speechToText] Gemini quota exceeded."
      );

      console.error(
        "[speechToText] Retry after:",
        retryAfter,
        "seconds"
      );

      console.error(
        "[speechToText] Response:",
        responseText
      );

      throw new SpeechToTextError(
        retryAfter
          ? `Gemini API quota exceeded. Try again after ${retryAfter} seconds.`
          : "Gemini API quota exceeded. Please try again later.",
        "QUOTA_EXCEEDED",
        retryAfter
      );
    }

    // --------------------------------------------------
    // 11. OTHER API ERRORS
    // --------------------------------------------------

    if (!response.ok) {
      console.error(
        "[speechToText] Gemini API error:",
        response.status,
        responseText
      );

      throw new SpeechToTextError(
        `Gemini API error: ${response.status}`,
        "API_ERROR"
      );
    }

    // --------------------------------------------------
    // 12. PARSE RESPONSE
    // --------------------------------------------------

    let data: any;

    try {
      data =
        JSON.parse(
          responseText
        );
    } catch (error) {
      console.error(
        "[speechToText] JSON parse error:",
        error
      );

      console.error(
        "[speechToText] Raw response:",
        responseText
      );

      throw new SpeechToTextError(
        "Gemini returned invalid JSON.",
        "PARSE_ERROR"
      );
    }

    console.log(
      "[speechToText] Gemini response received"
    );

    // --------------------------------------------------
    // 13. CANDIDATE
    // --------------------------------------------------

    const candidate =
      data?.candidates?.[0];

    if (!candidate) {
      console.error(
        "[speechToText] No candidate returned"
      );

      console.error(
        "[speechToText] Full response:",
        JSON.stringify(data)
      );

      throw new SpeechToTextError(
        "Gemini did not return a transcription.",
        "EMPTY_RESPONSE"
      );
    }

    console.log(
      "[speechToText] Finish reason:",
      candidate?.finishReason
    );

    // --------------------------------------------------
    // 14. PARTS
    // --------------------------------------------------

    const parts =
      candidate?.content?.parts;

    if (
      !Array.isArray(parts) ||
      parts.length === 0
    ) {
      console.error(
        "[speechToText] No response parts detected"
      );

      console.error(
        "[speechToText] Candidate:",
        JSON.stringify(
          candidate
        )
      );

      throw new SpeechToTextError(
        "Gemini returned no transcription text.",
        "EMPTY_RESPONSE"
      );
    }

    // --------------------------------------------------
    // 15. EXTRACT TRANSCRIPT
    // --------------------------------------------------

    const rawTranscript =
      extractTranscript(
        data
      );

    console.log(
      "[speechToText] Raw transcript:",
      rawTranscript
    );

    if (!rawTranscript) {
      console.log(
        "[speechToText] Empty transcript returned"
      );

      throw new SpeechToTextError(
        "No understandable speech was detected.",
        "EMPTY_RESPONSE"
      );
    }

    // --------------------------------------------------
    // 16. CLEAN TRANSCRIPT
    // --------------------------------------------------

    const transcript =
      cleanTranscript(
        rawTranscript
      );

    console.log(
      "[speechToText] Final transcript:",
      transcript
    );

    console.log(
      "================================"
    );

    return transcript;
  } catch (error) {
    // --------------------------------------------------
    // 17. KNOWN SPEECH ERROR
    // --------------------------------------------------

    if (
      error instanceof
      SpeechToTextError
    ) {
      console.error(
        "[speechToText]",
        error.code,
        error.message
      );

      throw error;
    }

    // --------------------------------------------------
    // 18. UNKNOWN ERROR
    // --------------------------------------------------

    console.error(
      "[speechToText] Unexpected error:",
      error
    );

    throw new SpeechToTextError(
      "Unexpected speech-to-text error.",
      "UNKNOWN"
    );
  }
}