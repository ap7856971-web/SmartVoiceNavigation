import * as Location from "expo-location";
import * as Linking from "expo-linking";
import * as SMS from "expo-sms";
import React from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Vibration } from "react-native";

export default function EmergencyScreen() {
    const handleSOS = () => {
        Vibration.vibrate([300, 200, 300]);

        Alert.alert(
            "🚨 SOS Alert",
            "Emergency alert has been activated.",
            [
                {
                    text: "OK",
                },
            ]
        );
    };

    const handleShareLocation = () => {
        Alert.alert(
            "📍 Share Location",
            "Live Location feature will be connected in next phase."
        );
    };

    const handleCall = (name: string) => {
        Alert.alert(
            "📞 Emergency Contact",
            `Calling ${name}...`
        );
    };
    const getCurrentLocation = async () => {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Permission Denied",
      "Location permission is required."
    );
    return null;
  }

  const location =
    await Location.getCurrentPositionAsync({});

  return location.coords;
};
const callEmergency = async () => {
  const phone = "tel:+919876543210";

  const supported =
    await Linking.canOpenURL(phone);

  if (supported) {
    await Linking.openURL(phone);
  }
};
const sendSOS = async () => {
  const coords = await getCurrentLocation();

  if (!coords) return;

  const message =
    `🚨 SOS Alert!

I need help.

My Location:
https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;

  const available =
    await SMS.isAvailableAsync();

  if (available) {
    await SMS.sendSMSAsync(
      ["9876543210"],
      message
    );
  }
};

    return (
        <SafeAreaView style={styles.container}>

            {/* Header */}
            <View style={styles.header}>

                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons
                        name="chevron-back"
                        size={28}
                        color="#111827"
                    />
                </TouchableOpacity>

                <Text style={styles.title}>
                    SOS Emergency
                </Text>

            </View>

            {/* SOS Section */}
            <View style={styles.center}>

                <TouchableOpacity
                    style={styles.outerCircle}
                    activeOpacity={0.8}
                    onPress={handleSOS}
                >
                    <View style={styles.innerCircle}>
                        <Text style={styles.sosText}>
                            SOS
                        </Text>

                        <Text style={styles.tapText}>
                            Tap to Alert
                        </Text>
                    </View>
                </TouchableOpacity>

            </View>
            {/* Share Live Location */}

            <View style={styles.locationSection}>

                <Text style={styles.sectionTitle}>
                    Share Live Location
                </Text>

                <TouchableOpacity
                    style={styles.locationCard}
                    activeOpacity={0.8}
                    onPress={handleShareLocation}
                >
                    <View style={styles.locationLeft}>

                        <View style={styles.locationIcon}>
                            <Ionicons
                                name="location"
                                size={22}
                                color="#2563EB"
                            />
                        </View>

                        <Text style={styles.locationText}>
                            Share Location
                        </Text>

                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#999"
                    />
                </TouchableOpacity>

            </View>
            {/* Emergency Contacts */}

            <View style={styles.contactSection}>

                <Text style={styles.sectionTitle}>
                    Emergency Contacts
                </Text>

                {/* Mom */}

                <TouchableOpacity
                    style={styles.contactCard}
                    activeOpacity={0.8}
                    onPress={() => handleCall("Mom")}
                >
                    <View style={styles.contactLeft}>

                        <View style={styles.avatar}>
                            <Ionicons
                                name="person"
                                size={28}
                                color="#FFFFFF"
                            />
                        </View>

                        <View>
                            <Text style={styles.contactName}>
                                Mom
                            </Text>

                            <Text style={styles.contactNumber}>
                                +91 98765 43210
                            </Text>
                        </View>

                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#BDBDBD"
                    />
                </TouchableOpacity>

                {/* Brother */}

                <TouchableOpacity
                    style={styles.contactCard}
                    activeOpacity={0.8}
                    onPress={() => handleCall("Brother")}
                >
                    <View style={styles.contactLeft}>

                        <View style={styles.avatar}>
                            <Ionicons
                                name="person"
                                size={28}
                                color="#FFFFFF"
                            />
                        </View>

                        <View>
                            <Text style={styles.contactName}>
                                Brother
                            </Text>

                            <Text style={styles.contactNumber}>
                                +91 91234 56789
                            </Text>
                        </View>

                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#BDBDBD"
                    />
                </TouchableOpacity>

            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F4F7FB",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginLeft: 10,
        color: "#111827",
    },

    center: {
        alignItems: "center",
        marginTop: 40,
        marginBottom: 50,
    },

    outerCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "#FFD7D7",

        justifyContent: "center",
        alignItems: "center",
    },

    innerCircle: {
        width: 190,
        height: 190,
        borderRadius: 95,
        backgroundColor: "#FF3B30",

        justifyContent: "center",
        alignItems: "center",

        shadowColor: "#FF3B30",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
    },

    sosText: {
        color: "#FFFFFF",
        fontSize: 50,
        fontWeight: "bold",
    },

    tapText: {
        marginTop: 8,
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
    locationSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 15,
    },

    locationCard: {
        backgroundColor: "#FFFFFF",

        borderRadius: 18,

        padding: 18,

        flexDirection: "row",

        justifyContent: "space-between",

        alignItems: "center",

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3,
        },

        shadowOpacity: 0.08,

        shadowRadius: 5,

        elevation: 4,
    },

    locationLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    locationIcon: {
        width: 42,
        height: 42,

        borderRadius: 21,

        backgroundColor: "#EEF4FF",

        justifyContent: "center",
        alignItems: "center",

        marginRight: 15,
    },

    locationText: {
        fontSize: 17,
        fontWeight: "600",
        color: "#2563EB",
    },
    contactSection: {
        paddingHorizontal: 20,
        marginBottom: 40,
    },

    contactCard: {
        backgroundColor: "#FFFFFF",

        borderRadius: 18,

        padding: 16,

        marginBottom: 15,

        flexDirection: "row",

        justifyContent: "space-between",

        alignItems: "center",

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3,
        },

        shadowOpacity: 0.08,

        shadowRadius: 5,

        elevation: 4,
    },

    contactLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 52,
        height: 52,

        borderRadius: 26,

        backgroundColor: "#2563EB",

        justifyContent: "center",
        alignItems: "center",

        marginRight: 15,
    },

    contactName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },

    contactNumber: {
        marginTop: 4,
        fontSize: 15,
        color: "#6B7280",
    },
});