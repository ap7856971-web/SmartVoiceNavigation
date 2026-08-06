import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  userName?: string;
}

export default function Header({
  userName = "Aditya",
}: HeaderProps) {
  return (
    <View style={styles.container}>

      <View>
        <Text style={styles.title}>
          Hello, {userName} 👋
        </Text>

        <Text style={styles.subtitle}>
          Where do you want to go?
        </Text>
      </View>

      <TouchableOpacity style={styles.notificationBtn}>
        <Ionicons
          name="notifications-outline"
          size={24}
          color="#222"
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

    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,

    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 16,
    color: "#6B7280",
  },

  notificationBtn: {

    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.1,

    shadowRadius: 5,

    elevation: 4,
  },

});