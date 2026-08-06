import React from "react";
import {
  View,
 Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const actions = [
  {
    title: "Home",
    icon: "home",
    color: "#2563EB",
    bg: "#E8F0FE",
  },
  {
    title: "Work",
    icon: "work",
    color: "#2563EB",
    bg: "#E8F0FE",
  },
  {
    title: "Favorites",
    icon: "favorite",
    color: "#EF4444",
    bg: "#FDECEC",
  },
  {
    title: "History",
    icon: "history",
    color: "#2563EB",
    bg: "#E8F0FE",
  },
];

export default function QuickActions() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick Actions</Text>

      <View style={styles.grid}>
        {actions.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: item.bg },
              ]}
            >
              <MaterialIcons
                name={item.icon as any}
                size={28}
                color={item.color}
              />
            </View>

            <Text style={styles.title}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    paddingHorizontal: 20,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 18,
  },

  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    width: "22%",

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    alignItems: "center",

    paddingVertical: 20,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,

    shadowRadius: 5,

    elevation: 4,
  },

  iconCircle: {
    width: 60,
    height: 50,

    borderRadius: 28,

    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});