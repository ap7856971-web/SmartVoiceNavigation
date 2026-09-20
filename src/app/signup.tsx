import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerUser } from "../services/authService";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSignup = async () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Error", "Please enter a valid email.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      Alert.alert(
        "Error",
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password should be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (!agree) {
      Alert.alert("Error", "Please accept Terms & Conditions.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      await registerUser(
        cleanName,
        cleanEmail,
        password,
        cleanPhone
      );

      await AsyncStorage.multiSet([
        ["smartVoiceNavigation_userName", cleanName],
        ["smartVoiceNavigation_userEmail", cleanEmail],
        ["smartVoiceNavigation_userPhone", cleanPhone],
      ]);

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[Signup] Registration error:", error);

      Alert.alert(
        "Signup Failed",
        error?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header - kept simple like the reference */}
        <View style={styles.header}>
          <Text style={styles.heading}>Create Account 👋</Text>
          <Text style={styles.subtitle}>Sign up to continue</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Full name */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="#B8B8B8"
                value={name}
                onChangeText={setName}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <MaterialIcons
                name="person-outline"
                size={20}
                color="#A7A7A7"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#B8B8B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
              <MaterialIcons
                name="mail-outline"
                size={20}
                color="#A7A7A7"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Enter your 10-digit mobile number"
                placeholderTextColor="#B8B8B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(text) =>
                  setPhone(text.replace(/\D/g, ""))
                }
                style={styles.input}
              />
              <MaterialIcons
                name="phone"
                size={20}
                color="#A7A7A7"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#B8B8B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={
                    showPassword
                      ? "visibility"
                      : "visibility-off"
                  }
                  size={20}
                  color="#A7A7A7"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Confirm password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Re-enter your password"
                placeholderTextColor="#B8B8B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={
                    showConfirmPassword
                      ? "visibility"
                      : "visibility-off"
                  }
                  size={20}
                  color="#A7A7A7"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgree(!agree)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkbox,
                agree && styles.checkboxChecked,
              ]}
            >
              {agree && (
                <MaterialIcons
                  name="check"
                  size={15}
                  color="#FFFFFF"
                />
              )}
            </View>

            <Text style={styles.termsText}>
              I agree to the processing of{" "}
              <Text style={styles.termsBold}>Personal data</Text>
            </Text>
          </TouchableOpacity>

          {/* Sign up */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signupText}>Sign up</Text>
            )}
          </TouchableOpacity>

          {/* Login */}
          <TouchableOpacity
            onPress={() => router.push("/login")}
            disabled={loading}
            activeOpacity={0.7}
            style={styles.loginButton}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 78 : 58,
    paddingBottom: 32,
  },

  header: {
    alignItems: "center",
    marginBottom: 34,
  },

  heading: {
    fontSize: 25,
    fontWeight: "900",
    color: "#1558C8",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#858585",
    textAlign: "center",
  },

  formContainer: {
    width: "100%",
  },

  fieldBlock: {
    marginBottom: 18,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#333333",
    marginBottom: 7,
    marginLeft: 7,
  },

  inputContainer: {
    height: 55,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingRight: 10,
    fontSize: 14,
    color: "#333333",
  },

  eyeButton: {
    width: 32,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 21,
    paddingHorizontal: 4,
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 4,
    borderWidth: 1.4,
    borderColor: "#D2D2D2",
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: "#1558C8",
    borderColor: "#1558C8",
  },

  termsText: {
    flex: 1,
    marginLeft: 9,
    color: "#888888",
    fontSize: 12.5,
  },

  termsBold: {
    color: "#1558C8",
    fontWeight: "600",
  },

  signupButton: {
    height: 53,
    borderRadius: 24,
    backgroundColor: "#1558C8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1558C8",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  signupText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButton: {
    marginTop: 24,
    alignItems: "center",
  },

  loginText: {
    color: "#888888",
    fontSize: 13,
  },

  loginLink: {
    color: "#1558C8",
    fontWeight: "700",
  },
});
