import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const places = [
  {
    title: "Petrol Pump",
    distance: "1.2 km",
    icon: "local-gas-station",
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  {
    title: "Hospital",
    distance: "1.5 km",
    icon: "local-hospital",
    color: "#EF4444",
    bg: "#FEE2E2",
  },
  {
    title: "ATM",
    distance: "0.8 km",
    icon: "account-balance",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    title: "Restaurant",
    distance: "1.1 km",
    icon: "restaurant",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
];

export default function NearbyPlaces() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Nearby Places</Text>

        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {places.map((item) => (
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

            <Text style={styles.distance}>
              {item.distance}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  seeAll: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 15,
  },

  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    width: "23%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",

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
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginTop: 12,
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
    color: "#111827",
  },

  distance: {
    marginTop: 5,
    color:"#9CA3AF",
    fontSize: 12,
  },
});