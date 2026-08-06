import React from "react";
import {
  View,
 Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SocialLogin() {
  return (
    <View style={styles.container}>

      <Text style={styles.orText}>
        or continue with
      </Text>

      <View style={styles.row}>

        <TouchableOpacity style={styles.button}>
          <Ionicons
            name="logo-google"
            size={32}
            color="#EA4335"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Ionicons
            name="logo-apple"
            size={32}
            color="#000"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Ionicons
            name="call"
            size={30}
            color="#16A34A"
          />
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    alignItems: "center",
  },

  orText: {
    color: "#6B7280",
    fontSize: 16,
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },

  button: {
    width: 78,
    height: 78,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    justifyContent: "center",
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
});