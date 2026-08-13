import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function ProfileMenu() {
  const menuItems = [
    {
      id: "edit",
      title: "Edit Profile",
      icon: "person-outline",
      route: "/edit-profile",
    },
    {
      id: "home",
      title: "Home Settings",
      icon: "home-outline",
      route: "/home-settings",
    },
    {
      id: "work",
      title: "Work Settings",
      icon: "briefcase-outline",
      route: "/work-settings",
    },
  ];

  return (
    <View style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={() => router.push(item.route as any)}
        >
          <View style={styles.leftContent}>
            <Ionicons name={item.icon as any} size={22} color="#4B5563" />
            <Text style={styles.menuText}>{item.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 25,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginLeft: 14,
  },
});