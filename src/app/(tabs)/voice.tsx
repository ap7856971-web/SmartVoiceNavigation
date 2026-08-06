import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";

export default function VoiceScreen() {
    const scaleAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),

      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  ).start();
}, []);
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0F3D91", "#08244E", "#05172F"]}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons
              name="close"
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Listening...
        </Text>

        <Animated.View
  style={[
    styles.micOuter,
    {
        
      transform: [
        {
          scale: scaleAnim,
        },
      ],
    },
  ]}
>
  <View style={styles.micMiddle}>
    <TouchableOpacity style={styles.micButton}>
      <Ionicons
        name="mic"
        size={70}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  </View>
</Animated.View>

        {/* Wave Placeholder */}
        <Text style={styles.wave}>
          ▂▅▇▆▃▂▆▇▅▃▂▆▇
        </Text>

        {/* Commands */}
        <Text style={styles.tryText}>
          Try saying
        </Text>

        <Text style={styles.command}>
          "Navigate to India Gate"
        </Text>

        <Text style={styles.command}>
          "Find nearest hospital"
        </Text>

        <Text style={styles.command}>
          "Go to home"
        </Text>

        <Text style={styles.command}>
          "Cancel navigation"
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },

  header: {
    width: "100%",
    paddingHorizontal: 25,
  },

  title: {
    marginTop: 40,
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  micOuter: {
    marginTop: 55,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },

  micMiddle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  micButton: {
  width: 140,
  height: 140,
  borderRadius: 70,
  backgroundColor: "#2563EB",
  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#2563EB",
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowOpacity: 0.8,
  shadowRadius: 25,

  elevation: 12,
},

  wave: {
    marginTop: 45,
    fontSize: 34,
    color: "#60A5FA",
    fontWeight: "700",
    letterSpacing: 2,
  },

  tryText: {
    marginTop: 40,
    color: "#D1D5DB",
    fontSize: 20,
  },

  command: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 18,
  },
  
});