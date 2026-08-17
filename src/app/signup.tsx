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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerUser } from "../services/authService";

export default function SignupScreen() {
  // ============================================
  // FORM STATES
  // ============================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ============================================
  // PASSWORD VISIBILITY
  // ============================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ============================================
  // OTHER STATES
  // ============================================

  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  // ============================================
  // CREATE ACCOUNT
  // ============================================

  const handleSignup = async () => {
    // --------------------------------------------
    // NAME
    // --------------------------------------------

    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert(
        "Error",
        "Please enter your full name."
      );
      return;
    }

    // --------------------------------------------
    // EMAIL
    // --------------------------------------------

    const cleanEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Error",
        "Please enter a valid email."
      );
      return;
    }

    // --------------------------------------------
    // PHONE
    // --------------------------------------------

    const cleanPhone = phone
      .replace(/\D/g, "");

    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      Alert.alert(
        "Error",
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    // --------------------------------------------
    // PASSWORD
    // --------------------------------------------

    if (password.length < 8) {
      Alert.alert(
        "Error",
        "Password should be at least 8 characters."
      );
      return;
    }

    // --------------------------------------------
    // CONFIRM PASSWORD
    // --------------------------------------------

    if (password !== confirmPassword) {
      Alert.alert(
        "Error",
        "Passwords do not match."
      );
      return;
    }

    // --------------------------------------------
    // TERMS
    // --------------------------------------------

    if (!agree) {
      Alert.alert(
        "Error",
        "Please accept Terms & Conditions."
      );
      return;
    }

    // --------------------------------------------
    // PREVENT DOUBLE CLICK
    // --------------------------------------------

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      console.log(
        "===================================="
      );

      console.log(
        "[Signup] Creating account..."
      );

      console.log(
        "[Signup] Name:",
        cleanName
      );

      console.log(
        "[Signup] Email:",
        cleanEmail
      );

      console.log(
        "[Signup] Phone:",
        cleanPhone
      );

      // ==========================================
      // REGISTER USER
      // ==========================================

      await registerUser(
        cleanName,
        cleanEmail,
        password
      );

      // ==========================================
      // SAVE USER NAME
      // ==========================================

      await AsyncStorage.setItem(
        "smartVoiceNavigation_userName",
        cleanName
      );

      // ==========================================
      // SAVE USER EMAIL
      // ==========================================

      await AsyncStorage.setItem(
        "smartVoiceNavigation_userEmail",
        cleanEmail
      );

      // ==========================================
      // SAVE USER PHONE
      // ==========================================

      await AsyncStorage.setItem(
        "smartVoiceNavigation_userPhone",
        cleanPhone
      );

      console.log(
        "[Signup] User information saved."
      );

      console.log(
        "[Signup] User name:",
        cleanName
      );

      console.log(
        "===================================="
      );

      // ==========================================
      // DIRECTLY GO TO TABS / HOME
      // ==========================================

      router.replace("/(tabs)");

    } catch (error: any) {
      console.error(
        "[Signup] Registration error:",
        error
      );

      Alert.alert(
        "Signup Failed",
        error?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UI
  // ============================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================
          LOGO
      ======================================== */}

      <Text style={styles.logo}>
        🚗
      </Text>

      {/* ========================================
          TITLE
      ======================================== */}

      <Text style={styles.heading}>
        Welcome 👋
      </Text>

      <Text style={styles.subtitle}>
        Create your Smart Voice Navigation account
      </Text>

      {/* ========================================
          FULL NAME
      ======================================== */}

      <View style={styles.inputBox}>
        <MaterialIcons
          name="person"
          size={22}
          color="#2563EB"
        />

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* ========================================
          EMAIL
      ======================================== */}

      <View style={styles.inputBox}>
        <MaterialIcons
          name="email"
          size={22}
          color="#2563EB"
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
      </View>

      {/* ========================================
          PHONE
      ======================================== */}

      <View style={styles.inputBox}>
        <MaterialIcons
          name="phone"
          size={22}
          color="#2563EB"
        />

        <TextInput
          placeholder="Phone Number"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={(text) => {
            setPhone(
              text.replace(/\D/g, "")
            );
          }}
          style={styles.input}
        />
      </View>

      {/* ========================================
          PASSWORD
      ======================================== */}

      <View style={styles.inputBox}>
        <MaterialIcons
          name="lock"
          size={22}
          color="#2563EB"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={() =>
            setShowPassword(!showPassword)
          }
        >
          <MaterialIcons
            name={
              showPassword
                ? "visibility"
                : "visibility-off"
            }
            size={22}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>

      {/* ========================================
          CONFIRM PASSWORD
      ======================================== */}

      <View style={styles.inputBox}>
        <MaterialIcons
          name="lock-outline"
          size={22}
          color="#2563EB"
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#9CA3AF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(
              !showConfirmPassword
            )
          }
        >
          <MaterialIcons
            name={
              showConfirmPassword
                ? "visibility"
                : "visibility-off"
            }
            size={22}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>

      {/* ========================================
          TERMS & CONDITIONS
      ======================================== */}

      <View style={styles.termsContainer}>
        <TouchableOpacity
          onPress={() =>
            setAgree(!agree)
          }
        >
          <MaterialIcons
            name={
              agree
                ? "check-box"
                : "check-box-outline-blank"
            }
            size={26}
            color="#2563EB"
          />
        </TouchableOpacity>

        <Text style={styles.termsText}>
          I agree to the Terms & Conditions
        </Text>
      </View>

      {/* ========================================
          CREATE ACCOUNT BUTTON
      ======================================== */}

      <TouchableOpacity
        style={[
          styles.signupButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleSignup}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.signupText}>
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      {/* ========================================
          LOGIN LINK
      ======================================== */}

      <TouchableOpacity
        onPress={() =>
          router.push("/login")
        }
        disabled={loading}
      >
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink}>
            Login
          </Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  contentContainer: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 50,
  },

  logo: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 10,
  },

  heading: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#2563EB",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 30,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 18,
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

  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  termsText: {
    marginLeft: 10,
    flex: 1,
    color: "#374151",
    fontSize: 14,
  },

  signupButton: {
    backgroundColor: "#2563EB",
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,

    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },

  signupText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },

  loginText: {
    marginTop: 25,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
  },

  loginLink: {
    color: "#2563EB",
    fontWeight: "700",
  },
});