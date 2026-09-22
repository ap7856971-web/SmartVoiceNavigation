import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

import {
  askAI,
  AIResult,
} from "../../ai/assistant";

import { router } from "expo-router";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

import {
  stopNavigation,
} from "../../services/navigation";


import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";


import {
  useAudioPlayer,
} from "expo-audio";

/* =========================================================
   TYPES
========================================================= */

type Status =
  | "idle"
  | "recording"
  | "uploading"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";

interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  intent?: string;
}

/* =========================================================
   QUICK COMMANDS
========================================================= */

const COMMAND_CHIPS = [
  {
    label: "🏥 Hospital",
    prompt: "Find nearest hospital",
  },
  {
    label: "⛽ Petrol",
    prompt: "Petrol pump nearby",
  },
  {
    label: "🏠 Home",
    prompt: "Navigate Home",
  },
  {
    label: "🏢 Work",
    prompt: "Navigate Work",
  },
  {
    label: "🍽 Restaurant",
    prompt: "Find nearby restaurant",
  },
  {
    label: "🏧 ATM",
    prompt: "Find nearest ATM",
  },
];

/* =========================================================
   STATUS LABELS
========================================================= */

const STATUS_LABEL: Record<Status, string> = {
  idle: "Tap Siri Orb to start",
  recording: "Listening...",
  uploading: "Processing Audio...",
  transcribing: "Converting to text...",
  thinking: "Siri is thinking...",
  speaking: "Responding...",
  error: "Something went wrong",
};

/* =========================================================
   WAVEFORM
========================================================= */

const WAVE_FRAMES = [
  [8, 18, 12, 26, 10, 22, 14],
  [12, 26, 18, 34, 16, 28, 10],
  [18, 32, 14, 24, 30, 16, 26],
  [10, 24, 34, 16, 28, 20, 12],
];

/* =========================================================
   COMPONENT
========================================================= */

