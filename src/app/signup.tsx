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
import { registerUser } from "../services/authService";

export default function SignupScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // Visibility states for passwords
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [agree, setAgree] = useState(false);

    async function validate() {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter your full name.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Error", "Please enter a valid email.");
            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            Alert.alert("Error", "Phone number must be 10 digits.");
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

        try {
            setLoading(true);

            // Calling your backend service
            await registerUser(name, email, password);

            Alert.alert("Success", "Account Created Successfully");
            router.replace("/login");

        } catch (e: any) {
            Alert.alert("Signup Failed", e.message);
        } finally {
            setLoading(false);
        }
        
        // ❌ Yahan par pehle ek setTimeout function tha jo logic kharab kar raha tha.
        // Wo maine hata diya hai kyunki registration 'try-catch' mein handle ho chuka hai.
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.logo}>🚗</Text>

            <Text style={styles.heading}>Create Account</Text>

            <Text style={styles.subtitle}>
                Create your Smart Voice Navigation account
            </Text>

            <View style={styles.inputBox}>
                <MaterialIcons name="person" size={22} color="#2563EB" />
                <TextInput
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                />
            </View>

            <View style={styles.inputBox}>
                <MaterialIcons name="email" size={22} color="#2563EB" />
                <TextInput
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                />
            </View>

            <View style={styles.inputBox}>
                <MaterialIcons name="phone" size={22} color="#2563EB" />
                <TextInput
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                />
            </View>

            {/* PASSWORD BOX */}
            <View style={styles.inputBox}>
                <MaterialIcons name="lock" size={22} color="#2563EB" />
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons 
                        name={showPassword ? "visibility" : "visibility-off"} 
                        size={22} 
                        color="#9CA3AF" 
                    />
                </TouchableOpacity>
            </View>

            {/* CONFIRM PASSWORD BOX */}
            <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={22} color="#2563EB" />
                <TextInput
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialIcons 
                        name={showConfirmPassword ? "visibility" : "visibility-off"} 
                        size={22} 
                        color="#9CA3AF" 
                    />
                </TouchableOpacity>
            </View>

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                }}
            >
                <TouchableOpacity onPress={() => setAgree(!agree)}>
                    <MaterialIcons
                        name={agree ? "check-box" : "check-box-outline-blank"}
                        size={26}
                        color="#2563EB"
                    />
                </TouchableOpacity>

                <Text
                    style={{
                        marginLeft: 10,
                        flex: 1,
                    }}
                >
                    I agree to the Terms & Conditions
                </Text>
            </View>

            <TouchableOpacity
                style={styles.signupButton}
                onPress={validate}
                disabled={loading} // Prevent multiple clicks
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.signupText}>Create Account</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginText}>
                    Already have an account? Login
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 25,
        paddingTop: 60,
    },
    logo: {
        fontSize: 60,
        textAlign: "center",
        marginBottom: 10,
    },
    heading: {
        fontSize: 32,
        fontWeight: "700",
        textAlign: "center",
        color: "#111827",
    },
    subtitle: {
        textAlign: "center",
        color: "#6B7280",
        marginTop: 8,
        marginBottom: 30,
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingHorizontal: 15,
        marginBottom: 18,
        height: 58,
        elevation: 2,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    signupButton: {
        backgroundColor: "#2563EB",
        height: 56,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 15,
    },
    signupText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 18,
    },
    loginText: {
        marginTop: 25,
        textAlign: "center",
        color: "#2563EB",
        fontWeight: "600",
    },
});