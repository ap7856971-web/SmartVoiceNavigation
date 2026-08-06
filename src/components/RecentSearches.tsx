import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const recentPlaces = [
  {
    id: 1,
    title: "India Gate",
    subtitle: "New Delhi",
  },
  {
    id: 2,
    title: "Karol Bagh",
    subtitle: "New Delhi",
  },
  {
    id: 3,
    title: "Airport Terminal 3",
    subtitle: "Delhi",
  },
  {
    id: 4,
    title: "Noida Sector 62",
    subtitle: "Noida",
  },
];

export default function RecentSearches() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Recent Searches
      </Text>

      {recentPlaces.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.8}
          style={styles.card}
        >
          <View style={styles.left}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="history"
                size={22}
                color="#2563EB"
              />
            </View>

            <View style={styles.textBox}>
              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.subtitle}>
                {item.subtitle}
              </Text>
            </View>
          </View>

          <MaterialIcons
            name="keyboard-arrow-right"
            size={28}
            color="#BDBDBD"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 120,
  },

  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    padding: 16,

    marginBottom: 14,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowRadius: 5,

    elevation: 4,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 48,
    height: 48,

    borderRadius: 24,

    backgroundColor: "#E8F0FE",

    justifyContent: "center",

    alignItems: "center",
  },

  textBox: {
    marginLeft: 15,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    color: "#6B7280",
    marginTop: 3,
    fontSize: 14,
  },
});