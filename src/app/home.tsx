import React, { useEffect, useRef, useState } from "react";

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
import { useTheme } from "../context/ThemeContext";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

// ==================================================
// STORAGE
// ==================================================

const HOME_STORAGE_KEY =
    "smartVoiceNavigation_homeDetails";

const HOME_WORK_CACHE_KEY =
    "smartVoiceNavigation_homeWorkCache";

// ==================================================
// TYPE
// ==================================================

type HomeDetails = {
    houseNumber: string;
    street: string;
    area: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    landmark: string;
};

// ==================================================
// EMPTY HOME
// ==================================================

const EMPTY_HOME: HomeDetails = {
    houseNumber: "",
    street: "",
    area: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    landmark: "",
};

// ==================================================
// HOME / WORK SCREEN
// ==================================================

export default function HomeWorkScreen() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);
    const [loadingLocation, setLoadingLocation] =
        useState(false);
    const [saving, setSaving] = useState(false);

    const [user, setUser] = useState<any>(null);

    const [homeDetails, setHomeDetails] =
        useState<HomeDetails>(EMPTY_HOME);

    // ==================================================
    // AUTH + LOAD
    // ==================================================

    const firebaseLoadStarted = useRef(false);

    useEffect(() => {
        let mounted = true;

        // ULTRA FAST: render the screen immediately.
        // AsyncStorage hydrates the fields in the background.
        const loadLocalHome = async () => {
            try {
                const saved =
                    await AsyncStorage.getItem(
                        HOME_STORAGE_KEY
                    );

                if (!mounted || !saved) {
                    return;
                }

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
            } catch (error) {
                console.error(
                    "[Home] Local background load error:",
                    error
                );
            }
        };

        // Never wait for storage before first paint.
        void loadLocalHome();

        const unsubscribe =
            auth.onAuthStateChanged((currentUser) => {
                if (!mounted) {
                    return;
                }

                setUser(currentUser);

                if (!currentUser) {
                    return;
                }

                // Avoid duplicate Firebase reads during auth re-renders.
                if (firebaseLoadStarted.current) {
                    return;
                }

                firebaseLoadStarted.current = true;

                // Firebase sync happens in the background.
                void loadHomeDetails(currentUser.uid);
            });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    // ==================================================
    // LOAD HOME DETAILS
    // ==================================================

    const loadHomeDetails = async (
        uid: string
    ) => {
        try {
            const userRef = doc(
                db,
                "users",
                uid
            );

            const snapshot =
                await getDoc(userRef);

            if (!snapshot.exists()) {
                return;
            }

            const data = snapshot.data();

            let firebaseHome: HomeDetails;

            if (
                data.homeDetails &&
                typeof data.homeDetails ===
                    "object"
            ) {
                const savedHome =
                    data.homeDetails;

                firebaseHome = {
                    houseNumber:
                        savedHome.houseNumber || "",
                    street:
                        savedHome.street || "",
                    area:
                        savedHome.area || "",
                    city:
                        savedHome.city || "",
                    state:
                        savedHome.state || "",
                    country:
                        savedHome.country || "",
                    pincode:
                        savedHome.pincode || "",
                    landmark:
                        savedHome.landmark || "",
                };
            } else {
                // Support existing/simple home fields.
                firebaseHome = {
                    ...EMPTY_HOME,
                    houseNumber:
                        data.homeHouseNumber || "",
                    street:
                        data.homeStreet || "",
                    area:
                        data.homeArea || "",
                    city:
                        data.homeCity || "",
                    state:
                        data.homeState || "",
                    country:
                        data.homeCountry || "",
                    pincode:
                        data.homePincode || "",
                    landmark:
                        data.homeLandmark || "",
                };
            }

            const hasFirebaseData =
                Object.values(
                    firebaseHome
                ).some(
                    (value) =>
                        value.trim().length > 0
                );

            if (!hasFirebaseData) {
                return;
            }

            // Firebase is only a background source of truth.
            // The UI was already rendered from AsyncStorage.
            setHomeDetails(firebaseHome);

            // Refresh local cache so the next open is instant.
            await AsyncStorage.setItem(
                HOME_STORAGE_KEY,
                JSON.stringify(firebaseHome)
            );

            // Keep the Home card on the Map screen in sync.
            const homeAddress =
                buildHomeAddress(firebaseHome);

            try {
                const existingCache =
                    await AsyncStorage.getItem(
                        HOME_WORK_CACHE_KEY
                    );

                const cache =
                    existingCache
                        ? JSON.parse(existingCache)
                        : {};

                await AsyncStorage.setItem(
                    HOME_WORK_CACHE_KEY,
                    JSON.stringify({
                        ...cache,
                        homeAddress,
                        homeDetails: firebaseHome,
                    })
                );
            } catch (cacheError) {
                console.error(
                    "[Home] Shared cache update error:",
                    cacheError
                );
            }
        } catch (error) {
            // Do not block or disturb the already visible local UI.
            console.error(
                "[Home] Firebase background load error:",
                error
            );
        }
    };

    // ==================================================
    // UPDATE FIELD
    // ==================================================

    const updateField = (
        field: keyof HomeDetails,
        value: string
    ) => {
        setHomeDetails((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // ==================================================
    // BUILD ADDRESS
    // ==================================================

    const buildHomeAddress = (
        details: HomeDetails
    ) => {
        return [
            details.houseNumber,
            details.street,
            details.area,
            details.city,
            details.state,
            details.country,
            details.pincode,
            details.landmark,
        ]
            .map((value) => value.trim())
            .filter(Boolean)
            .join(", ");
    };

    // ==================================================
    // CURRENT LOCATION
    // ==================================================

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
                    accuracy:
                        Location.Accuracy.High,
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

            const address =
                addresses[0];

            const houseNumber =
                address.streetNumber ||
                "";

            const street =
                address.street ||
                "";

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
                address.country ||
                "India";

            const pincode =
                address.postalCode ||
                "";

            setHomeDetails(
                (previous) => ({
                    ...previous,

                    houseNumber:
                        houseNumber ||
                        previous.houseNumber,

                    street:
                        street ||
                        previous.street,

                    area:
                        area ||
                        previous.area,

                    city:
                        city ||
                        previous.city,

                    state:
                        state ||
                        previous.state,

                    country:
                        country ||
                        previous.country,

                    pincode:
                        pincode ||
                        previous.pincode,
                })
            );

            Alert.alert(
                "Location Added",
                "Your current location has been added to Home details."
            );
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

    // ==================================================
    // SAVE HOME
    // ==================================================

    const saveHome = async () => {
        try {
            const hasAddress =
                homeDetails.houseNumber.trim() ||
                homeDetails.street.trim() ||
                homeDetails.area.trim() ||
                homeDetails.city.trim();

            if (!hasAddress) {
                Alert.alert(
                    "Address Required",
                    "Please add your current location or enter your home address."
                );

                return false;
            }

            if (
                homeDetails.pincode.trim() &&
                !/^\\d{6}$/.test(
                    homeDetails.pincode.trim()
                )
            ) {
                Alert.alert(
                    "Invalid Pincode",
                    "Please enter a valid 6-digit pincode."
                );

                return false;
            }

            setSaving(true);

            const cleanHome: HomeDetails = {
                houseNumber:
                    homeDetails.houseNumber.trim(),

                street:
                    homeDetails.street.trim(),

                area:
                    homeDetails.area.trim(),

                city:
                    homeDetails.city.trim(),

                state:
                    homeDetails.state.trim(),

                country:
                    homeDetails.country.trim(),

                pincode:
                    homeDetails.pincode.trim(),

                landmark:
                    homeDetails.landmark.trim(),
            };

            const homeAddress =
                buildHomeAddress(cleanHome);

            // ------------------------------------------
            // LOCAL SAVE FIRST
            // ------------------------------------------

            await AsyncStorage.setItem(
                HOME_STORAGE_KEY,
                JSON.stringify(cleanHome)
            );

            // Keep Map Home card instantly updated.
            try {
                const existingCache =
                    await AsyncStorage.getItem(
                        HOME_WORK_CACHE_KEY
                    );

                const cache =
                    existingCache
                        ? JSON.parse(existingCache)
                        : {};

                await AsyncStorage.setItem(
                    HOME_WORK_CACHE_KEY,
                    JSON.stringify({
                        ...cache,
                        homeAddress,
                        homeDetails: cleanHome,
                    })
                );
            } catch (cacheError) {
                console.error(
                    "[Home] Shared cache save error:",
                    cacheError
                );
            }

            setHomeDetails(cleanHome);

            // ------------------------------------------
            // DO NOT WAIT FOR FIREBASE
            // ------------------------------------------

            setSaving(false);

            if (user) {
                void setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        homeDetails: cleanHome,
                        homeAddress,

                        homeHouseNumber:
                            cleanHome.houseNumber,

                        homeStreet:
                            cleanHome.street,

                        homeArea:
                            cleanHome.area,

                        homeCity:
                            cleanHome.city,

                        homeState:
                            cleanHome.state,

                        homeCountry:
                            cleanHome.country,

                        homePincode:
                            cleanHome.pincode,

                        homeLandmark:
                            cleanHome.landmark,

                        updatedAt:
                            serverTimestamp(),
                    },
                    {
                        merge: true,
                    }
                )
                    .then(() => {
                        console.log(
                            "[Home] Firebase background save successful"
                        );
                    })
                    .catch((firebaseError) => {
                        console.error(
                            "[Home] Firebase background save error:",
                            firebaseError
                        );
                    });
            }

            return true;
        } catch (error) {
            console.error(
                "[Home] Save error:",
                error
            );

            setSaving(false);

            Alert.alert(
                "Error",
                "Unable to save Home details."
            );

            return false;
        }
    };

    // ==================================================
    // HANDLE SAVE
    // ==================================================

    const handleSave = async () => {
        const saved =
            await saveHome();

        if (saved) {
            router.replace(
                "/(tabs)/"
            );
        }
    };

    // ==================================================
    // SCREEN
    // ==================================================

    return (
        <SafeAreaView
            style={styles.container}
        >
            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={
                    styles.scrollContent
                }
                keyboardShouldPersistTaps="handled"
            >
                {/* HEADER */}

                <View
                    style={styles.header}
                >
                    <View>
                        <Text
                            style={
                                styles.title
                            }
                        >
                            Your Home
                        </Text>

                        <Text
                            style={
                                styles.subtitle
                            }
                        >
                            Add your complete home details
                        </Text>
                    </View>

                    <View
                        style={
                            styles.homeIcon
                        }
                    >
                        <Ionicons
                            name="home"
                            size={26}
                            color={colors.primary}
                        />
                    </View>
                </View>

                {/* CURRENT LOCATION */}

                <TouchableOpacity
                    style={
                        styles.currentLocationButton
                    }
                    activeOpacity={0.85}
                    onPress={
                        useCurrentLocation
                    }
                    disabled={
                        loadingLocation ||
                        saving
                    }
                >
                    <View
                        style={
                            styles.currentLocationIcon
                        }
                    >
                        {loadingLocation ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                            />
                        ) : (
                            <Ionicons
                                name="locate"
                                size={24}
                                color={colors.primary}
                            />
                        )}
                    </View>

                    <View
                        style={
                            styles.locationButtonText
                        }
                    >
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
                        color={colors.primary}
                    />
                </TouchableOpacity>

                {/* HOME ADDRESS */}

                <View
                    style={styles.section}
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Home Address
                    </Text>

                    <InputField
                        label="House / Flat Number"
                        icon="home-outline"
                        placeholder="e.g. 111/26"
                        value={
                            homeDetails.houseNumber
                        }
                        onChangeText={(value) =>
                            updateField(
                                "houseNumber",
                                value
                            )
                        }
                        editable={!saving}
                    />

                    <InputField
                        label="Street / Road"
                        icon="navigate-outline"
                        placeholder="Enter street or road"
                        value={
                            homeDetails.street
                        }
                        onChangeText={(value) =>
                            updateField(
                                "street",
                                value
                            )
                        }
                        editable={!saving}
                    />

                    <InputField
                        label="Area / Colony *"
                        icon="location-outline"
                        placeholder="Enter colony / area"
                        value={
                            homeDetails.area
                        }
                        onChangeText={(value) =>
                            updateField(
                                "area",
                                value
                            )
                        }
                        editable={!saving}
                    />

                    <InputField
                        label="City *"
                        icon="business-outline"
                        placeholder="Enter city"
                        value={
                            homeDetails.city
                        }
                        onChangeText={(value) =>
                            updateField(
                                "city",
                                value
                            )
                        }
                        editable={!saving}
                    />

                    <InputField
                        label="State *"
                        icon="map-outline"
                        placeholder="Enter state"
                        value={
                            homeDetails.state
                        }
                        onChangeText={(value) =>
                            updateField(
                                "state",
                                value
                            )
                        }
                        editable={!saving}
                    />

                    <InputField
                        label="Country *"
                        icon="globe-outline"
                        placeholder="Enter country"
                        value={
                            homeDetails.country
                        }
                        onChangeText={(value) =>
                            updateField(
                                "country",
                                value
                            )
                        }
                        editable={!saving}
                    />

                    <InputField
                        label="Pincode"
                        icon="mail-outline"
                        placeholder="Enter pincode"
                        value={
                            homeDetails.pincode
                        }
                        onChangeText={(value) =>
                            updateField(
                                "pincode",
                                value.replace(
                                    /\D/g,
                                    ""
                                )
                            )
                        }
                        keyboardType="numeric"
                        maxLength={6}
                        editable={!saving}
                    />

                    {/* LANDMARK */}

                    <View
                        style={
                            styles.inputGroup
                        }
                    >
                        <Text
                            style={
                                styles.label
                            }
                        >
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
                                style={
                                    styles.textAreaIcon
                                }
                            />

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                ]}
                                placeholder="Nearby landmark"
                                placeholderTextColor={colors.secondary}
                                multiline
                                value={
                                    homeDetails.landmark
                                }
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "landmark",
                                        value
                                    )
                                }
                                editable={!saving}
                            />
                        </View>
                    </View>
                </View>

                {/* SAVE */}

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        (saving ||
                            loadingLocation) &&
                            styles.saveButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={
                        handleSave
                    }
                    disabled={
                        saving ||
                        loadingLocation
                    }
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

                            <Text
                                style={
                                    styles.saveButtonText
                                }
                            >
                                Save Home
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* SYNC INFO */}

                <View
                    style={
                        styles.syncBox
                    }
                >
                    <Ionicons
                        name="cloud-done-outline"
                        size={20}
                        color="#16A34A"
                    />

                    <Text
                        style={
                            styles.syncText
                        }
                    >
                        Home details are saved
                        locally and synced with
                        your Firebase profile when
                        you are logged in.
                    </Text>
                </View>

                {/* INFO */}

                <View
                    style={
                        styles.infoBox
                    }
                >
                    <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color={colors.primary}
                    />

                    <Text
                        style={
                            styles.infoText
                        }
                    >
                        Tap "Use Current Location"
                        to automatically fill your
                        current address. You can edit
                        any field before saving.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ==================================================
