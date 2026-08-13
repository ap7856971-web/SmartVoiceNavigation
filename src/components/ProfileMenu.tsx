import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// ध्यान दें: अपने फोल्डर स्ट्रक्चर के हिसाब से सही पाथ डालें
import { sendPhoneOTP, verifyPhoneOTP } from "../../src/services/phoneAuth";

export default function PhoneLoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Send OTP Function
  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit number.");
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOTP(phoneNumber);
      setIsOtpSent(true);
      Alert.alert("OTP Sent", "Test OTP is 123456");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Function
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const user = await verifyPhoneOTP(otp);
      Alert.alert("Success", "Logged in successfully!");
      
      // Login होने के बाद Home या Profile स्क्रीन पर भेजें
      // router.replace('/profile'); 
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {isOtpSent ? "Enter OTP" : "Login with Phone"}
          </Text>
          <Text style={styles.subtitle}>
            {isOtpSent
              ? `We have sent a verification code to +91 ${phoneNumber}`
              : "Enter your phone number to receive a verification code."}
          </Text>

          {/* Conditional Input Rendering */}
          {!isOtpSent ? (
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="number-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { paddingLeft: 15, letterSpacing: 5 }]}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={isOtpSent ? handleVerifyOTP : handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isOtpSent ? "Verify & Login" : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Option */}
          {isOtpSent && (
            <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.resendBtn}>
              <Text style={styles.resendText}>Change Phone Number</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#6B7280", marginBottom: 40, lineHeight: 22 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 25,
    height: 55,
  },
  prefix: {
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  resendBtn: { marginTop: 20, alignSelf: "center" },
  resendText: { color: "#3B82F6", fontSize: 15, fontWeight: "600" },
});