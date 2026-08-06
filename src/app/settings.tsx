import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [traffic, setTraffic] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.title}>
            Settings
          </Text>
        </View>

        {/* Appearance */}
        <Text style={styles.section}>
          Appearance
        </Text>

        <View style={styles.card}>
          <Text style={styles.itemText}>
            Dark Mode
          </Text>

          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        {/* Voice */}
        <Text style={styles.section}>
          Voice & Language
        </Text>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.itemText}>
            Voice Language
          </Text>

          <View style={styles.right}>
            <Text style={styles.value}>
              English (India)
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#999"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.itemText}>
            Voice Type
          </Text>

          <View style={styles.right}>
            <Text style={styles.value}>
              Male
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#999"
            />
          </View>
        </TouchableOpacity>

        {/* Navigation */}
        <Text style={styles.section}>
          Navigation
        </Text>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.itemText}>
            Distance Unit
          </Text>

          <View style={styles.right}>
            <Text style={styles.value}>
              Kilometers
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#999"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.itemText}>
            Traffic Updates
          </Text>

          <Switch
            value={traffic}
            onValueChange={setTraffic}
          />
        </View>

        {/* Notifications */}
        <Text style={styles.section}>
          Notifications
        </Text>

        <View style={styles.card}>
          <Text style={styles.itemText}>
            Push Notifications
          </Text>

          <Switch
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* About */}
        <Text style={styles.section}>
          About
        </Text>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.itemText}>
            App Version
          </Text>

          <Text style={styles.value}>
            1.0.0
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 15,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginLeft: 10,
    color: "#111827",
  },

  section: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#666",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    elevation: 3,
  },

  itemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  value: {
    color: "#666",
    marginRight: 6,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
  },
});