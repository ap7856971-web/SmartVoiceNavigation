export interface AIResult {
  reply: string;
  intent: string;
  destination?: string;
  category?: string;
}

const normalize = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.,]+/g, " ")
    .replace(/\s+/g, " ");
};

const localChatbot = (userText: string): AIResult => {
  const original = userText.trim();
  const text = normalize(original);

  // Empty message
  if (!text) {
    return {
      reply: "Please tell me what you want me to do.",
      intent: "general",
    };
  }

  // -----------------------------
  // GREETINGS
  // -----------------------------
  if (
    /^(hi|hello|hey|hii|helo|namaste|good morning|good afternoon|good evening)$/.test(
      text
    )
  ) {
    return {
      reply:
        "Hello! I am your Smart Voice Assistant. How can I help you?",
      intent: "greeting",
    };
  }

  // -----------------------------
  // WHO ARE YOU
  // -----------------------------
  if (
    text.includes("who are you") ||
    text.includes("what are you") ||
    text.includes("tum kon ho") ||
    text.includes("aap kon ho")
  ) {
    return {
      reply:
        "I am your Smart Voice Assistant. I can help with navigation, nearby places, and basic voice commands.",
      intent: "about",
    };
  }

  // -----------------------------
  // HELP
  // -----------------------------
  if (
    text === "help" ||
    text.includes("what can you do") ||
    text.includes("tum kya kar sakte ho") ||
    text.includes("aap kya kar sakte ho")
  ) {
    return {
      reply:
        "I can navigate to places, open Home or Work, find nearby hospitals, petrol pumps, restaurants and ATMs, and stop navigation.",
      intent: "help",
    };
  }

  // -----------------------------
  // THANKS
  // -----------------------------
  if (
    text.includes("thank you") ||
    text.includes("thanks") ||
    text.includes("dhanyawad")
  ) {
    return {
      reply: "You're welcome!",
      intent: "thanks",
    };
  }

  // -----------------------------
  // HOW ARE YOU
  // -----------------------------
  if (
    text.includes("how are you") ||
    text.includes("kaise ho") ||
    text.includes("kaisa hai")
  ) {
    return {
      reply: "I am ready to help you with your navigation.",
      intent: "general",
    };
  }

  // -----------------------------
  // STOP / CANCEL NAVIGATION
  // -----------------------------
  if (
    text.includes("stop navigation") ||
    text.includes("cancel navigation") ||
    text.includes("navigation stop") ||
    text.includes("navigation band")
  ) {
    return {
      reply: "Navigation cancelled.",
      intent: "cancel_navigation",
    };
  }

  // -----------------------------
  // HOME
  // -----------------------------
  if (
    /\b(go|take me|navigate|start|open)\b.*\bhome\b/i.test(text) ||
    text === "home" ||
    text.includes("ghar jana") ||
    text.includes("ghar chalo")
  ) {
    return {
      reply: "Opening the route to Home.",
      intent: "navigate_home",
      destination: "Home",
    };
  }

  // -----------------------------
  // WORK
  // -----------------------------
  if (
    /\b(go|take me|navigate|start|open)\b.*\bwork\b/i.test(text) ||
    text === "work" ||
    text.includes("office jana") ||
    text.includes("office chalo")
  ) {
    return {
      reply: "Opening the route to Work.",
      intent: "navigate_work",
      destination: "Work",
    };
  }

  // -----------------------------
  // NEARBY PLACES
  // -----------------------------
  const nearbyCommands: Array<{
    category: string;
    words: RegExp;
    spoken: string;
  }> = [
    {
      category: "hospital",
      words: /\b(hospital|hospitals|aspataal|hospital paas|hospital nearby)\b/i,
      spoken: "hospital",
    },
    {
      category: "petrol pump",
      words: /\b(petrol|petrol pump|fuel|gas station|petrol pump paas)\b/i,
      spoken: "petrol pump",
    },
    {
      category: "restaurant",
      words: /\b(restaurant|restaurants|food|khana|khaana)\b/i,
      spoken: "restaurant",
    },
    {
      category: "ATM",
      words: /\b(atm|cash machine|cash point)\b/i,
      spoken: "ATM",
    },
    {
      category: "police",
      words: /\b(police|police station|thana)\b/i,
      spoken: "police station",
    },
  ];

  const isNearby =
    text.includes("near") ||
    text.includes("nearby") ||
    text.includes("nearest") ||
    text.includes("near me") ||
    text.includes("paas") ||
    text.includes("nazdeek") ||
    text.includes("najdik");

  for (const item of nearbyCommands) {
    if (item.words.test(text) && isNearby) {
      return {
        reply: `Finding the nearest ${item.spoken}.`,
        intent: "nearby_search",
        category: item.category,
      };
    }
  }

  // Direct category command
  for (const item of nearbyCommands) {
    if (
      text === item.category ||
      text === item.spoken ||
      text === `find ${item.category}` ||
      text === `find ${item.spoken}`
    ) {
      return {
        reply: `Finding the nearest ${item.spoken}.`,
        intent: "nearby_search",
        category: item.category,
      };
    }
  }

  // -----------------------------
  // DIRECT NAVIGATION
  // -----------------------------
  const navigationPatterns = [
    /^(?:please\s+)?(?:navigate|go|take me|drive|route|start navigation|navigation)\s+(?:to\s+)?(.+)$/i,

    /^(?:please\s+)?(?:take me|le chalo|le jao)\s+(?:to\s+)?(.+)$/i,

    /^(?:mujhe|mujhko)\s+(.+?)\s+(?:le chalo|le jao|jana hai)$/i,

    /^(?:jana hai|jaana hai)\s+(.+)$/i,
  ];

  for (const pattern of navigationPatterns) {
    const match = original.match(pattern);

    if (match?.[1]) {
      const destination = match[1]
        .trim()
        .replace(/[.!?]+$/, "");

      if (
        destination &&
        !/^(home|work|nearby|near me|nearest)$/i.test(destination)
      ) {
        return {
          reply: `Opening the route to ${destination}.`,
          intent: "navigate",
          destination,
        };
      }
    }
  }

  // -----------------------------
  // SIMPLE CHAT
  // -----------------------------
  if (
    text.includes("good morning")
  ) {
    return {
      reply: "Good morning! How can I help you today?",
      intent: "general",
    };
  }

  if (
    text.includes("good night")
  ) {
    return {
      reply: "Good night! Drive safely.",
      intent: "general",
    };
  }

  // -----------------------------
  // UNKNOWN COMMAND
  // -----------------------------
  return {
    reply:
      "I didn't understand that command. You can say: navigate to Delhi, find nearest hospital, go home, go to work, or stop navigation.",
    intent: "unknown",
  };
};

// Main function used by VoiceTab
export async function askAI(userText: string): Promise<AIResult> {
  // No Gemini
  // No OpenAI
  // No API
  // No internet request

  return localChatbot(userText);
}