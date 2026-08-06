import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
    SafeAreaView,
    StyleSheet,
    View,
    TouchableOpacity,
    TextInput,
    Text,
    ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";



export default function MapScreen() {
    const [selected, setSelected] = useState("All");

    const categories = [
        "All",
        "ATM",
        "Hospital",
        "Petrol Pump",
        "Restaurant",
        "Police",
    ];
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState({
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        const { status } =
            await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
            return;
        }

        const location =
            await Location.getCurrentPositionAsync({});

        const currentRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

        setRegion(currentRegion);

        mapRef.current?.animateToRegion(currentRegion, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* Search Bar */}

            <View style={styles.searchContainer}>

                <Ionicons
                    name="search"
                    size={22}
                    color="#999"
                />

                <TextInput
                    placeholder="Search destination"
                    placeholderTextColor="#999"
                    style={styles.input}
                />

                <TouchableOpacity style={styles.voiceButton}>
                    <Ionicons
                        name="mic"
                        size={20}
                        color="#fff"
                    />
                </TouchableOpacity>

            </View>
            {/* Category Chips */}

            <View style={styles.categoryContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    {categories.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.chip,
                                selected === item && styles.activeChip,
                            ]}
                            onPress={() => setSelected(item)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    selected === item && styles.activeChipText,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Google Map */}

           <MapView
    provider={PROVIDER_GOOGLE}
    ref={mapRef}
    style={styles.map}
    region={region}
    showsUserLocation
    followsUserLocation
    loadingEnabled
    showsCompass
    showsScale
    showsBuildings
    showsTraffic={false}
    showsMyLocationButton={false}
>
    <Marker coordinate={region} />
</MapView>

            {/* Bottom Sheet */}

            <View style={styles.bottomSheet}>

                <View style={styles.dragBar} />

                <Text style={styles.bottomTitle}>
                    Where to?
                </Text>

                <TouchableOpacity
                    style={styles.chooseCard}
                    activeOpacity={0.8}
                >
                    <Text style={styles.chooseText}>
                        Choose on map
                    </Text>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#999"
                    />
                </TouchableOpacity>

                {/* Home */}

                <TouchableOpacity
                    style={styles.placeCard}
                    activeOpacity={0.8}
                >
                    <View style={styles.placeLeft}>

                        <View style={styles.placeIcon}>
                            <Ionicons
                                name="home"
                                size={22}
                                color="#2563EB"
                            />
                        </View>

                        <View>
                            <Text style={styles.placeTitle}>
                                Home
                            </Text>

                            <Text style={styles.placeSubtitle}>
                                Connaught Place, New Delhi
                            </Text>
                        </View>

                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#999"
                    />
                </TouchableOpacity>

                {/* Work */}

                <TouchableOpacity
                    style={styles.placeCard}
                    activeOpacity={0.8}
                >
                    <View style={styles.placeLeft}>

                        <View style={styles.placeIcon}>
                            <Ionicons
                                name="briefcase"
                                size={22}
                                color="#2563EB"
                            />
                        </View>

                        <View>
                            <Text style={styles.placeTitle}>
                                Work
                            </Text>

                            <Text style={styles.placeSubtitle}>
                                Add Work Address
                            </Text>
                        </View>

                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#999"
                    />
                </TouchableOpacity>

            </View>
            {/* Floating Buttons */}

            <View style={styles.floatingButtons}>

                <TouchableOpacity style={styles.floatBtn}>
                    <Ionicons
                        name="location"
                        size={24}
                        color="#2563EB"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.floatBtn,
                        { marginTop: 15 },
                    ]}
                >
                    <Ionicons
                        name="pin"
                        size={24}
                        color="#FF3B30"
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

    searchContainer: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        zIndex: 10,

        backgroundColor: "#FFF",

        borderRadius: 16,

        paddingHorizontal: 15,

        flexDirection: "row",

        alignItems: "center",

        height: 58,

        elevation: 6,
    },

    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },

    voiceButton: {
        width: 42,
        height: 42,

        borderRadius: 21,

        backgroundColor: "#2563EB",

        justifyContent: "center",
        alignItems: "center",
    },

    map: {
        flex: 1,
    },

    floatingButtons: {
        position: "absolute",
        right: 20,
        top: 170,
    },

    floatBtn: {
        width: 55,
        height: 55,

        borderRadius: 28,

        backgroundColor: "#FFF",

        justifyContent: "center",
        alignItems: "center",

        elevation: 6,
    },
    categoryContainer: {
        position: "absolute",
        top: 90,
        left: 15,
        right: 15,
        zIndex: 10,
    },

    chip: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 22,
        marginRight: 10,
        elevation: 3,
    },

    activeChip: {
        backgroundColor: "#2563EB",
    },

    chipText: {
        color: "#333",
        fontSize: 15,
        fontWeight: "600",
    },

    activeChipText: {
        color: "#FFFFFF",
    },
    bottomSheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,

        backgroundColor: "#FFFFFF",

        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,

        padding: 22,

        elevation: 15,

        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },

    dragBar: {
        width: 50,
        height: 5,

        borderRadius: 3,

        backgroundColor: "#DDD",

        alignSelf: "center",

        marginBottom: 20,
    },

    bottomTitle: {
        fontSize: 30,
        fontWeight: "700",
        color: "#111827",

        marginBottom: 18,
    },

    chooseCard: {
        flexDirection: "row",

        justifyContent: "space-between",

        alignItems: "center",

        marginBottom: 25,
    },

    chooseText: {
        fontSize: 17,
        color: "#6B7280",
    },

    placeCard: {
        flexDirection: "row",

        justifyContent: "space-between",

        alignItems: "center",

        backgroundColor: "#FFFFFF",

        borderRadius: 18,

        padding: 18,

        marginBottom: 15,

        elevation: 3,
    },

    placeLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    placeIcon: {
        width: 48,
        height: 48,

        borderRadius: 24,

        backgroundColor: "#EEF4FF",

        justifyContent: "center",
        alignItems: "center",

        marginRight: 15,
    },

    placeTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },

    placeSubtitle: {
        marginTop: 5,
        color: "#6B7280",
        fontSize: 14,
    },

});