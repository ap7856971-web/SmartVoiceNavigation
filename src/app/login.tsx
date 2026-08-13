import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { signInWithGoogle } from "../services/googleAuth";

import { loginUser } from "../services/authService";
import { sendPhoneOTP, verifyPhoneOTP } from "../services/phoneAuth";

export default function LoginScreen() {
  // ==================================================
  // MODE STATE
  // ==================================================
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

  // ==================================================
  // EMAIL LOGIN STATES
  // ==================================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ==================================================
  // PHONE LOGIN STATES
  // ==================================================
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // ==================================================
  // EMAIL LOGIN HANDLER
  // ==================================================
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await loginUser(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error: any) {
      let message = "Invalid email or password.";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // SEND PHONE OTP
  // ==================================================
  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      setPhoneError("Please enter a valid 10 digit mobile number.");
      return;
    }

    try {
      setPhoneError("");
      setPhoneLoading(true);

      await sendPhoneOTP(cleanPhone);
      setOtpSent(true);
    } catch (error: any) {
      setPhoneError("Failed to send OTP. Try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  // ==================================================
  // VERIFY PHONE OTP
  // ==================================================
  const handleVerifyOTP = async () => {
    const cleanOTP = otp.replace(/\D/g, "");

    if (!/^\d{6}$/.test(cleanOTP)) {
      setPhoneError("Please enter the 6 digit OTP.");
      return;
    }

    try {
      setPhoneError("");
      setPhoneLoading(true);

      await verifyPhoneOTP(cleanOTP);
      router.replace("/(tabs)");
    } catch (error: any) {
      setPhoneError("Incorrect OTP. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const resetPhoneFlow = () => {
    setShowPhoneLogin(false);
    setOtpSent(false);
    setOtp("");
    setPhone("");
    setPhoneError("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* TITLE */}
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>
          {showPhoneLogin ? "Sign in with Mobile OTP" : "Sign in to continue"}
        </Text>

        {!showPhoneLogin ? (
          /* ==================================================
             EMAIL LOGIN FORM (DEFAULT)
             ================================================== */
          <>
            {/* EMAIL */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
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

            {/* PASSWORD */}
            <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Ionicons
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* FORGOT PASSWORD */}
            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* DIVIDER */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* LOGOS ROW (GOOGLE, APPLE, PHONE) */}
            <View style={styles.socialRow}>
              {/* GOOGLE */}
              <TouchableOpacity
                style={styles.socialIconBtn}
                activeOpacity={0.8}
                disabled={googleLoading}
                onPress={async () => {
                  try {
                    setGoogleLoading(true);

                    const result =
                      await signInWithGoogle();

                    if (result.success) {
                      router.replace("/(tabs)");
                      return;
                    }

                    if (!result.cancelled) {
                      Alert.alert(
                        "Google Login Failed",
                        result.message ||
                          "Please try again."
                      );
                    }
                  } catch (error: any) {
                    console.log(
                      "[Login] Google button error:",
                      error
                    );

                    Alert.alert(
                      "Google Login Failed",
                      error?.message ||
                        "Unable to sign in with Google."
                    );
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
              >
                {googleLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#4285F4"
                  />
                ) : (
                  <Ionicons
                    name="logo-google"
                    size={26}
                    color="#4285F4"
                  />
                )}
              </TouchableOpacity>

              {/* APPLE ICON */}
              <TouchableOpacity
                style={styles.socialIconBtn}
                activeOpacity={0.8}
                onPress={() => Alert.alert("Apple Login", "Apple Sign In requested")}
              >
                <Ionicons name="logo-apple" size={26} color="#000000" />
              </TouchableOpacity>

              {/* PHONE ICON (Opens OTP Screen) */}
              <TouchableOpacity
                style={styles.socialIconBtn}
                activeOpacity={0.8}
                onPress={() => setShowPhoneLogin(true)}
              >
                <Ionicons name="call" size={24} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ==================================================
             PHONE OTP PAGE
             ================================================== */
          <View style={styles.phoneContainer}>
            {!otpSent ? (
              <>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.phoneInputContainer}>
                  <Ionicons name="call-outline" size={22} color="#9CA3AF" />
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter 10 digit mobile number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(text) => {
                      setPhoneError("");
                      setPhone(text.replace(/\D/g, ""));
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  activeOpacity={0.8}
                  onPress={handleSendOTP}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter OTP</Text>
                <Text style={styles.otpDescription}>
                  OTP sent to +91 {phone}
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="keypad-outline" size={22} color="#9CA3AF" />
                  <TextInput
                    style={styles.otpInput}
                    placeholder="6 digit OTP"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(text) => {
                      setPhoneError("");
                      setOtp(text.replace(/\D/g, ""));
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  activeOpacity={0.8}
                  onPress={handleVerifyOTP}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changeNumberContainer}
                  onPress={() => {
                    setOtp("");
                    setOtpSent(false);
                    setPhoneError("");
                  }}
                >
                  <Text style={styles.changeNumber}>
                    ← Change phone number
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {phoneError ? (
              <Text style={styles.phoneError}>{phoneError}</Text>
            ) : null}

            {/* BACK TO EMAIL LOGIN */}
            <TouchableOpacity
              style={styles.backToEmailBtn}
              onPress={resetPhoneFlow}
            >
              <Text style={styles.backToEmailText}>
                ← Back to Email Login
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================
            SIGN UP LINK
            ================================================== */}
        <TouchableOpacity
          style={styles.signupContainer}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.signupText}>
            Don't have an account?{" "}
            <Text style={styles.signupLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#2563EB",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 25,
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },

  // LABELS & INPUTS
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
    shadowOffset: { width: 0, height: 2 },
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

  // LOGIN BUTTON
  loginButton: {
    marginTop: 25,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  // DIVIDER
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },

  // SOCIAL LOGOS ROW
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  socialIconBtn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },

  // PHONE OTP FORM
  phoneContainer: {
    width: "100%",
  },
  phoneInputContainer: {
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
    shadowOffset: { width: 0, height: 2 },
  },
  countryCode: {
    marginLeft: 8,
    marginRight: 5,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  otpDescription: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 12,
  },
  otpInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 5,
    color: "#111827",
  },
  changeNumberContainer: {
    alignItems: "center",
    marginTop: 18,
  },
  changeNumber: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  phoneError: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 19,
  },
  backToEmailBtn: {
    alignItems: "center",
    marginTop: 24,
  },
  backToEmailText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },

  // SIGN UP
  signupContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  signupText: {
    fontSize: 16,
    color: "#6B7280",
  },
  signupLink: {
    color: "#2563EB",
    fontWeight: "700",
  },
});