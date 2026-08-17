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
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  resetOTP,
} from "../services/phoneAuth";

type LoginMode =
  | "choice"
  | "email"
  | "phone";

export default function LoginScreen() {
  // ============================================
  // LOGIN MODE
  // ============================================

  const [loginMode, setLoginMode] =
    useState<LoginMode>("choice");

  // ============================================
  // EMAIL LOGIN
  // ============================================

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [secureText, setSecureText] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  // ============================================
  // GOOGLE LOGIN
  // ============================================

  const [googleLoading, setGoogleLoading] =
    useState(false);

  // ============================================
  // PHONE LOGIN
  // ============================================

  const [phone, setPhone] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpSent, setOtpSent] =
    useState(false);

  const [phoneLoading, setPhoneLoading] =
    useState(false);

  const [phoneError, setPhoneError] =
    useState("");

  // ============================================
  // EMAIL LOGIN
  // ============================================

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Error",
        "Please enter your email."
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert(
        "Error",
        "Please enter your password."
      );
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      console.log(
        "[Login] Email login started..."
      );

      await loginUser(
        email.trim().toLowerCase(),
        password
      );

      console.log(
        "[Login] Email login successful."
      );

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(
        "[Login] Email login error:",
        error
      );

      Alert.alert(
        "Login Failed",
        error?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GOOGLE LOGIN
  // ============================================

  const handleGoogleLogin = async () => {
    if (googleLoading) {
      return;
    }

    try {
      setGoogleLoading(true);

      console.log(
        "[Login] Google login started..."
      );

      const result =
        await signInWithGoogle();

      if (result.success) {
        console.log(
          "[Login] Google login successful."
        );

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
      console.error(
        "[Login] Google login error:",
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
  };

  // ============================================
  // SEND PHONE OTP
  // ============================================

  const handleSendOTP = async () => {
    if (phoneLoading) {
      return;
    }

    const cleanPhone =
      phone.replace(/\D/g, "");

    // Indian mobile validation
    if (
      !/^[6-9][0-9]{9}$/.test(
        cleanPhone
      )
    ) {
      setPhoneError(
        "Please enter a valid 10 digit mobile number."
      );
      return;
    }

    try {
      setPhoneError("");
      setPhoneLoading(true);

      console.log(
        "[Login] Requesting TEST OTP for:",
        cleanPhone
      );

      await sendPhoneOTP(
        cleanPhone
      );

      console.log(
        "[Login] TEST OTP generated."
      );

      setOtp("");
      setOtpSent(true);
    } catch (error: any) {
      console.error(
        "[Login] SEND OTP ERROR:",
        error
      );

      console.error(
        "[Login] Code:",
        error?.code
      );

      console.error(
        "[Login] Message:",
        error?.message
      );

      setPhoneError(
        error?.message ||
          "Failed to generate OTP."
      );
    } finally {
      setPhoneLoading(false);
    }
  };

  // ============================================
  // VERIFY OTP
  // ============================================

  const handleVerifyOTP = async () => {
    if (phoneLoading) {
      return;
    }

    const cleanOTP =
      otp.replace(/\D/g, "");

    if (
      !/^[0-9]{6}$/.test(
        cleanOTP
      )
    ) {
      setPhoneError(
        "Please enter the 6 digit OTP."
      );
      return;
    }

    try {
      setPhoneError("");
      setPhoneLoading(true);

      console.log(
        "[Login] Verifying TEST OTP..."
      );

      const user =
        await verifyPhoneOTP(
          cleanOTP
        );

      console.log(
        "[Login] OTP login successful."
      );

      if (user) {
        console.log(
          "[Login] Phone:",
          user.phoneNumber
        );
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(
        "[Login] VERIFY OTP ERROR:",
        error
      );

      console.error(
        "[Login] Code:",
        error?.code
      );

      console.error(
        "[Login] Message:",
        error?.message
      );

      setPhoneError(
        error?.message ||
          "OTP verification failed."
      );
    } finally {
      setPhoneLoading(false);
    }
  };

  // ============================================
  // RESEND OTP
  // ============================================

  const handleResendOTP = async () => {
    if (phoneLoading) {
      return;
    }

    resetOTP();

    setOtp("");
    setOtpSent(false);
    setPhoneError("");

    setTimeout(() => {
      handleSendOTP();
    }, 100);
  };

  // ============================================
  // CHANGE PHONE NUMBER
  // ============================================

  const handleChangeNumber = () => {
    resetOTP();

    setOtp("");
    setOtpSent(false);
    setPhoneError("");
  };

  // ============================================
  // BACK TO CHOICE
  // ============================================

  const handleBackToChoice = () => {
    resetOTP();

    setLoginMode("choice");

    setOtp("");
    setOtpSent(false);
    setPhone("");
    setPhoneError("");
  };

  // ============================================
  // FORGOT PASSWORD
  // ============================================

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password",
      "Please use your registered email to reset your password."
    );
  };

  // ============================================
  // CHOICE SCREEN
  // ============================================

  if (loginMode === "choice") {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.choiceContent}>
          {/* TITLE */}

          <Text style={styles.title}>
            Welcome Back 👋
          </Text>

          <Text style={styles.subtitle}>
            Choose how you want to login
          </Text>

          {/* EMAIL */}

          <TouchableOpacity
            style={styles.choiceButton}
            activeOpacity={0.8}
            onPress={() =>
              setLoginMode("email")
            }
          >
            <View
              style={styles.choiceIcon}
            >
              <Ionicons
                name="mail-outline"
                size={25}
                color="#2563EB"
              />
            </View>

            <View
              style={styles.choiceTextContainer}
            >
              <Text
                style={styles.choiceTitle}
              >
                Login with Email
              </Text>

              <Text
                style={styles.choiceSubtitle}
              >
                Use your email and password
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {/* PHONE */}

          <TouchableOpacity
            style={styles.choiceButton}
            activeOpacity={0.8}
            onPress={() =>
              setLoginMode("phone")
            }
          >
            <View
              style={styles.choiceIcon}
            >
              <Ionicons
                name="call-outline"
                size={25}
                color="#2563EB"
              />
            </View>

            <View
              style={styles.choiceTextContainer}
            >
              <Text
                style={styles.choiceTitle}
              >
                Login with Phone
              </Text>

              <Text
                style={styles.choiceSubtitle}
              >
                Login using OTP
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {/* GOOGLE */}

          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.8}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator
                size="small"
                color="#4285F4"
              />
            ) : (
              <Ionicons
                name="logo-google"
                size={25}
                color="#4285F4"
              />
            )}

            <Text
              style={styles.googleText}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* DIVIDER */}

          <View
            style={styles.dividerContainer}
          >
            <View
              style={styles.dividerLine}
            />

            <Text
              style={styles.dividerText}
            >
              Secure Login
            </Text>

            <View
              style={styles.dividerLine}
            />
          </View>

          {/* SIGN UP */}

          <TouchableOpacity
            style={styles.signupContainer}
            onPress={() =>
              router.push("/signup")
            }
          >
            <Text
              style={styles.signupText}
            >
              Don't have an account?{" "}
              <Text
                style={styles.signupLink}
              >
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // EMAIL SCREEN
  // ============================================

  if (loginMode === "email") {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.content}>
          {/* BACK */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToChoice}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#111827"
            />

            <Text
              style={styles.backText}
            >
              Back
            </Text>
          </TouchableOpacity>

          {/* TITLE */}

          <Text style={styles.title}>
            Welcome Back 👋
          </Text>

          <Text style={styles.subtitle}>
            Login with your email
          </Text>

          {/* EMAIL */}

          <Text style={styles.label}>
            Email
          </Text>

          <View
            style={styles.inputContainer}
          >
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
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* PASSWORD */}

          <Text
            style={[
              styles.label,
              {
                marginTop: 20,
              },
            ]}
          >
            Password
          </Text>

          <View
            style={styles.inputContainer}
          >
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
              onPress={() =>
                setSecureText(
                  !secureText
                )
              }
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

          {/* FORGOT PASSWORD */}

          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={
              handleForgotPassword
            }
          >
            <Text
              style={styles.forgotText}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* LOGIN */}

          <TouchableOpacity
            style={[
              styles.loginButton,
              loading &&
                styles.disabledButton,
            ]}
            activeOpacity={0.8}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.loginText}
              >
                Login
              </Text>
            )}
          </TouchableOpacity>

          {/* GOOGLE */}

          <View
            style={styles.dividerContainer}
          >
            <View
              style={styles.dividerLine}
            />

            <Text
              style={styles.dividerText}
            >
              Or
            </Text>

            <View
              style={styles.dividerLine}
            />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator
                color="#4285F4"
              />
            ) : (
              <Ionicons
                name="logo-google"
                size={24}
                color="#4285F4"
              />
            )}

            <Text
              style={styles.googleText}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* PHONE */}

          <TouchableOpacity
            style={styles.switchMethodButton}
            onPress={() =>
              setLoginMode("phone")
            }
          >
            <Ionicons
              name="call-outline"
              size={19}
              color="#2563EB"
            />

            <Text
              style={styles.switchMethodText}
            >
              Login with Phone
            </Text>
          </TouchableOpacity>

          {/* SIGN UP */}

          <TouchableOpacity
            style={styles.signupContainer}
            onPress={() =>
              router.push("/signup")
            }
          >
            <Text
              style={styles.signupText}
            >
              Don't have an account?{" "}
              <Text
                style={styles.signupLink}
              >
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // PHONE SCREEN
  // ============================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.content}>
        {/* BACK */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToChoice}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111827"
          />

          <Text
            style={styles.backText}
          >
            Back
          </Text>
        </TouchableOpacity>

        {/* TITLE */}

        <Text style={styles.title}>
          Welcome Back 👋
        </Text>

        <Text style={styles.subtitle}>
          Login with your phone number
        </Text>

        {!otpSent ? (
          <>
            {/* PHONE NUMBER */}

            <Text style={styles.label}>
              Mobile Number
            </Text>

            <View
              style={styles.phoneInputContainer}
            >
              <Ionicons
                name="call-outline"
                size={22}
                color="#9CA3AF"
              />

              <Text
                style={styles.countryCode}
              >
                +91
              </Text>

              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10 digit mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                editable={!phoneLoading}
                onChangeText={(text) => {
                  setPhoneError("");

                  setPhone(
                    text.replace(
                      /\D/g,
                      ""
                    )
                  );
                }}
              />
            </View>

            {/* ERROR */}

            {phoneError ? (
              <Text
                style={styles.phoneError}
              >
                {phoneError}
              </Text>
            ) : null}

            {/* SEND OTP */}

            <TouchableOpacity
              style={[
                styles.loginButton,
                phoneLoading &&
                  styles.disabledButton,
              ]}
              activeOpacity={0.8}
              onPress={handleSendOTP}
              disabled={phoneLoading}
            >
              {phoneLoading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.loginText}
                >
                  Send OTP
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* OTP */}

            <Text style={styles.label}>
              Enter OTP
            </Text>

            <Text
              style={styles.otpDescription}
            >
              TEST OTP for +91 {phone}
              {"\n"}
              Check your terminal / Metro
              console.
            </Text>

            <View
              style={styles.inputContainer}
            >
              <Ionicons
                name="keypad-outline"
                size={22}
                color="#9CA3AF"
              />

              <TextInput
                style={styles.otpInput}
                placeholder="6 digit OTP"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                editable={!phoneLoading}
                autoFocus
                onChangeText={(text) => {
                  setPhoneError("");

                  setOtp(
                    text.replace(
                      /\D/g,
                      ""
                    )
                  );
                }}
              />
            </View>

            {/* ERROR */}

            {phoneError ? (
              <Text
                style={styles.phoneError}
              >
                {phoneError}
              </Text>
            ) : null}

            {/* VERIFY */}

            <TouchableOpacity
              style={[
                styles.loginButton,
                phoneLoading &&
                  styles.disabledButton,
              ]}
              activeOpacity={0.8}
              onPress={handleVerifyOTP}
              disabled={phoneLoading}
            >
              {phoneLoading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.loginText}
                >
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>

            {/* RESEND */}

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={handleResendOTP}
              disabled={phoneLoading}
            >
              <Text
                style={styles.resendText}
              >
                Didn't receive OTP?{" "}
                Resend OTP
              </Text>
            </TouchableOpacity>

            {/* CHANGE NUMBER */}

            <TouchableOpacity
              style={
                styles.changeNumberContainer
              }
              onPress={
                handleChangeNumber
              }
            >
              <Text
                style={styles.changeNumber}
              >
                ← Change phone number
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* EMAIL SWITCH */}

        <TouchableOpacity
          style={styles.switchMethodButton}
          onPress={() =>
            setLoginMode("email")
          }
        >
          <Ionicons
            name="mail-outline"
            size={19}
            color="#2563EB"
          />

          <Text
            style={styles.switchMethodText}
          >
            Login with Email
          </Text>
        </TouchableOpacity>

        {/* SIGN UP */}

        <TouchableOpacity
          style={styles.signupContainer}
          onPress={() =>
            router.push("/signup")
          }
        >
          <Text
            style={styles.signupText}
          >
            Don't have an account?{" "}
            <Text
              style={styles.signupLink}
            >
              Sign Up
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 35,
  },

  choiceContent: {
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
    marginBottom: 30,
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },

  // ============================================
  // CHOICE BUTTONS
  // ============================================

  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 78,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    marginBottom: 15,

    elevation: 3,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  choiceTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  choiceTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  choiceSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  // ============================================
  // BACK
  // ============================================

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 25,
  },

  backText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  // ============================================
  // LABEL
  // ============================================

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },

  // ============================================
  // INPUT
  // ============================================

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

  // ============================================
  // PHONE
  // ============================================

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  countryCode: {
    marginLeft: 8,
    marginRight: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  // ============================================
  // OTP
  // ============================================

  otpDescription: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 21,
  },

  otpInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 5,
    color: "#111827",
  },

  // ============================================
  // BUTTON
  // ============================================

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
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 6,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  // ============================================
  // GOOGLE
  // ============================================

  googleButton: {
    height: 58,
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    marginTop: 15,

    elevation: 2,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  googleText: {
    marginLeft: 12,
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },

  // ============================================
  // DIVIDER
  // ============================================

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

  // ============================================
  // FORGOT
  // ============================================

  forgotContainer: {
    alignSelf: "flex-end",
    marginTop: 15,
  },

  forgotText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },

  // ============================================
  // SWITCH LOGIN METHOD
  // ============================================

  switchMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  switchMethodText: {
    marginLeft: 7,
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "700",
  },

  // ============================================
  // PHONE ERRORS
  // ============================================

  phoneError: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 19,
  },

  // ============================================
  // RESEND
  // ============================================

  resendContainer: {
    alignItems: "center",
    marginTop: 18,
  },

  resendText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },

  // ============================================
  // CHANGE NUMBER
  // ============================================

  changeNumberContainer: {
    alignItems: "center",
    marginTop: 18,
  },

  changeNumber: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },

  // ============================================
  // SIGNUP
  // ============================================

  signupContainer: {
    marginTop: 30,
    alignItems: "center",
  },

  signupText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },

  signupLink: {
    color: "#2563EB",
    fontWeight: "700",
  },
});