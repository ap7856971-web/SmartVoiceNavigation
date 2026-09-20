import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/images/splash.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        Smart Voice{"\n"}Navigation
      </Text>

      <Text style={styles.subtitle}>
        Your Voice, Your Destination
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/signup")}
      >
        <Text style={styles.buttonText}>
          Get Started
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  imageContainer: {
    marginBottom: 30,
  },

  image: {
    width: 280,
    height: 280,
  },

  title: {
    textAlign: "center",
    fontSize: 42,
    fontWeight: "700",
    color: "#2563EB",
  },

  subtitle: {
    marginTop: 20,
    fontSize: 18,
    color: "#6B7280",
  },

  button: {
    marginTop: 70,
    width: "110%",
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});