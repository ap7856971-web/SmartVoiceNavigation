import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function BottomSignup() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Don't have an account?
      </Text>

      <TouchableOpacity>
        <Text style={styles.signup}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 45,
    marginBottom: 40,
  },

  text: {
    fontSize: 16,
    color: "#444",
  },

  signup: {
    marginLeft: 6,
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "700",
  },
});