export default function VoiceTab() {
  /* -------------------------------------------------------
     ANIMATIONS
  ------------------------------------------------------- */

  const pulseAnim =
    useRef(new Animated.Value(1)).current;

  const rotateAnim =
    useRef(new Animated.Value(0)).current;

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [status, setStatus] =
    useState<Status>("idle");

  const [transcript, setTranscript] =
    useState("");

  const [reply, setReply] =
    useState("");

  const [displayedReply, setDisplayedReply] =
    useState("");

  const [intent, setIntent] =
    useState<string | null>(null);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [waveIndex, setWaveIndex] =
    useState(0);

  const [audioUri, setAudioUri] =
    useState<string | null>(null);

  const lastRecognizedTextRef =
    useRef("");

  /* -------------------------------------------------------
     AUDIO PLAYER (EXPO-AUDIO)
  ------------------------------------------------------- */

  const player = useAudioPlayer(audioUri);

  /* -------------------------------------------------------
     DERIVED STATE
  ------------------------------------------------------- */

  const isRecording =
    status === "recording";

  const isSpeaking =
    status === "speaking";

  const isBusy =
    status !== "idle" &&
    status !== "error";

  /* =========================================================
     NATIVE SPEECH RECOGNITION EVENTS
  ========================================================= */

  useSpeechRecognitionEvent("start", () => {
    console.log("[VoiceTab] Native speech recognition started");
    setStatus("recording");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript?.trim() || "";
    if (!text) return;

    setTranscript(text);

    if (event.isFinal) {
      if (text.toLowerCase() === lastRecognizedTextRef.current.toLowerCase()) {
        return;
      }

      lastRecognizedTextRef.current = text;
      console.log("[VoiceTab] Native transcript:", text);
      void processAI(text);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    // Android can emit "no-speech" when a recognition session ends
    // normally or when the user stops listening. Do not treat that as
    // an app error or speak an error message over the UI.
    if (event.error === "no-speech") {
      console.log("[VoiceTab] Native speech ended without speech.");
      setStatus((current) =>
        current === "recording" ? "idle" : current
      );
      return;
    }

    console.error("[VoiceTab] Native speech error:", event.error, event.message);
    setStatus("error");

    const message =
      event.error === "not-allowed"
        ? "Microphone or speech recognition permission was denied."
        : "Speech recognition failed. Please try again.";

    setReply(message);
    Speech.speak(message, { language: "en-US", rate: 0.95 });
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("[VoiceTab] Native speech recognition ended");
    setStatus((current) => current === "recording" ? "idle" : current);
  });

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
   return () => {
  Speech.stop();
  try {
    ExpoSpeechRecognitionModule.abort();
  } catch (_) {}
  try {
    // Check if player exists and try to pause it
    if (player && player.playing) {
      player.pause();
    }
  } catch (error) {
    // Agar player pehle hi release/destroy ho chuka hai, toh error ignore karein
    console.log("[VoiceTab] Player already released, skipping pause.");
  }
};
  }, [player]);

  /* =========================================================
     STOP ALL AUDIO / TTS
  ========================================================= */

  const stopAudioAndSpeech = async () => {
    try {
      await Speech.stop();
      if (player.playing) {
        player.pause();
      }
    } catch (e) {
      console.warn("[VoiceTab] Error stopping audio/speech:", e);
    }
  };

  /* =========================================================
     ORB ANIMATION
  ========================================================= */

  useEffect(() => {
    if (isRecording || isBusy) {
      const pulseLoop =
        Animated.loop(
          Animated.sequence([
            Animated.timing(
              pulseAnim,
              {
                toValue: 1.25,
                duration: 800,
                easing: Easing.ease,
                useNativeDriver: true,
              }
            ),

            Animated.timing(
              pulseAnim,
              {
                toValue: 0.95,
                duration: 800,
                easing: Easing.ease,
                useNativeDriver: true,
              }
            ),
          ])
        );

      const rotateLoop =
        Animated.loop(
          Animated.timing(
            rotateAnim,
            {
              toValue: 1,
              duration: 2500,
              easing: Easing.linear,
              useNativeDriver: true,
            }
          )
        );

      pulseLoop.start();
      rotateLoop.start();

      return () => {
        pulseLoop.stop();
        rotateLoop.stop();
      };
    }

    Animated.timing(
      pulseAnim,
      {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }
    ).start();

    rotateAnim.setValue(0);
  }, [
    isRecording,
    isBusy,
    pulseAnim,
    rotateAnim,
  ]);

  /* =========================================================
     ROTATION
  ========================================================= */

  const spin =
    rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        "0deg",
        "360deg",
      ],
    });

  /* =========================================================
     WAVE ANIMATION
  ========================================================= */

  useEffect(() => {
    if (!isRecording) {
      setWaveIndex(0);
      return;
    }

    const interval =
      setInterval(() => {
        setWaveIndex(
          (prev) =>
            (prev + 1) %
            WAVE_FRAMES.length
        );
      }, 200);

    return () =>
      clearInterval(interval);
  }, [isRecording]);

  /* =========================================================
     TYPING EFFECT
  ========================================================= */

  useEffect(() => {
    if (!reply) {
      setDisplayedReply("");
      return;
    }

    let currentIndex = 0;

    setDisplayedReply("");

    const typingInterval =
      setInterval(() => {
        if (
          currentIndex <
          reply.length
        ) {
          setDisplayedReply(
            reply.slice(
              0,
              currentIndex + 1
            )
          );

          currentIndex++;
        } else {
          clearInterval(
            typingInterval
          );
        }
      }, 20);

    return () =>
      clearInterval(
        typingInterval
      );
  }, [reply]);

  /* =========================================================
     TEXT CLEANER FOR TTS
  ========================================================= */

  const cleanTextForSpeech = (
    rawText: string
  ): string => {
    return rawText
      .replace(/[*#_~`>-]/g, "")
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();
  };

  const getSpeechLanguage = (text: string): string => {
    // Hindi Devanagari detected -> Hindi voice
    if (/[\u0900-\u097F]/.test(text)) {
      return "hi-IN";
    }

    // English / Hinglish -> Indian English voice
    return "en-IN";
  };

  /* =========================================================
     START VOICE
  ========================================================= */

  /* =========================================================
     START VOICE — NATIVE SPEECH RECOGNITION
  ========================================================= */

  const startVoice = async () => {
    try {
      await stopAudioAndSpeech();

      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        const message = "Microphone and speech recognition permission is required.";
        setReply(message);
        setStatus("error");
        Speech.speak(message, { language: "en-US", rate: 0.95 });
        return;
      }

      const available =
        await ExpoSpeechRecognitionModule.isRecognitionAvailable();

      if (!available) {
        const message = "Speech recognition is not available on this device.";
        setReply(message);
        setStatus("error");
        Speech.speak(message, { language: "en-US", rate: 0.95 });
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setTranscript("");
      setReply("");
      setDisplayedReply("");
      setIntent(null);
      lastRecognizedTextRef.current = "";
      setStatus("recording");

      ExpoSpeechRecognitionModule.start({
        lang: "hi-IN",
        interimResults: false,
        continuous: false,
      });

      console.log("[VoiceTab] Native speech recognition requested.");
    } catch (error) {
      console.error("[VoiceTab] Start voice error:", error);
      setStatus("error");
      setReply("Unable to start speech recognition.");
    }
  };

  /* =========================================================
     STOP VOICE
  ========================================================= */

  const stopVoice = async () => {
    try {
      console.log("[VoiceTab] Stopping native speech recognition...");
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error("[VoiceTab] Stop voice error:", error);
      setStatus("error");
    }
  };

  /* =========================================================
     STOP SPEAKING ON PRESS
  ========================================================= */

  const stopSpeaking = async () => {
    await stopAudioAndSpeech();
    setStatus("idle");
  };

  /* =========================================================
     PROCESS AI


  /* =========================================================
     OPEN IN-APP MAP NAVIGATION
     ========================================================= */

  const goToMapNavigation = (destination: string) => {
    const place = destination.trim();

    if (!place) {
      console.log("[VoiceTab] No destination provided.");
      return;
    }

    console.log("[VoiceTab] Opening in-app map:", place);

    router.push({
      pathname: "/(tabs)/map",
      params: {
        destination: place,
        autoStart: "true",
      },
    });
  };

  /* =========================================================
     VOICE COMMAND NORMALIZER
     ========================================================= */

  const normalizeVoiceCommand = (input: string): string => {
    let value = input
      .normalize("NFC")
      .replace(/[।！？]+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Speech recognition can return English phrases written/pronounced
    // through Hindi speech. Convert only the command prefix; keep the
    // destination exactly as spoken.
    const prefixRules: Array<[RegExp, string]> = [
      [/^गेट\s+डायरेक्शन\s+टू\s+/i, "navigate to "],
      [/^गेट\s+डायरेक्शन\s+/i, "navigate to "],
      [/^डायरेक्शन\s+टू\s+/i, "navigate to "],
      [/^नेविगेट\s+टू\s+/i, "navigate to "],
      [/^नेविगेट\s+/i, "navigate to "],
      [/^जाओ\s+/i, "go to "],
      [/^जाना\s+है\s+/i, "go to "],
    ];

    for (const [pattern, replacement] of prefixRules) {
      if (pattern.test(value)) {
        value = value.replace(pattern, replacement);
        break;
      }
    }

    return value.trim();
  };

  /* =========================================================
     LOCAL NAVIGATION COMMAND PARSER
     ========================================================= */

  const parseLocalNavigationCommand = (input: string): AIResult => {
    const original = input
      .normalize("NFC")
      .trim();

    const normalized = normalizeVoiceCommand(original);

    const text = normalized
      .toLowerCase()
      .replace(/[।,!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const originalLower = original
      .toLowerCase()
      .replace(/[।,!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const general: AIResult = {
      reply: "",
      intent: "general",
      destination: "",
      category: "",
    };

    if (!text) return general;

    const cleanDestination = (value: string): string =>
      value
        .trim()
        .replace(/^[\s,.-]+/, "")
        .replace(/[\s,.!?।]+$/g, "")
        .trim();

    const isSpecialDestination = (value: string): boolean =>
      /^(home|work|office|nearby|near me|nearest|घर|काम|ऑफिस|पास|पास में|नज़दीक|नजदीक|नजदीकी)$/i.test(
        value.trim()
      );

    // =========================================================
    // STOP / CANCEL NAVIGATION
    // =========================================================

    const stopNavigationPatterns = [
      "stop navigation",
      "cancel navigation",
      "navigation stop",
      "navigation band",
      "navigation bandh",
      "navigation band karo",
      "navigation bandh karo",
      "navigation rok do",
      "navigation roko",
      "stop route",
      "route stop",
      "रास्ता बंद करो",
      "रास्ता रोक दो",
      "नेविगेशन बंद करो",
      "नेविगेशन बंद कर दो",
      "नेविगेशन रोक दो",
      "नेविगेशन रोको",
      "नेविगेशन बंद",
      "रूट बंद करो",
    ];

    if (
      stopNavigationPatterns.some(
        (phrase) =>
          originalLower.includes(phrase) ||
          text.includes(phrase)
      )
    ) {
      return {
        ...general,
        reply: "Navigation cancelled.",
        intent: "cancel_navigation",
      };
    }

    // =========================================================
    // HOME
    // =========================================================

    const homePatterns = [
      /\b(go|take me|navigate|start|drive|route)\s+(to\s+)?home\b/i,
      /\b(home)\s+(go|chalo|jao|jana|le chalo|le jao)\b/i,
      /घर चलो/i,
      /घर जाओ/i,
      /घर जाना है/i,
      /मुझे घर ले चलो/i,
      /मुझे घर ले जाओ/i,
      /घर ले चलो/i,
      /घर ले जाओ/i,
      /ghar chalo/i,
      /ghar jao/i,
      /ghar jana hai/i,
      /mujhe ghar le chalo/i,
      /mujhe ghar le jao/i,
    ];

    if (homePatterns.some((pattern) => pattern.test(original))) {
      return {
        ...general,
        reply: "Opening the route to Home.",
        intent: "navigate_home",
      };
    }

    // =========================================================
    // WORK / OFFICE
    // =========================================================

    const workPatterns = [
      /\b(go|take me|navigate|start|drive|route)\s+(to\s+)?(work|office)\b/i,
      /\b(work|office)\s+(go|chalo|jao|jana|le chalo|le jao)\b/i,
      /काम पर चलो/i,
      /काम पर जाओ/i,
      /काम पर जाना है/i,
      /ऑफिस चलो/i,
      /ऑफिस जाओ/i,
      /ऑफिस जाना है/i,
      /मुझे ऑफिस ले चलो/i,
      /मुझे ऑफिस ले जाओ/i,
      /kaam par chalo/i,
      /kaam par jao/i,
      /kaam par jana hai/i,
      /office chalo/i,
      /office jao/i,
      /office jana hai/i,
      /mujhe office le chalo/i,
      /mujhe office le jao/i,
    ];

    if (workPatterns.some((pattern) => pattern.test(original))) {
      return {
        ...general,
        reply: "Opening the route to Work.",
        intent: "navigate_work",
      };
    }

    // =========================================================
    // NEARBY SEARCH
    // =========================================================

    const nearby: Array<[string, RegExp[]]> = [
      [
        "hospital",
        [
          /\b(hospital|hospitals|aspataal|aspatal)\b/i,
          /अस्पताल/i,
          /हॉस्पिटल/i,
        ],
      ],
      [
        "petrol pump",
        [
          /\b(petrol pump|petrol|fuel|gas station)\b/i,
          /पेट्रोल पंप/i,
          /पेट्रोल पम्प/i,
          /पेट्रोल/i,
        ],
      ],
      [
        "restaurant",
        [
          /\b(restaurant|restaurants|food|eatery)\b/i,
          /रेस्टोरेंट/i,
          /रेस्तरां/i,
          /खाना/i,
        ],
      ],
      [
        "ATM",
        [
          /\b(atm|cash machine)\b/i,
          /एटीएम/i,
          /कैश मशीन/i,
        ],
      ],
      [
        "police",
        [
          /\b(police|police station)\b/i,
          /पुलिस/i,
          /थाना/i,
          /पुलिस स्टेशन/i,
        ],
      ],
    ];

    const nearbyWords = [
      "near",
      "nearby",
      "nearest",
      "near me",
      "close to me",
      "closest",
      "paas",
      "paas mein",
      "paas ka",
      "paas ki",
      "nazdeek",
      "najdik",
      "najdeek",
      "sabse paas",
      "sabse nazdeek",
      "find",
      "search",
      "dhundo",
      "dhundho",
      "dhoondo",
      "ढूंढो",
      "ढूँढो",
      "ढूंढना",
      "खोजो",
      "खोजिए",
      "पास",
      "पास में",
      "पास का",
      "पास की",
      "नज़दीक",
      "नजदीक",
      "नजदीकी",
      "निकटतम",
      "करीब",
      "सबसे पास",
      "सबसे नज़दीक",
    ];

    for (const [category, patterns] of nearby) {
      const hasCategory = patterns.some(
        (pattern) => pattern.test(original) || pattern.test(normalized)
      );

      const hasNearbyWord = nearbyWords.some(
        (word) =>
          originalLower.includes(word.toLowerCase()) ||
          text.includes(word.toLowerCase())
      );

      if (hasCategory && hasNearbyWord) {
        const spoken =
          category === "petrol pump"
            ? "petrol pump"
            : category.toLowerCase();

        return {
          ...general,
          reply: `Finding the nearest ${spoken}.`,
          intent: "nearby_search",
          category,
        };
      }
    }

    // =========================================================
    // TRAFFIC / WEATHER / MUSIC / CALL / EMERGENCY
    // =========================================================

    if (
      /\\btraffic\\b/i.test(text) ||
      /ट्रैफिक|यातायात/i.test(original) ||
      /traffic.*batao|traffic.*kaisa/i.test(text)
    ) {
      return {
        ...general,
        reply:
          "Live traffic information needs a traffic data service.",
        intent: "traffic",
      };
    }

    if (
      /\\bweather\\b/i.test(text) ||
      /मौसम/i.test(original) ||
      /mausam/i.test(text)
    ) {
      return {
        ...general,
        reply:
          "Live weather information needs a weather service.",
        intent: "weather",
      };
    }

    if (
      /play music|music chalao|gaana chalao/i.test(text) ||
      /गाना चलाओ|म्यूजिक चलाओ/i.test(original)
    ) {
      return {
        ...general,
        reply: "Opening music controls.",
        intent: "music",
      };
    }

    if (
      /emergency|sos/i.test(text) ||
      /आपातकाल|मदद चाहिए/i.test(original)
    ) {
      return {
        ...general,
        reply:
          "Emergency mode requested. Please confirm before contacting your emergency contact.",
        intent: "emergency",
      };
    }

    const callMatch =
      text.match(/^(?:call|phone|dial)\\s+(.+)$/i) ||
      original.match(
        /^(?:mujhe|mujhko)\\s+(.+?)\\s+ko\\s+call\\s+karna\\s+hai$/i
      );

    if (callMatch?.[1]) {
      return {
        ...general,
        reply: `Preparing a call to ${callMatch[1].trim()}.`,
        intent: "call",
        destination: callMatch[1].trim(),
      };
    }

    // =========================================================
    // DIRECT NAVIGATION
    // =========================================================
    // Handles:
    // navigate to Delhi
    // नेविगेट टू अशोक नगर
    // गेट डायरेक्शन टू न्यू सनराइज नर्सिंग होम
    // get directions to Delhi
    // directions to Delhi
    // route to Delhi

    const directNavigationPatterns = [
      /^(?:please\s+)?(?:start\s+)?(?:navigation|navigate|go|take me|drive|route)\s+(?:to\s+)?(.+)$/i,
      /^(?:please\s+)?get\s+(?:the\s+)?directions?\s+to\s+(.+)$/i,
      /^(?:please\s+)?give\s+(?:me\s+)?directions?\s+to\s+(.+)$/i,
      /^(?:please\s+)?directions?\s+to\s+(.+)$/i,
      /^(?:please\s+)?navigate\s+to\s+(.+)$/i,
      /^गेट\s+डायरेक्शन\s+टू\s+(.+)$/i,
      /^गेट\s+डायरेक्शन\s+(.+)$/i,
      /^डायरेक्शन\s+टू\s+(.+)$/i,
      /^नेविगेट\s+टू\s+(.+)$/i,
      /^नेविगेट\s+(.+)$/i,
      /^दिशा\s+बताओ\s+(.+)$/i,
      /^रास्ता\s+बताओ\s+(.+)$/i,
    ];

    for (const pattern of directNavigationPatterns) {
      const match = text.match(pattern);
      if (!match?.[1]) continue;

      const destination = cleanDestination(match[1]);

      if (destination && !isSpecialDestination(destination)) {
        const isHindi =
          /[\u0900-\u097F]/.test(destination);

        return {
          ...general,
          reply: isHindi
            ? `${destination} के लिए रास्ता खोल रहा हूँ।`
            : `Opening the route to ${destination}.`,
          intent: "navigate",
          destination,
        };
      }
    }

    // =========================================================
    // HINGLISH NAVIGATION
    // =========================================================
    // mujhe Delhi le chalo
    // Delhi chalo
    // Delhi jao
    // Delhi jana hai
    // mujhe Delhi jana hai

    let match =
      original.match(
        /^(?:mujhe|mujhko)\s+(.+?)\s+(?:le chalo|le jao|le jaana|le jana)$/i
      ) ||
      original.match(
        /^(.+?)\s+(?:chalo|jao|jana hai|jaana hai|le chalo|le jao)$/i
      ) ||
      original.match(
        /^(?:mujhe|mujhko)\s+(.+?)\s+(?:jana hai|jaana hai)$/i
      );

    if (match?.[1]) {
      const destination = cleanDestination(match[1]);

      if (
        destination &&
        !isSpecialDestination(destination)
      ) {
        return {
          ...general,
          reply: `Opening the route to ${destination}.`,
          intent: "navigate",
          destination,
        };
      }
    }

    // =========================================================
    // HINDI SCRIPT NAVIGATION
    // =========================================================
    // मुझे दिल्ली ले चलो
    // दिल्ली चलो
    // दिल्ली जाओ
    // दिल्ली जाना है
    // मुझे दिल्ली जाना है

    match =
      original.match(
        /^(?:मुझे|मुझको)\s+(.+?)\s+(?:ले चलो|ले जाओ|ले जाना)$/i
      ) ||
      original.match(
        /^(.+?)\s+(?:चलो|जाओ|जाना है|ले चलो|ले जाओ)$/i
      ) ||
      original.match(
        /^(?:मुझे|मुझको)\s+(.+?)\s+(?:जाना है)$/i
      );

    if (match?.[1]) {
      const destination = cleanDestination(match[1]);

      if (
        destination &&
        !isSpecialDestination(destination)
      ) {
        return {
          ...general,
          reply: `${destination} के लिए रास्ता खोल रहा हूँ।`,
          intent: "navigate",
          destination,
        };
      }
    }

    // =========================================================
    // FALLBACK: "I WANT TO GO TO..."
    // =========================================================

    match =
      original.match(
        /^(?:i want to go to|i want to visit|i need to go to|take me to)\s+(.+)$/i
      );

    if (match?.[1]) {
      const destination = cleanDestination(match[1]);

      if (destination && !isSpecialDestination(destination)) {
        return {
          ...general,
          reply: `Opening the route to ${destination}.`,
          intent: "navigate",
          destination,
        };
      }
    }

    return general;
  };

  /* =========================================================
     FIREBASE VOICE HISTORY
  ========================================================= */

  const saveVoiceHistory = async (
    question: string,
    answer: string,
    commandIntent?: string,
    destination?: string,
    category?: string
  ) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return;
    }

    try {
      await addDoc(
        collection(
          db,
          "users",
          currentUser.uid,
          "history"
        ),
        {
          title:
            destination ||
            category ||
            question,
          subtitle:
            commandIntent === "navigate"
              ? "Voice navigation"
              : commandIntent === "nearby_search"
                ? "Nearby search"
                : "Voice command",
          destination:
            destination || "",
          category:
            category || "",
          type:
            commandIntent === "navigate" ||
            commandIntent === "navigate_home" ||
            commandIntent === "navigate_work"
              ? "route"
              : "search",
          question,
          answer,
          intent:
            commandIntent || "general",
          createdAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      // History must never break the voice command.
      console.warn(
        "[VoiceTab] Firebase history save failed:",
        error
      );
    }
  };

  const processAI = async (
    text: string
  ) => {
    if (!text?.trim()) {
      setStatus("idle");
      return;
    }

    try {
      /* Stop any previous speech / audio playback */
      await stopAudioAndSpeech();

      setTranscript(text);

      const normalizedText = normalizeVoiceCommand(text);

      console.log("[VoiceTab] Original command:", text);
      console.log("[VoiceTab] Normalized command:", normalizedText);

      // Try deterministic local parsing first. This prevents simple
      // navigation commands from depending on the AI/network.
      let localResult = parseLocalNavigationCommand(text);

      if (localResult.intent === "general" && normalizedText !== text) {
        localResult = parseLocalNavigationCommand(normalizedText);
      }

      if (localResult.intent !== "general") {
        console.log("[VoiceTab] Local navigation result:", localResult);

        setIntent(localResult.intent);
        setReply(localResult.reply);
        setStatus("speaking");

        Speech.speak(cleanTextForSpeech(localResult.reply), {
          language: getSpeechLanguage(localResult.reply),
          rate: 0.95,
          onDone: () => setStatus("idle"),
          onStopped: () => setStatus("idle"),
        });

        switch (localResult.intent) {
          case "navigate":
            if (localResult.destination) goToMapNavigation(localResult.destination);
            break;
          case "nearby_search":
            if (localResult.category) goToMapNavigation(localResult.category);
            break;
          case "navigate_home":
            goToMapNavigation("Home");
            break;
          case "navigate_work":
            goToMapNavigation("Work");
            break;
          case "cancel_navigation":
            await stopNavigation();
            break;

          case "traffic":
          case "weather":
          case "music":
          case "call":
          case "emergency":
            // These intents are intentionally surfaced to the user.
            // Connect the corresponding service/action here.
            break;
        }

        setHistory((previous) => [
          {
            id: Date.now().toString(),
            question: text,
            answer: localResult.reply,
            intent: localResult.intent,
          },
          ...previous,
        ]);

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        return;
      }

      setStatus("thinking");

      console.log(
        "[VoiceTab] Sending text to AI:",
        text
      );

      const result: AIResult =
        await askAI(text);

      console.log(
        "[VoiceTab] AI result:",
        result
      );

      /* -----------------------------------------------------
         Validate AI result
      ----------------------------------------------------- */

      if (
        !result ||
        !result.reply
      ) {
        throw new Error(
          "AI returned an empty response."
        );
      }

      if (
        result.intent === "error"
      ) {
        setReply(result.reply);
        setStatus("error");

        try {
          await Speech.speak(
            cleanTextForSpeech(
              result.reply
            )
          );
        } catch (_) {}

        return;
      }

      /* -----------------------------------------------------
         Update UI
      ----------------------------------------------------- */

      setIntent(
        result.intent ?? null
      );

      setReply(
        result.reply
      );

      setStatus("speaking");

      /* -----------------------------------------------------
         AUDIO RESPONSE (EXPO-AUDIO) OR TTS (EXPO-SPEECH)
      ----------------------------------------------------- */

      const audioUrl = (result as any)?.audioUrl || (result as any)?.audio;

      if (audioUrl) {
        console.log("[VoiceTab] Playing AI audio response via expo-audio:", audioUrl);
        setAudioUri(audioUrl);
        player.replace({ uri: audioUrl });
        player.play();
      } else {
        const cleanedReply =
          cleanTextForSpeech(
            result.reply
          );

        const spokenText =
          cleanedReply.length > 300
            ? cleanedReply.slice(
                0,
                300
              ) +
              "... Please read the full answer on screen."
            : cleanedReply;

        console.log(
          "[VoiceTab] Speaking:",
          spokenText
        );

        Speech.speak(
          spokenText,
          {
            language: getSpeechLanguage(spokenText),
            pitch: 1,
            rate: 0.95,

            onDone: () => {
              console.log(
                "[VoiceTab] Speech completed"
              );

              setStatus("idle");
            },

            onStopped: () => {
              console.log(
                "[VoiceTab] Speech stopped"
              );

              setStatus("idle");
            },

            onError: (error) => {
              console.error(
                "[VoiceTab] Speech error:",
                error
              );

              setStatus("idle");
            },
          }
        );
      }

      /* -----------------------------------------------------
         Navigation / Nearby Actions
      ----------------------------------------------------- */

      switch (
        result.intent
      ) {
        case "navigate":
          if (result.destination) {
            goToMapNavigation(result.destination);
          }
          break;

        case "nearby_search":
          if (result.category) {
            goToMapNavigation(result.category);
          }
          break;

        case "navigate_home":
          goToMapNavigation("Home");
          break;

        case "navigate_work":
          goToMapNavigation("Work");
          break;

        case "cancel_navigation":
          await stopNavigation();
          break;

        case "traffic":
        case "weather":
        case "music":
        case "call":
        case "emergency":
          // Service/action integration can be attached here.
          break;

        default:
          break;
      }

      /* -----------------------------------------------------
         Haptic success
      ----------------------------------------------------- */

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      /* -----------------------------------------------------
         History
      ----------------------------------------------------- */

      setHistory((previous) => [
        {
          id: Date.now().toString(),
          question: text,
          answer: result.reply,
          intent: result.intent,
        },
        ...previous,
      ]);

      await saveVoiceHistory(
        text,
        result.reply,
        result.intent,
        result.destination,
        result.category
      );
    } catch (error) {
      console.error(
        "[VoiceTab] AI Error:",
        error
      );

      await stopAudioAndSpeech();

      const errorMessage =
        "Sorry. Something went wrong while processing your request.";

      setReply(
        errorMessage
      );

      setStatus("error");

      Speech.speak(
        errorMessage
      );

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
    }
  };

  /* =========================================================
     QUICK COMMAND
  ========================================================= */

  const handleChipPress = async (
    prompt: string
  ) => {
    if (isBusy) {
      return;
    }

    try {
      setTranscript(prompt);

      await processAI(
        prompt
      );
    } catch (error) {
      console.error(
        "[VoiceTab] Quick command error:",
        error
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  const wave =
    WAVE_FRAMES[waveIndex];

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <LinearGradient
        colors={[
          "#050505",
          "#0B0B12",
          "#030305",
        ]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View
            style={styles.header}
          >
            <View>
              <Text
                style={
                  styles.title
                }
              >
                Smart Voice
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Your AI navigation assistant
              </Text>
            </View>

            <View
              style={
                styles.statusDot
              }
            />
          </View>

          {/* =================================================
              STATUS
          ================================================= */}

          <View
            style={
              styles.statusContainer
            }
          >
            {status ===
              "thinking" ||
            status ===
              "transcribing" ||
            status ===
              "uploading" ? (
              <ActivityIndicator
                size="small"
              />
            ) : null}

            <Text
              style={
                styles.statusText
              }
            >
              {
                STATUS_LABEL[
                  status
                ]
              }
            </Text>
          </View>

          {/* =================================================
              SIRI ORB
          ================================================= */}

          <View
            style={
              styles.orbArea
            }
          >
            {/* Outer glow */}

            <Animated.View
              style={[
                styles.glowOuter,
                {
                  transform: [
                    {
                      scale:
                        pulseAnim,
                    },
                  ],
                },
              ]}
            />

            {/* Rotating ring */}

            <Animated.View
              style={[
                styles.rotatingRing,
                {
                  transform: [
                    {
                      rotate: spin,
                    },
                  ],
                },
              ]}
            />

            {/* Orb button */}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                isSpeaking
                  ? stopSpeaking
                  : isRecording
                  ? stopVoice
                  : startVoice
              }
              disabled={
                status === "thinking" ||
                status === "transcribing" ||
                status === "uploading"
              }
              style={
                styles.orbButton
              }
            >
              <LinearGradient
                colors={[
                  "#6C5CE7",
                  "#8B5CF6",
                  "#EC4899",
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={
                  styles.orbGradient
                }
              >
                <Ionicons
                  name={
                    isSpeaking
                      ? "volume-mute"
                      : isRecording
                      ? "stop"
                      : "mic"
                  }
                  size={42}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* =================================================
              WAVEFORM
          ================================================= */}

          {isRecording && (
            <View
              style={
                styles.waveContainer
              }
            >
              {wave.map(
                (
                  height,
                  index
                ) => (
                  <View
                    key={index}
                    style={[
                      styles.waveBar,
                      {
                        height,
                      },
                    ]}
                  />
                )
              )}
            </View>
          )}

          {/* =================================================
              YOU SAID
          ================================================= */}

          {transcript ? (
            <View
              style={
                styles.card
              }
            >
              <View
                style={
                  styles.cardHeader
                }
              >
                <Ionicons
                  name="person"
                  size={18}
                  color="#8B5CF6"
                />

                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  YOU SAID
                </Text>
              </View>

              <Text
                style={
                  styles.transcriptText
                }
              >
                {transcript}
              </Text>
            </View>
          ) : null}

          {/* =================================================
              AI RESPONSE
          ================================================= */}

          {reply ? (
            <View
              style={
                styles.card
              }
            >
              <View
                style={
                  styles.cardHeader
                }
              >
                <Ionicons
                  name="sparkles"
                  size={18}
                  color="#EC4899"
                />

                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  AI REPLY
                </Text>
              </View>

              <Text
                style={
                  styles.replyText
                }
              >
                {displayedReply}
              </Text>

              {intent ? (
                <View
                  style={
                    styles.intentBadge
                  }
                >
                  <Text
                    style={
                      styles.intentText
                    }
                  >
                    {intent}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* =================================================
              QUICK COMMANDS
          ================================================= */}

          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Quick Commands
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.chipContainer
              }
            >
              {COMMAND_CHIPS.map(
                (item) => (
                  <TouchableOpacity
                    key={
                      item.label
                    }
                    style={
                      styles.chip
                    }
                    disabled={
                      isBusy
                    }
                    onPress={() =>
                      handleChipPress(
                        item.prompt
                      )
                    }
                    activeOpacity={
                      0.8
                    }
                  >
                    <Text
                      style={
                        styles.chipText
                      }
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>

          {/* =================================================
              HISTORY
          ================================================= */}

          {history.length >
            0 && (
            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Recent Conversations
              </Text>

              {history
                .slice(0, 5)
                .map(
                  (item) => (
                    <View
                      key={
                        item.id
                      }
                      style={
                        styles.historyCard
                      }
                    >
                      <Text
                        style={
                          styles.historyQuestion
                        }
                      >
                        {item.question}
                      </Text>

                      <Text
                        style={
                          styles.historyAnswer
                        }
                        numberOfLines={
                          3
                        }
                      >
                        {item.answer}
                      </Text>
                    </View>
                  )
                )}
            </View>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <View
            style={
              styles.footer
            }
          >
            <Ionicons
              name="shield-checkmark"
              size={15}
              color="#777"
            />

            <Text
              style={
                styles.footerText
              }
            >
              Voice assistant ready
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* HEADER */

  header: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    color: "#8E8E99",
    fontSize: 13,
    marginTop: 4,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34D399",
  },

  /* STATUS */

  statusContainer: {
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  statusText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
  },

  /* ORB */

  orbArea: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  glowOuter: {
    position: "absolute",
    width: 205,
    height: 205,
    borderRadius: 103,
    backgroundColor:
      "rgba(139,92,246,0.15)",
  },

  rotatingRing: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor:
      "rgba(236,72,153,0.45)",
    borderTopColor:
      "rgba(139,92,246,0.9)",
  },

  orbButton: {
    width: 145,
    height: 145,
    borderRadius: 73,
    overflow: "hidden",
    elevation: 20,
    shadowOpacity: 0.4,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },

  orbGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* WAVE */

  waveContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: -15,
    marginBottom: 15,
  },

  waveBar: {
    width: 5,
    borderRadius: 5,
    backgroundColor: "#8B5CF6",
  },

  /* CARDS */

  card: {
    backgroundColor:
      "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
    borderRadius: 22,
    padding: 18,
    marginTop: 15,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  cardTitle: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  transcriptText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
  },

  replyText: {
    color: "#E4E4E7",
    fontSize: 16,
    lineHeight: 25,
  },

  intentBadge: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor:
      "rgba(139,92,246,0.18)",
  },

  intentText: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "700",
  },

  /* SECTION */

  section: {
    marginTop: 28,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },

  /* CHIPS */

  chipContainer: {
    gap: 10,
    paddingRight: 10,
  },

  chip: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
  },

  chipText: {
    color: "#E4E4E7",
    fontSize: 13,
    fontWeight: "600",
  },

  /* HISTORY */

  historyCard: {
    backgroundColor:
      "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.07)",
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
  },

  historyQuestion: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
  },

  historyAnswer: {
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 20,
  },

  /* FOOTER */

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 30,
  },

  footerText: {
    color: "#666",
    fontSize: 11,
  },
});