// INPUT FIELD
// ==================================================

function InputField({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType,
    maxLength,
    editable = true,
}: any) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    return (
        <View
            style={styles.inputGroup}
        >
            <Text
                style={styles.label}
            >
                {label}
            </Text>

            <View
                style={[
                    styles.inputContainer,
                    !editable &&
                        styles.disabledInput,
                ]}
            >
                <Ionicons
                    name={icon}
                    size={19}
                    color={
                        editable
                            ? colors.icon
                            : isDark
                                ? "#64748B"
                                : "#D1D5DB"
                    }
                />

                <TextInput
                    style={[
                        styles.input,
                        !editable &&
                            styles.disabledText,
                    ]}
                    placeholder={
                        placeholder
                    }
                    placeholderTextColor={colors.secondary}
                    value={value}
                    onChangeText={
                        onChangeText
                    }
                    keyboardType={
                        keyboardType
                    }
                    maxLength={
                        maxLength
                    }
                    editable={editable}
                    autoCapitalize="words"
                />
            </View>
        </View>
    );
}

// ==================================================
// STYLES
// ==================================================

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    loadingScreen: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        marginTop: 10,
        color: colors.secondary,
        fontSize: 14,
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },

    // HEADER

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: colors.text,
    },

    subtitle: {
        fontSize: 14,
        color: colors.secondary,
        marginTop: 5,
    },

    homeIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: isDark ? "#1E1B4B" : "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
    },

    // CURRENT LOCATION

    currentLocationButton: {
        backgroundColor: isDark ? "#172554" : "#EFF6FF",
        borderWidth: 1,
        borderColor: isDark ? "#1D4ED8" : "#BFDBFE",
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
        backgroundColor: colors.card,
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
        color: colors.secondary,
        marginTop: 3,
    },

    // SECTION

    section: {
        backgroundColor: colors.card,
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
        color: colors.text,
        marginBottom: 18,
    },

    inputGroup: {
        marginBottom: 15,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: isDark ? "#D1D5DB" : "#374151",
        marginBottom: 7,
    },

    inputContainer: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 13,
        backgroundColor: colors.background,
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
    },

    disabledInput: {
        backgroundColor: isDark ? "#243044" : "#F3F4F6",
    },

    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: colors.text,
        paddingVertical: 12,
    },

    disabledText: {
        color: colors.secondary,
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

    // SAVE

    saveButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: "#4F46E5",
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4F46E5",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },

    saveButtonDisabled: {
        opacity: 0.7,
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
        marginLeft: 8,
    },

    // SYNC

    syncBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#10251A" : "#F0FDF4",
        borderRadius: 14,
        padding: 13,
        marginTop: 15,
        borderWidth: 1,
        borderColor: isDark ? "#166534" : "#BBF7D0",
    },

    syncText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        color: isDark ? "#86EFAC" : "#166534",
        marginLeft: 8,
    },

    // INFO

    infoBox: {
        flexDirection: "row",
        backgroundColor: isDark ? "#172554" : "#EFF6FF",
        borderRadius: 14,
        padding: 13,
        marginTop: 15,
    },

    infoText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        color: isDark ? "#CBD5E1" : "#4B5563",
        marginLeft: 8,
    },
});

// Styles are generated from the global theme so the whole screen follows Settings → Dark Mode.
let styles: ReturnType<typeof createStyles>;