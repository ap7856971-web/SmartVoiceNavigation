import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const HOME_STORAGE_KEY =
    "smartVoiceNavigation_homeDetails";

export default function HomeWorkScreen() {
    const [loadingLocation, setLoadingLocation] =
        useState(false);

    const [saving, setSaving] = useState(false);

    const [homeDetails, setHomeDetails] = useState({
        houseNumber: "",
        street: "",
        area: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        landmark: "",
    });

    /* =====================================================
       LOAD SAVED HOME DETAILS
    ===================================================== */

    useEffect(() => {
        loadHomeDetails();
    }, []);

    const loadHomeDetails = async () => {
        try {
            const saved =
                await AsyncStorage.getItem(
                    HOME_STORAGE_KEY
                );

            if (saved) {
                const data = JSON.parse(saved);

                setHomeDetails({
                    houseNumber: data.houseNumber || "",
                    street: data.street || "",
                    area: data.area || "",
                    city: data.city || "",
                    state: data.state || "",
                    country: data.country || "",
                    pincode: data.pincode || "",
                    landmark: data.landmark || "",
                });
            }
        } catch (error) {
            console.error(
                "[Home] Load error:",
                error
            );
        }
    };

    /* =====================================================
       UPDATE FIELD
    ===================================================== */

    const updateField = (
        field: keyof typeof homeDetails,
        value: string
    ) => {
        setHomeDetails((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    /* =====================================================
       USE CURRENT LOCATION
    ===================================================== */

    const useCurrentLocation = async () => {
        try {
            setLoadingLocation(true);

            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Location Permission",
                    "Please allow location permission to automatically fill your home address."
                );

                return;
            }

            const location =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

            const {
                latitude,
                longitude,
            } = location.coords;

            console.log(
                "[Home] GPS:",
                latitude,
                longitude
            );

            const addresses =
                await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });

            if (!addresses.length) {
                Alert.alert(
                    "Location Error",
                    "Address details could not be found."
                );

                return;
            }

            const address = addresses[0];

            /*
             * Reverse geocoding fields can vary by device/provider.
             * We intentionally avoid putting address.name first
             * because it may contain a house/plot number.
             */

            const houseNumber =
                address.streetNumber || "";

            const street =
                address.street || "";

            const area =
                address.district ||
                address.subregion ||
                address.street ||
                "";

            const city =
                address.city ||
                address.subregion ||
                address.district ||
                "";

            const state =
                address.region || "";

            const country =
                address.country || "India";

            const pincode =
                address.postalCode || "";

            setHomeDetails((previous) => ({
                ...previous,

                houseNumber:
                    houseNumber || previous.houseNumber,

                street:
                    street || previous.street,

                area:
                    area || previous.area,

                city:
                    city || previous.city,

                state:
                    state || previous.state,

                country:
                    country || previous.country,

                pincode:
                    pincode || previous.pincode,
            }));


        } catch (error) {
            console.error(
                "[Home] Current location error:",
                error
            );

            Alert.alert(
                "Location Error",
                "Unable to get your current location. Please try again."
            );
        } finally {
            setLoadingLocation(false);
        }
    };

    /* =====================================================
       SAVE HOME
    ===================================================== */

    const saveHome = async () => {
        try {
            if (
                !homeDetails.area &&
                !homeDetails.city
            ) {
                Alert.alert(
                    "Address Required",
                    "Please add your current location or enter your home address."
                );

                return false;
            }

            setSaving(true);

            await AsyncStorage.setItem(
                HOME_STORAGE_KEY,
                JSON.stringify(homeDetails)
            );

            return true;
        } catch (error) {
            console.error(
                "[Home] Save error:",
                error
            );

            Alert.alert(
                "Error",
                "Unable to save Home details."
            );

            return false;
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.scrollContent
                }
            >
                {/* =================================================
            HEADER
        ================================================= */}

                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>
                            Your Home
                        </Text>

                        <Text style={styles.subtitle}>
                            Add your complete home details
                        </Text>
                    </View>

                    <View style={styles.homeIcon}>
                        <Ionicons
                            name="home"
                            size={26}
                            color="#4F46E5"
                        />
                    </View>
                </View>

                {/* =================================================
            CURRENT LOCATION BUTTON
        ================================================= */}

                <TouchableOpacity
                    style={styles.currentLocationButton}
                    activeOpacity={0.85}
                    onPress={useCurrentLocation}
                    disabled={loadingLocation}
                >
                    <View
                        style={styles.currentLocationIcon}
                    >
                        {loadingLocation ? (
                            <ActivityIndicator
                                size="small"
                                color="#2563EB"
                            />
                        ) : (
                            <Ionicons
                                name="locate"
                                size={24}
                                color="#2563EB"
                            />
                        )}
                    </View>

                    <View style={styles.locationButtonText}>
                        <Text
                            style={
                                styles.currentLocationTitle
                            }
                        >
                            {loadingLocation
                                ? "Getting your location..."
                                : "Use Current Location"}
                        </Text>

                        <Text
                            style={
                                styles.currentLocationSubtitle
                            }
                        >
                            Automatically fill your address
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#2563EB"
                    />
                </TouchableOpacity>

                {/* =================================================
            HOME ADDRESS SECTION
        ================================================= */}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Home Address
                    </Text>

                    {/* House Number */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            House / Flat Number
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="home-outline"
                                size={19}
                                color="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 111/26"
                                placeholderTextColor="#9CA3AF"
                                value={
                                    homeDetails.houseNumber
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "houseNumber",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>

                    {/* Street */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Street / Road
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="navigate-outline"
                                size={19}
                                color="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Enter street or road"
                                placeholderTextColor="#9CA3AF"
                                value={homeDetails.street}
                                onChangeText={(value) =>
                                    updateField(
                                        "street",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>

                    {/* Area */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Area / Colony *
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="location-outline"
                                size={19}
                                color="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Enter colony / area"
                                placeholderTextColor="#9CA3AF"
                                value={homeDetails.area}
                                onChangeText={(value) =>
                                    updateField(
                                        "area",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>

                    {/* City */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            City *
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="business-outline"
                                size={19}
                                color="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Enter city"
                                placeholderTextColor="#9CA3AF"
                                value={homeDetails.city}
                                onChangeText={(value) =>
                                    updateField(
                                        "city",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>

                    {/* State */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            State *
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="map-outline"
                                size={19}
                                color="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Enter state"
                                placeholderTextColor="#9CA3AF"
                                value={homeDetails.state}
                                onChangeText={(value) =>
                                    updateField(
                                        "state",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>

                    {/* Country */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Country *
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="globe-outline"
                                size={19}
                                color="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Enter country"
                                placeholderTextColor="#9CA3AF"
                                value={homeDetails.country}
                                onChangeText={(value) =>
                                    updateField(
                                        "country",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>

                    {/* Pincode */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Pincode
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="mail-outline"
                                size={19}
                                color="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Enter pincode"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                maxLength={6}
                                value={
                                    homeDetails.pincode
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "pincode",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>

                    {/* Landmark */}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Landmark
                        </Text>

                        <View
                            style={[
                                styles.inputContainer,
                                styles.textAreaContainer,
                            ]}
                        >
                            <Ionicons
                                name="flag-outline"
                                size={19}
                                color="#9CA3AF"
                                style={styles.textAreaIcon}
                            />

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                ]}
                                placeholder="Nearby landmark"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                value={
                                    homeDetails.landmark
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "landmark",
                                        value
                                    )
                                }
                            />
                        </View>
                    </View>
                </View>

                {/* =================================================
            SAVE BUTTON
        ================================================= */}

                <TouchableOpacity
                    style={styles.saveButton}
                    activeOpacity={0.85}
                    onPress={async () => {
                        const saved = await saveHome();

                        if (saved) {
                            router.replace("/(tabs)/");
                        }
                    }}
                    disabled={saving || loadingLocation}
                >
                    {saving ? (
                        <ActivityIndicator
                            color="#FFFFFF"
                        />
                    ) : (
                        <>
                            <Ionicons
                                name="save-outline"
                                size={22}
                                color="#FFFFFF"
                            />

                            <Text style={styles.saveButtonText}>
                                Save Home
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* =================================================
            INFO
        ================================================= */}

                <View style={styles.infoBox}>
                    <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color="#2563EB"
                    />

                    <Text style={styles.infoText}>
                        Tap "Use Current Location" to
                        automatically fill your current
                        address. You can edit any field
                        before saving.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#111827",
    },

    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 5,
    },

    homeIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
    },

    currentLocationButton: {
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
        borderRadius: 18,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 25,
    },

    currentLocationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },

    locationButtonText: {
        flex: 1,
        marginLeft: 12,
    },

    currentLocationTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#2563EB",
    },

    currentLocationSubtitle: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 3,
    },

    section: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 18,
    },

    inputGroup: {
        marginBottom: 15,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 7,
    },

    inputContainer: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 13,
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
    },

    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: "#111827",
        paddingVertical: 12,
    },

    textAreaContainer: {
        alignItems: "flex-start",
        paddingTop: 13,
    },

    textAreaIcon: {
        marginTop: 2,
    },

    textArea: {
        minHeight: 70,
        textAlignVertical: "top",
    },

    saveButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: "#2563EB",
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#2563EB",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
        marginLeft: 8,
    },

    infoBox: {
        flexDirection: "row",
        backgroundColor: "#EFF6FF",
        borderRadius: 14,
        padding: 13,
        marginTop: 15,
    },

    infoText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        color: "#4B5563",
        marginLeft: 8,
    },
});