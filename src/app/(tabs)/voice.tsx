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
    console.error("[VoiceTab] Native speech error:", event.error, event.message);
    setStatus("error");

    const message =
      event.error === "not-allowed"
        ? "Microphone or speech recognition permission was denied."
        : event.error === "no-speech"
          ? "No speech was detected. Please try again."
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
        lang: "en-IN",
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
     LOCAL NAVIGATION COMMAND PARSER
     ========================================================= */

  const parseLocalNavigationCommand = (input: string): AIResult => {
    const original = input.trim();
    const text = original.toLowerCase();
    const general: AIResult = {
      reply: "",
      intent: "general",
      destination: "",
      category: "",
    };

    if (!text) return general;

    if (text.includes("cancel navigation") || text.includes("stop navigation")) {
      return { ...general, reply: "Navigation cancelled.", intent: "cancel_navigation" };
    }

    if (/\b(go|take me|navigate|start).*(home)\b/i.test(text)) {
      return { ...general, reply: "Opening the route to Home.", intent: "navigate_home" };
    }

    if (/\b(go|take me|navigate|start).*(work)\b/i.test(text)) {
      return { ...general, reply: "Opening the route to Work.", intent: "navigate_work" };
    }

    const nearby: Array<[string, RegExp]> = [
      ["hospital", /\b(hospital|hospitals|aspataal)\b.*(near|nearby|nearest|near me|paas|nazdeek|najdik)?|(near|nearby|nearest|near me|paas|nazdeek|najdik).*\b(hospital|hospitals|aspataal)\b/i],
      ["petrol pump", /\b(petrol pump|petrol|fuel|gas station)\b.*(near|nearby|nearest|near me|paas|nazdeek)?|(near|nearby|nearest|near me|paas|nazdeek|najdik).*\b(petrol pump|petrol|fuel|gas station)\b/i],
      ["restaurant", /\b(restaurant|restaurants|food)\b.*(near|nearby|nearest|near me|paas|nazdeek)?|(near|nearby|nearest|near me|paas|nazdeek|najdik).*\b(restaurant|restaurants|food)\b/i],
      ["ATM", /\b(atm|cash machine)\b.*(near|nearby|nearest|near me|paas|nazdeek)?|(near|nearby|nearest|near me|paas|nazdeek|najdik).*\b(atm|cash machine)\b/i],
      ["police", /\b(police|police station)\b.*(near|nearby|nearest|near me|paas|nazdeek)?|(near|nearby|nearest|near me|paas|nazdeek|najdik).*\b(police|police station)\b/i],
    ];

    for (const [category, regex] of nearby) {
      if (regex.test(text)) {
        const spoken = category === "petrol pump" ? "petrol pump" : category.toLowerCase();
        return { ...general, reply: `Finding the nearest ${spoken}.`, intent: "nearby_search", category };
      }
    }

    // Direct navigation phrases such as:
    // "start navigation to Panipat"
    // "navigation to Delhi"
    // "navigate to India Gate"
    // "go to Meerut"
    // "take me to Panipat"
    const match =
      original.match(
        /^(?:please\s+)?(?:start\s+navigation|navigation|navigate|go|take me|drive|route|start)\s+(?:to\s+)?(.+)$/i
      ) ||
      original.match(
        /^(?:mujhe|mujhko)\s+(.+?)\s+(?:le chalo|le jao|jana hai)$/i
      );

    if (match?.[1]) {
      const destination = match[1]
        .trim()
        .replace(/[.!?]+$/, "");

      if (
        destination &&
        !/^(home|work|nearby|near me|nearest)$/i.test(
          destination
        )
      ) {
        return {
          ...general,
          reply:
            `Opening the route to ${destination}.`,
          intent: "navigate",
          destination,
        };
      }
    }

    return general;
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

      const localResult = parseLocalNavigationCommand(text);

      if (localResult.intent !== "general") {
        console.log("[VoiceTab] Local navigation result:", localResult);

        setIntent(localResult.intent);
        setReply(localResult.reply);
        setStatus("speaking");

        Speech.speak(cleanTextForSpeech(localResult.reply), {
          language: "en-US",
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
            language: "en-US",
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

      setHistory(
        (previous) => [
          {
            id:
              Date.now().toString(),

            question: text,

            answer:
              result.reply,

            intent:
              result.intent,
          },

          ...previous,
        ]
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
                isBusy &&
                !isRecording &&
                !isSpeaking
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