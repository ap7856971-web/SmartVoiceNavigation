import ProfileMenu from "../../components/ProfileMenu";
import LogoutButton from "../../components/LogoutButton";
import React from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
// import ProfileMenu from "../components/ProfileMenu";
// import LogoutButton from "../components/LogoutButton";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111827"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Profile
        </Text>

      </View>

      {/* Profile Card */}
      
     
      <View style={styles.profileContainer}>

        <Image
          source={{
            uri: "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.profileImage}

        />

        <View style={styles.info}>

          <Text style={styles.name}>
            Aditya Pal
          </Text>

          <Text style={styles.email}>
            aditya@gmail.com
          </Text>

          <Text style={styles.phone}>
            +91 9876543210
          </Text>

        </View>

      </View>
      <ProfileMenu />
<LogoutButton />

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
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 10,
  },

  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 35,
    padding: 20,
    borderRadius: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 5,
  },

  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E5E7EB",
  },

  info: {
    marginLeft: 18,
    flex: 1,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  email: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 15,
  },

  phone: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 15,
  },
});