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

const WORK_STORAGE_KEY =
  "smartVoiceNavigation_workDetails";

const HOME_WORK_CACHE_KEY =
  "smartVoiceNavigation_homeWorkCache";

// ==================================================
// TYPE
// ==================================================

type WorkDetails = {
  officeName: string;
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
// EMPTY DATA
// ==================================================

const EMPTY_WORK: WorkDetails = {
  officeName: "",
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
// WORK SCREEN
// ==================================================

export default function WorkScreen() {
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<any>(null);

  const [workDetails, setWorkDetails] =
    useState<WorkDetails>(EMPTY_WORK);

  const mountedRef = useRef(true);
  const firebaseLoadStartedRef = useRef(false);

  // ==================================================
  // CLEANUP
  // ==================================================

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ==================================================
  // LOCAL LOAD FIRST
  // ==================================================

  useEffect(() => {
    const loadLocalFirst = async () => {
      try {
        const saved =
          await AsyncStorage.getItem(WORK_STORAGE_KEY);

        if (saved && mountedRef.current) {
          const data = JSON.parse(saved);

          setWorkDetails({
            officeName: data.officeName || "",
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
          "[Work] Local load error:",
          error
        );
      } finally {
        // Firebase kabhi initial screen ko block nahi karega.
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void loadLocalFirst();
  }, []);

  // ==================================================
  // AUTH + FIREBASE BACKGROUND SYNC
  // ==================================================

  useEffect(() => {
    const unsubscribe =
      auth.onAuthStateChanged((currentUser) => {
        if (!mountedRef.current) return;

        setUser(currentUser);

        if (!currentUser) return;

        if (!firebaseLoadStartedRef.current) {
          firebaseLoadStartedRef.current = true;
          void loadWorkFromFirebase(currentUser.uid);
        }
      });

    return unsubscribe;
  }, []);

  // ==================================================
  // FIREBASE BACKGROUND LOAD
  // ==================================================

  const loadWorkFromFirebase = async (uid: string) => {
    try {
      const userRef = doc(
        db,
        "users",
        uid
      );

      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) return;

      const data = snapshot.data();

      let firebaseWork: WorkDetails;

      if (
        data.workDetails &&
        typeof data.workDetails === "object"
      ) {
        const savedWork = data.workDetails;

        firebaseWork = {
          officeName:
            savedWork.officeName || "",
          houseNumber:
            savedWork.houseNumber || "",
          street:
            savedWork.street || "",
          area:
            savedWork.area || "",
          city:
            savedWork.city || "",
          state:
            savedWork.state || "",
          country:
            savedWork.country || "",
          pincode:
            savedWork.pincode || "",
          landmark:
            savedWork.landmark || "",
        };
      } else {
        firebaseWork = {
          ...EMPTY_WORK,
          officeName:
            data.workOfficeName || "",
          area:
            data.workArea || "",
          city:
            data.workCity || "",
          state:
            data.workState || "",
          country:
            data.workCountry || "",
          pincode:
            data.workPincode || "",
          landmark:
            data.workLandmark || "",
        };
      }

      const hasFirebaseData =
        Object.values(firebaseWork).some(
          (value) =>
            String(value).trim().length > 0
        );

      if (!hasFirebaseData) return;

      if (mountedRef.current) {
        setWorkDetails(firebaseWork);
      }

      // Firebase data ko local cache mein refresh karo.
      await AsyncStorage.setItem(
        WORK_STORAGE_KEY,
        JSON.stringify(firebaseWork)
      );

      // Map/Home-Work cards ke shared cache ko update karo.
      try {
        const existing =
          await AsyncStorage.getItem(
            HOME_WORK_CACHE_KEY
          );

        const cache = existing
          ? JSON.parse(existing)
          : {};

        await AsyncStorage.setItem(
          HOME_WORK_CACHE_KEY,
          JSON.stringify({
            ...cache,
            workAddress:
              buildWorkAddress(firebaseWork),
          })
        );
      } catch (cacheError) {
        console.error(
          "[Work] Shared cache update error:",
          cacheError
        );
      }
    } catch (error) {
      // Firebase slow/offline hone par local data
      // screen par available rahega.
      console.error(
        "[Work] Firebase background load error:",
        error
      );
    }
  };

  // ==================================================
  // UPDATE FIELD
  // ==================================================

  const updateField = (
    field: keyof WorkDetails,
    value: string
  ) => {
    setWorkDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==================================================
  // FORMAT ADDRESS
  // ==================================================

  const buildWorkAddress = (
    details: WorkDetails
  ) => {
    return [
      details.officeName,
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
          "Location Permission Required",
          "Please allow location permission to automatically fill your work address."
        );

        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const { latitude, longitude } =
        location.coords;

      console.log(
        "[Work] GPS:",
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
          "Address Not Found",
          "Unable to find address details for your current location."
        );

        return;
      }

      const address = addresses[0];

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

      const houseNumber =
        address.streetNumber || "";

      setWorkDetails((previous) => ({
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
      }));

      Alert.alert(
        "Location Added",
        "Your current location has been added to Work details."
      );
    } catch (error) {
      console.error(
        "[Work] Current location error:",
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
  // SAVE WORK
  // ==================================================

  const saveWork = async () => {
    try {
      const hasAddress =
        workDetails.officeName.trim() ||
        workDetails.houseNumber.trim() ||
        workDetails.street.trim() ||
        workDetails.area.trim() ||
        workDetails.city.trim();

      if (!hasAddress) {
        Alert.alert(
          "Work Details Required",
          "Please use your current location or add your work details."
        );

        return false;
      }

      if (
        workDetails.pincode.trim() &&
        !/^\d{6}$/.test(
          workDetails.pincode.trim()
        )
      ) {
        Alert.alert(
          "Invalid Pincode",
          "Please enter a valid 6-digit pincode."
        );

        return false;
      }

      setSaving(true);

      const cleanWork: WorkDetails = {
        officeName:
          workDetails.officeName.trim(),
        houseNumber:
          workDetails.houseNumber.trim(),
        street:
          workDetails.street.trim(),
        area:
          workDetails.area.trim(),
        city:
          workDetails.city.trim(),
        state:
          workDetails.state.trim(),
        country:
          workDetails.country.trim(),
        pincode:
          workDetails.pincode.trim(),
        landmark:
          workDetails.landmark.trim(),
      };

      const workAddress =
        buildWorkAddress(cleanWork);

      // ==================================================
      // 1. LOCAL SAVE — FAST
      // ==================================================

      await AsyncStorage.setItem(
        WORK_STORAGE_KEY,
        JSON.stringify(cleanWork)
      );

      // Map/Home cards ko bhi instantly update karo.
      try {
        const existing =
          await AsyncStorage.getItem(
            HOME_WORK_CACHE_KEY
          );

        const cache = existing
          ? JSON.parse(existing)
          : {};

        await AsyncStorage.setItem(
          HOME_WORK_CACHE_KEY,
          JSON.stringify({
            ...cache,
            workAddress,
          })
        );
      } catch (cacheError) {
        console.error(
          "[Work] Shared cache save error:",
          cacheError
        );
      }

      if (mountedRef.current) {
        setWorkDetails(cleanWork);
        setSaving(false);
      }

      // ==================================================
      // 2. FIREBASE SAVE — BACKGROUND
      // ==================================================

      if (user) {
        void setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            workDetails: cleanWork,
            workAddress,
            workOfficeName:
              cleanWork.officeName,
            workArea:
              cleanWork.area,
            workCity:
              cleanWork.city,
            workState:
              cleanWork.state,
            workCountry:
              cleanWork.country,
            workPincode:
              cleanWork.pincode,
            workLandmark:
              cleanWork.landmark,
            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        )
          .then(() =>
            console.log(
              "[Work] Firebase background save successful"
            )
          )
          .catch((firebaseError) =>
            console.error(
              "[Work] Firebase background save error:",
              firebaseError
            )
          );
      }

      return true;
    } catch (error) {
      console.error(
        "[Work] Save error:",
        error
      );

      if (mountedRef.current) {
        setSaving(false);

        Alert.alert(
          "Error",
          "Unable to save Work details locally."
        );
      }

      return false;
    }
  };

  // ==================================================
  // HANDLE SAVE
  // ==================================================

  const handleSave = async () => {
    const saved = await saveWork();

    if (saved) {
      // Local save complete hote hi immediately back.
      // Firebase sync background mein continue karega.
      router.replace("/(tabs)/");
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading Work Details...
        </Text>
      </SafeAreaView>
    );
  }

  // ==================================================
  // SCREEN
  // ==================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Your Work
            </Text>

            <Text style={styles.subtitle}>
              Add your complete work details
            </Text>
          </View>

          <View style={styles.workIcon}>
            <Ionicons
              name="briefcase"
              size={26}
              color="#2563EB"
            />
          </View>
        </View>

        {/* CURRENT LOCATION */}

        <TouchableOpacity
          style={
            styles.currentLocationButton
          }
          activeOpacity={0.85}
          onPress={useCurrentLocation}
          disabled={
            loadingLocation || saving
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
              Automatically fill your work address
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#2563EB"
          />
        </TouchableOpacity>

        {/* WORK ADDRESS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Work Address
          </Text>

          <InputField
            label="Office / Company Name"
            icon="business-outline"
            placeholder="Office or company name"
            value={workDetails.officeName}
            onChangeText={(value) =>
              updateField(
                "officeName",
                value
              )
            }
            editable={!saving}
          />

          <InputField
            label="Building / Flat / Office Number"
            icon="home-outline"
            placeholder="e.g. Tower A, 3rd Floor"
            value={workDetails.houseNumber}
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
            value={workDetails.street}
            onChangeText={(value) =>
              updateField(
                "street",
                value
              )
            }
            editable={!saving}
          />

          <InputField
            label="Area / Colony"
            icon="location-outline"
            placeholder="Area / Colony"
            value={workDetails.area}
            onChangeText={(value) =>
              updateField(
                "area",
                value
              )
            }
            editable={!saving}
          />

          <InputField
            label="City"
            icon="business-outline"
            placeholder="City"
            value={workDetails.city}
            onChangeText={(value) =>
              updateField(
                "city",
                value
              )
            }
            editable={!saving}
          />

          <InputField
            label="State"
            icon="map-outline"
            placeholder="State"
            value={workDetails.state}
            onChangeText={(value) =>
              updateField(
                "state",
                value
              )
            }
            editable={!saving}
          />

          <InputField
            label="Country"
            icon="globe-outline"
            placeholder="Country"
            value={workDetails.country}
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
            placeholder="Pincode"
            value={workDetails.pincode}
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
                placeholderTextColor="#9CA3AF"
                multiline
                value={
                  workDetails.landmark
                }
                onChangeText={(value) =>
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
          onPress={handleSave}
          disabled={
            saving || loadingLocation
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
                Save Work
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* SYNC INFO */}

        <View style={styles.syncBox}>
          <Ionicons
            name="cloud-done-outline"
            size={20}
            color="#16A34A"
          />

          <Text style={styles.syncText}>
            Work details are saved locally
            and synced with your Firebase
            profile when you are logged in.
          </Text>
        </View>

        {/* INFO */}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#2563EB"
          />

          <Text style={styles.infoText}>
            Tap "Use Current Location" and
            your available address details will
            be filled automatically. You can
            still edit them if needed.
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
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
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
              ? "#9CA3AF"
              : "#D1D5DB"
          }
        />

        <TextInput
          style={[
            styles.input,
            !editable &&
              styles.disabledText,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
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
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },

  workIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // CURRENT LOCATION

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

  // SECTION

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

  disabledInput: {
    backgroundColor: "#F3F4F6",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 12,
  },

  disabledText: {
    color: "#6B7280",
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

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },

  // FIREBASE SYNC

  syncBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 13,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  syncText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#166534",
    marginLeft: 8,
  },

  // INFO

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
