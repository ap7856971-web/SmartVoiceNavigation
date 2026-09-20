import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

export default function HomeWork() {
  const [user, setUser] = useState<any>(null);

  const [homeAddress, setHomeAddress] = useState("");
  const [workAddress, setWorkAddress] = useState("");

  // Render immediately; never block the first paint on Firebase.
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadLocalFirst = async () => {
      try {
        const cached = await AsyncStorage.getItem(
          "smartVoiceNavigation_homeWorkLocations"
        );

        if (!mounted || !cached) return;

        const data = JSON.parse(cached);

        setHomeAddress(
          typeof data.homeAddress === "string"
            ? data.homeAddress
            : ""
        );
        setWorkAddress(
          typeof data.workAddress === "string"
            ? data.workAddress
            : ""
        );
      } catch (error) {
        console.error("[HomeWork] Local load error:", error);
      }
    };

    // Local cache is background hydration; UI renders immediately.
    void loadLocalFirst();

    const unsubscribe = auth.onAuthStateChanged(
      (currentUser) => {
        if (!mounted) return;

        setUser(currentUser);

        if (!currentUser) return;

        // Firebase is background-only.
        void (async () => {
          try {
            const ref = doc(db, "users", currentUser.uid);
            const snap = await getDoc(ref);

            if (!mounted || !snap.exists()) return;

            const data = snap.data();

            const home =
              typeof data.homeAddress === "string"
                ? data.homeAddress
                : "";
            const work =
              typeof data.workAddress === "string"
                ? data.workAddress
                : "";

            setHomeAddress(home);
            setWorkAddress(work);

            // Refresh cache for the next instant open.
            await AsyncStorage.setItem(
              "smartVoiceNavigation_homeWorkLocations",
              JSON.stringify({
                homeAddress: home,
                workAddress: work,
              })
            );
          } catch (error) {
            console.error("[HomeWork] Firebase background load error:", error);
          }
        })();
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function saveLocations() {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login first."
      );
      return;
    }

    const home = homeAddress.trim();
    const work = workAddress.trim();

    if (!home && !work) {
      Alert.alert(
        "Address Required",
        "Please enter Home or Work address."
      );
      return;
    }

    setSaving(true);

    try {
      // Save locally first so the next open is instant.
      await AsyncStorage.setItem(
        "smartVoiceNavigation_homeWorkLocations",
        JSON.stringify({
          homeAddress: home,
          workAddress: work,
        })
      );

      setSaving(false);

      // Firebase sync does not block the UI.
      void setDoc(
        doc(db, "users", user.uid),
        {
          homeAddress: home,
          workAddress: work,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
        .then(() => {
          console.log("[HomeWork] Firebase background save successful");
        })
        .catch((error) => {
          console.error("[HomeWork] Firebase background save error:", error);
        });

      Alert.alert(
        "Saved Successfully",
        "Your Home and Work locations have been saved.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("[HomeWork] Local save error:", error);
      setSaving(false);

      Alert.alert(
        "Save Failed",
        error?.message || "Unable to save locations."
      );
    }
  }

  async function clearLocation(
    type: "home" | "work"
  ) {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login first."
      );
      return;
    }

    const label =
      type === "home" ? "Home" : "Work";

    Alert.alert(
      `Clear ${label}`,
      `Remove your saved ${label} location?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              const currentHome =
                type === "home" ? "" : homeAddress;
              const currentWork =
                type === "work" ? "" : workAddress;

              await AsyncStorage.setItem(
                "smartVoiceNavigation_homeWorkLocations",
                JSON.stringify({
                  homeAddress: currentHome,
                  workAddress: currentWork,
                })
              );

              if (type === "home") {
                setHomeAddress("");
              } else {
                setWorkAddress("");
              }

              // Firebase sync in background.
              void setDoc(
                doc(db, "users", user.uid),
                {
                  homeAddress: currentHome,
                  workAddress: currentWork,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch((firebaseError) => {
                console.error(
                  "[HomeWork] Firebase background clear error:",
                  firebaseError
                );
              });
            } catch (error: any) {
              console.error(
                "[HomeWork] Clear error:",
                error
              );

              Alert.alert(
                "Clear Failed",
                error?.message ||
                  `Unable to clear ${label} location.`
              );
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111827"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Home & Work
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* INFO */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="location"
              size={25}
              color="#2874F0"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Saved Locations
            </Text>

            <Text style={styles.infoText}>
              Save frequently used Home and Work
              locations for faster voice navigation.
            </Text>
          </View>
        </View>

        {/* HOME */}
        <AddressField
          label="Home Address"
          icon="home-outline"
          value={homeAddress}
          onChangeText={setHomeAddress}
          placeholder="Enter your home address"
          onClear={
            homeAddress.trim()
              ? () => clearLocation("home")
              : undefined
        }
        />

        {/* WORK */}
        <AddressField
          label="Work Address"
          icon="briefcase-outline"
          value={workAddress}
          onChangeText={setWorkAddress}
          placeholder="Enter your work address"
          onClear={
            workAddress.trim()
              ? () => clearLocation("work")
              : undefined
          }
        />

        {/* STATUS */}
        <View style={styles.statusCard}>
          <Ionicons
            name={
              homeAddress.trim() &&
              workAddress.trim()
                ? "checkmark-circle"
                : "information-circle-outline"
            }
            size={21}
            color={
              homeAddress.trim() &&
              workAddress.trim()
                ? "#16A34A"
                : "#6B7280"
            }
          />

          <Text style={styles.statusText}>
            {homeAddress.trim() &&
            workAddress.trim()
              ? "Home and Work are ready for voice navigation."
              : "You can save either Home, Work, or both."}
          </Text>
        </View>

        {/* SAVE */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          onPress={saveLocations}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.saveText}>
                Save Locations
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function AddressField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  onClear,
}: any) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
        </Text>

        {onClear && (
          <TouchableOpacity
            onPress={onClear}
            accessibilityLabel={`Clear ${label}`}
          >
            <Text style={styles.clearText}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputBox}>
        <Ionicons
          name={icon}
          size={22}
          color="#6B7280"
        />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  center: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
  },

  header: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  form: {
    padding: 20,
    paddingBottom: 45,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    elevation: 2,
  },

  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
  },

  field: {
    marginBottom: 18,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  clearText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },

  inputBox: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  input: {
    flex: 1,
    fontSize: 15,
    marginLeft: 11,
    color: "#111827",
    minHeight: 80,
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statusText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
  },

  saveButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#2874F0",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
