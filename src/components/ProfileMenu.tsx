import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const menus = [
  {
    icon: "create-outline",
    title: "Edit Profile",
    route: "/edit-profile",
  },
  {
    icon: "home-outline",
    title: "Home & Work",
    route: "/home-work",
  },
  {
    icon: "call-outline",
    title: "Emergency Contacts",
    route: "/emergency",
  },
  {
    icon: "settings-outline",
    title: "Settings",
    route: "/settings",
  },
  {
    icon: "help-circle-outline",
    title: "Help & Support",
    route: "/help",
  },
  {
    icon: "information-circle-outline",
    title: "About Us",
    route: "/about",
  },
];

export default function ProfileMenu() {
  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {menus.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => handlePress(item.route)}
        >
          <View style={styles.left}>
            <Ionicons
              name={item.icon as any}
              size={24}
              color="#2563EB"
            />

            <Text style={styles.title}>
              {item.title}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#BDBDBD"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 25,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 15,

    flexDirection: "row",
    justifyContent: "space-between",
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

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    marginLeft: 15,
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
});