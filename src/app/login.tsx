import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";

import { signInWithGoogle } from "../services/googleAuth";
import { loginUser } from "../services/authService";
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  resetOTP,
} from "../services/phoneAuth";

type LoginMode = "email" | "phone";

const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      fill="#4285F4"
      d="M14.9 8.161c0-.476-.039-.954-.121-1.422h-6.64v2.695h3.802a3.24 3.24 0 01-1.407 2.127v1.75h2.269c1.332-1.22 2.097-3.02 2.097-5.15z"
    />
    <Path
      fill="#34A853"
      d="M8.14 15c1.898 0 3.499-.62 4.665-1.69l-2.268-1.749c-.631.427-1.446.669-2.395.669-1.836 0-3.393-1.232-3.952-2.888H1.85v1.803A7.044 7.044 0 008.14 15z"
    />
    <Path
      fill="#FBBC04"
      d="M4.187 9.342a4.17 4.17 0 010-2.68V4.859H1.849a6.97 6.97 0 000 6.286l2.338-1.803z"
    />
    <Path
      fill="#EA4335"
      d="M8.14 3.77a3.837 3.837 0 012.7 1.05l2.01-1.999a6.786 6.786 0 00-4.71-1.82 7.042 7.042 0 00-6.29 3.858L4.186 6.66c.556-1.658 2.116-2.89 3.952-2.89z"
    />
  </Svg>
);

