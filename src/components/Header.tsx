import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";

export default function Header() {
  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.hello}>
          Hello, {user?.displayName || "User"} 👋
        </Text>

        <Text style={styles.subtitle}>
          Where do you want to go?
        </Text>
      </View>

      <TouchableOpacity style={styles.notification}>
        <Ionicons
          name="notifications-outline"
          size={24}
          color="#2563EB"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 45,
    paddingHorizontal: 20,
  },

  hello: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#6B7280",
  },

  notification: {
    width: 50,
    height: 50,
    marginTop: 10,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
});