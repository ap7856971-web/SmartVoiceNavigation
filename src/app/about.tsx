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

export default function About() {
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

        <Text style={styles.headerTitle}>
          About Us
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* APP LOGO */}

        <View style={styles.logo}>
          <Ionicons
            name="navigate"
            size={42}
            color="#2874F0"
          />
        </View>

        {/* APP NAME */}

        <Text style={styles.appName}>
          SmartVoiceNavigation
        </Text>

        <Text style={styles.version}>
          Version 1.0.0
        </Text>

        {/* DESCRIPTION */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            About SmartVoiceNavigation
          </Text>

          <Text style={styles.description}>
            SmartVoiceNavigation is a
            voice-powered navigation
            application designed to make
            navigation simple, convenient
            and hands-free.
          </Text>

          <Text style={styles.description}>
            The application allows users
            to search destinations, start
            navigation and interact with
            navigation features using
            voice commands.
          </Text>
        </View>

        {/* FEATURES */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Features
          </Text>

          <Feature
            icon="mic-outline"
            title="Voice Navigation"
            text="Control navigation using voice commands."
          />

          <Feature
            icon="navigate-outline"
            title="Smart Navigation"
            text="Get directions to your desired destination."
          />

          <Feature
            icon="location-outline"
            title="Location Services"
            text="Use your current location for navigation."
          />

          <Feature
            icon="shield-checkmark-outline"
            title="Emergency Contacts"
            text="Keep trusted emergency contacts available."
          />
        </View>

        {/* VERSION */}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            App Version
          </Text>

          <Text style={styles.infoValue}>
            1.0.0
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Platform
          </Text>

          <Text style={styles.infoValue}>
            Android
          </Text>
        </View>

        {/* FOOTER */}

        <Text style={styles.footer}>
          Made with ❤️ for smarter navigation
        </Text>

        <Text style={styles.copyright}>
          © 2026 SmartVoiceNavigation
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// FEATURE ITEM
// ==========================================

function Feature({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.feature}>

      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#2874F0"
        />
      </View>

      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureText}>
          {text}
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

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  content: {
    padding: 20,
    paddingBottom: 45,
    alignItems: "stretch",
  },

  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 18,
  },

  appName: {
    fontSize: 23,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  version: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    marginBottom: 10,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },

  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  featureContent: {
    flex: 1,
    marginLeft: 12,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },

  featureText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },

  infoRow: {
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F3",
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  footer: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    marginTop: 25,
  },

  copyright: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 6,
  },

});