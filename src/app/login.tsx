import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import SocialLogin from "../components/SocialLogin";
import BottomSignup from "../components/BottomSignup";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);

 const handleLogin = () => {
  if (email.trim() === "" || password.trim() === "") {
    Alert.alert("Error", "Please enter Email and Password");
    return;
  }

  // Demo Login
  if (
    email.trim().toLowerCase() === "admin@gmail.com" &&
    password === "123456"
  ) {
    Alert.alert("Success", "Login Successful");

    router.replace("/(tabs)");
  } else {
    Alert.alert(
      "Login Failed",
      "Invalid Email or Password"
    );
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.title}>Welcome Back 👋</Text>

        <Text style={styles.subtitle}>
          Sign in to continue
        </Text>

        {/* Email */}

        <Text style={styles.label}>Email</Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={22}
            color="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}

        <Text style={[styles.label, { marginTop: 20 }]}>
          Password
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={secureText}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={() => setSecureText(!secureText)}
          >
            <Ionicons
              name={
                secureText
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}

        <TouchableOpacity
          style={styles.forgotContainer}
        >
          <Text style={styles.forgotText}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}

        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.8}
          onPress={handleLogin}
        >
          <Text style={styles.loginText}>
            Login
          </Text>
        </TouchableOpacity>
        <SocialLogin />
        <BottomSignup />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 80,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#2563EB",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 35,
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 58,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#111827",
  },

  forgotContainer: {
    alignSelf: "flex-end",
    marginTop: 15,
  },

  forgotText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },

  loginButton: {
    marginTop: 30,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 6,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});