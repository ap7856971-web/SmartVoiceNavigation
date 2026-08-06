import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function CurrentLocationCard() {
  return (
    <LinearGradient
      colors={["#2563EB", "#3B82F6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Ionicons
            name="location"
            size={24}
            color="#2563EB"
          />
        </View>

        <View>
          <Text style={styles.smallText}>
            Current Location
          </Text>

          <Text style={styles.location}>
            Connaught Place
          </Text>

          <Text style={styles.city}>
            New Delhi, India
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Ionicons
          name="navigate"
          size={18}
          color="#fff"
        />

        <Text style={styles.live}>
          Live GPS Connected
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 25,

    borderRadius: 22,
    minHeight:170,

    padding: 20,

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 10,
    },

    shadowOpacity: 0.25,

    shadowRadius: 12,

    elevation: 8,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 55,
    height: 55,

    borderRadius: 28,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 15,
  },

  smallText: {
    color: "#DBEAFE",
    fontSize: 14,
  },

  location: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },

  city: {
    color: "#E5E7EB",
    marginTop: 2,
    fontSize: 15,
  },

  bottomRow: {
    marginTop: 20,

    flexDirection: "row",

    alignItems: "center",
  },

  live: {
    color: "#FFFFFF",

    marginLeft: 8,

    fontWeight: "600",
  },
});