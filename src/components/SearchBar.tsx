import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={22}
          color="#6B7280"
        />

        <TextInput
          placeholder="Search destination..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />

        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons
            name="mic"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 25,
    paddingHorizontal: 20,
  },

  searchContainer: {
    height: 58,
    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 18,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.08,

    shadowRadius: 8,

    elevation: 5,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },

  voiceButton: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: "#2563EB",

    justifyContent: "center",
    alignItems: "center",
  },
});