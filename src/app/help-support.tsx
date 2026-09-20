import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HelpSupport() {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111827"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Help & Support
        </Text>

        <View style={{ width: 28 }} />

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* INTRO */}

        <View style={styles.introCard}>

          <View style={styles.introIcon}>
            <Ionicons
              name="help-circle"
              size={38}
              color="#2874F0"
            />
          </View>

          <Text style={styles.introTitle}>
            How can we help?
          </Text>

          <Text style={styles.introText}>
            Find answers to common problems
            and learn how to use
            SmartVoiceNavigation.
          </Text>

        </View>

        {/* NAVIGATION HELP */}

        <HelpCard
          icon="navigate-outline"
          title="Navigation Help"
          description="Make sure GPS and location permission are enabled before starting navigation."
        />

        {/* VOICE ASSISTANT */}

        <HelpCard
          icon="mic-outline"
          title="Voice Assistant"
          description="Use voice commands to search destinations and control navigation hands-free."
        />

        {/* LOCATION */}

        <HelpCard
          icon="location-outline"
          title="Location Permission"
          description="If navigation cannot find your location, check that location permission is enabled for the app."
        />

        {/* PROFILE */}

        <HelpCard
          icon="person-outline"
          title="Profile & Account"
          description="You can update your name, phone number, profile photo and other personal details from your Profile."
        />

        {/* EMERGENCY */}

        <HelpCard
          icon="shield-checkmark-outline"
          title="Emergency Contacts"
          description="Add trusted contacts from Emergency Contacts so they can be used during an emergency."
        />

        {/* SUPPORT */}

        <View style={styles.supportCard}>

          <View style={styles.supportIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={27}
              color="#2874F0"
            />
          </View>

          <View style={styles.supportContent}>

            <Text style={styles.supportTitle}>
              Need More Help?
            </Text>

            <Text style={styles.supportText}>
              If you are still facing a problem,
              please contact our support team.
            </Text>

          </View>

        </View>

        {/* APP VERSION */}

        <Text style={styles.version}>
          SmartVoiceNavigation • Version 1.0.0
        </Text>

      </ScrollView>

    </SafeAreaView>
  );
}

// ==========================================
// HELP CARD
// ==========================================

function HelpCard({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>

      <View style={styles.cardIcon}>
        <Ionicons
          name={icon}
          size={25}
          color="#2874F0"
        />
      </View>

      <View style={styles.cardContent}>

        <Text style={styles.cardTitle}>
          {title}
        </Text>

        <Text style={styles.cardDescription}>
          {description}
        </Text>

      </View>

    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  header: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  introCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
    elevation: 2,
  },

  introIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 7,
  },

  introText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    elevation: 2,
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  cardContent: {
    flex: 1,
    marginLeft: 13,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
  },

  supportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    elevation: 2,
  },

  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  supportContent: {
    flex: 1,
    marginLeft: 13,
  },

  supportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 5,
  },

  supportText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
  },

  version: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 12,
    color: "#9CA3AF",
  },

});