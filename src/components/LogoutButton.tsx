import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";

export default function LogoutButton() {
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            console.log("User Logged Out");
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      onPress={handleLogout}
    >
      <Text style={styles.text}>
        Logout
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 40,

    height: 58,

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#FFFFFF",

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.25,

    shadowRadius: 8,

    elevation: 6,
  },

  text: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "700",
  },
});