export default function LoginScreen() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState<LoginMode>("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [secureText, setSecureText] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const otpInputRef = useRef<TextInput>(null);

  const detectLoginMode = (value: string): LoginMode => {
    const trimmed = value.trim();
    if (trimmed.includes("@")) return "email";
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length > 0) return "phone";
    return "email";
  };

  const handleLoginValueChange = (text: string) => {
    setPhoneError("");
    const mode = detectLoginMode(text);

    if (mode === "email" && loginMode === "phone") {
      resetOTP();
      setOtp("");
      setOtpSent(false);
    }

    setLoginMode(mode);

    if (mode === "phone") {
      setLoginValue(text.replace(/\D/g, "").slice(0, 10));
    } else {
      setLoginValue(text);
    }
  };

  const handleEmailLogin = async () => {
    if (loading || googleLoading || phoneLoading) return;
    const cleanEmail = loginValue.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      await loginUser(cleanEmail, password);
      router.replace("/Home");
    } catch (error: any) {
      Alert.alert("Login Failed", error?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading || loading || phoneLoading) return;
    try {
      setGoogleLoading(true);
      const result = await signInWithGoogle();
      if (result.success) {
        router.replace("/Home");
        return;
      }
      if (!result.cancelled) {
        Alert.alert("Google Login Failed", result.message || "Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Google Login Failed", error?.message || "Unable to sign in.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (phoneLoading || loading || googleLoading) return;
    const cleanPhone = loginValue.replace(/\D/g, "");

    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      setPhoneError("Please enter a valid 10 digit mobile number.");
      return;
    }

    try {
      setPhoneError("");
      setPhoneLoading(true);
      await sendPhoneOTP(cleanPhone);
      setLoginValue(cleanPhone);
      setOtp("");
      setOtpSent(true);
    } catch (error: any) {
      setPhoneError(error?.message || "Failed to generate OTP.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (phoneLoading || loading || googleLoading) return;
    const cleanOTP = otp.replace(/\D/g, "");

    if (!/^[0-9]{6}$/.test(cleanOTP)) {
      setPhoneError("Please enter the 6 digit OTP.");
      return;
    }

    try {
      setPhoneError("");
      setPhoneLoading(true);
      await verifyPhoneOTP(cleanOTP);
      router.replace("/Home");
    } catch (error: any) {
      setPhoneError(error?.message || "OTP verification failed.");
    } finally {
      setPhoneLoading(false);
    }
  };

  useEffect(() => {
    if (!otpSent) return;

    const timer = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [otpSent]);

  const otpDigits = Array.from({ length: 6 }, (_, index) => otp[index] || "");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* HEADING SECTION */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>
                Welcome Back <Text style={styles.waveEmoji}>👋</Text>
              </Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* INPUT SECTION */}
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>
                {loginMode === "phone" ? "Phone Number" : "Email"}
              </Text>

              <View style={[styles.inputWrapper, phoneError ? styles.inputError : null]}>
                <Ionicons
                  name={loginMode === "phone" ? "call-outline" : "person-outline"}
                  size={18}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                {loginMode === "phone" && <Text style={styles.countryCode}>+91 </Text>}
                <TextInput
                  style={styles.input}
                  placeholder={loginMode === "phone" ? "Enter phone number" : "Enter your email"}
                  placeholderTextColor="#9CA3AF"
                  keyboardType={loginMode === "phone" ? "phone-pad" : "email-address"}
                  autoCapitalize="none"
                  value={loginValue}
                  editable={!otpSent && !phoneLoading}
                  maxLength={loginMode === "phone" ? 10 : 120}
                  onChangeText={handleLoginValueChange}
                />
              </View>

              {loginMode === "email" && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={secureText}
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading && !googleLoading}
                    />
                    <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                      <Ionicons
                        name={secureText ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.forgotContainer}
                    onPress={() =>
                      Alert.alert("Forgot Password", "Password reset instructions sent.")
                    }
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.loginButton, loading && styles.disabledBtn]}
                    onPress={handleEmailLogin}
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>Login</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {loginMode === "phone" && !otpSent && (
                <>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                  <TouchableOpacity
                    style={[styles.loginButton, { marginTop: 20 }, phoneLoading && styles.disabledBtn]}
                    onPress={handleSendOTP}
                    disabled={phoneLoading}
                  >
                    {phoneLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {loginMode === "phone" && otpSent && (
                <>
                  <View style={{ marginTop: 15 }}>
                    <Text style={styles.otpDescription}>
                      OTP sent to +91 {loginValue}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      style={styles.otpBoxesContainer}
                      onPress={() => otpInputRef.current?.focus()}
                    >
                      {otpDigits.map((digit, index) => (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            index === otp.length && styles.otpBoxActive,
                          ]}
                        >
                          <Text style={styles.otpDigit}>{digit}</Text>
                        </View>
                      ))}
                    </TouchableOpacity>
                    <TextInput
                      ref={otpInputRef}
                      value={otp}
                      onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={styles.hiddenOTPInput}
                    />
                  </View>

                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                  <TouchableOpacity
                    style={[styles.loginButton, { marginTop: 20 }, phoneLoading && styles.disabledBtn]}
                    onPress={handleVerifyOTP}
                    disabled={phoneLoading}
                  >
                    {phoneLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* DIVIDER & SOCIAL BUTTONS */}
            <View style={styles.dividerContainer}>
              <Text style={styles.dividerText}>or continue with</Text>
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
                <GoogleLogo size={22} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-apple" size={24} color="#000000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => {
                  setLoginMode("phone");
                  setLoginValue("");
                  setOtpSent(false);
                }}
              >
                <Ionicons name="call" size={20} color="#0D9488" />
              </TouchableOpacity>
            </View>

            {/* FOOTER */}
            <TouchableOpacity
              style={styles.signupContainer}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2563EB",
    marginBottom: 6,
  },
  waveEmoji: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  formContainer: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  forgotContainer: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2563EB",
  },
  loginButton: {
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

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  dividerContainer: {
    alignItems: "center",
    marginVertical: 28,
  },
  dividerText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    alignItems: "center",
    marginBottom: 36,
  },
  socialBtn: {
    width: 76,
    height: 58,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF1EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6B8264",
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  signupContainer: {
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "#4B5563",
  },
  signupLink: {
    color: "#2563EB",
    fontWeight: "700",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  otpDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    textAlign: "center",
  },
  otpBoxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  otpBox: {
    width: 42,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxActive: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  otpDigit: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  hiddenOTPInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});