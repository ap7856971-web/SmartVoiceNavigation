import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import { router } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";

// ==================================================
// DEFAULT AVATAR
// ==================================================

const DEFAULT_AVATAR =
  "https://i.pravatar.cc/150?img=12";

// ==================================================
// STORAGE
// ==================================================

const PROFILE_STORAGE_KEY =
  "smartVoiceNavigation_profile";

const PENDING_PROFILE_KEY =
  "smartVoiceNavigation_pendingProfile";

// ==================================================
// PROFILE TYPE
// ==================================================

type ProfileData = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  photoURL: string;
};

// ==================================================
// EDIT PROFILE SCREEN
// ==================================================

export default function EditProfile() {
  // ==================================================
  // USER
  // ==================================================

  const [user, setUser] = useState<any>(null);

  // ==================================================
  // PROFILE
  // ==================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [photoURL, setPhotoURL] =
    useState(DEFAULT_AVATAR);

  // ==================================================
  // STATES
  // ==================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ==================================================
  // LOAD USER + PROFILE
  // ==================================================

  const firebaseLoadStarted = useRef(false);

  useEffect(() => {
    let mounted = true;

    const applyProfile = (profile: ProfileData) => {
      if (!mounted) return;

      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setGender(profile.gender || "");
      setPhotoURL(
        profile.photoURL || DEFAULT_AVATAR
      );
    };

    // ------------------------------------------
    // LOCAL PROFILE FIRST
    // ------------------------------------------
    const loadLocalProfile = async () => {
      try {
        const localData =
          await AsyncStorage.getItem(
            PROFILE_STORAGE_KEY
          );

        if (!mounted || !localData) {
          return;
        }

        const parsed = JSON.parse(localData);

        if (
          parsed &&
          parsed.uid === auth.currentUser?.uid
        ) {
          applyProfile({
            uid: parsed.uid,
            name: parsed.name || "",
            email: parsed.email || "",
            phone: parsed.phone || "",
            gender: parsed.gender || "",
            photoURL:
              parsed.photoURL || DEFAULT_AVATAR,
          });

          console.log(
            "[EditProfile] Local profile loaded"
          );
        }
      } catch (error) {
        console.log(
          "[EditProfile] Local profile error:",
          error
        );
      } finally {
        if (mounted) {
          // Firebase must never block the first screen render.
          setLoading(false);
        }
      }
    };

    // Start local load immediately.
    void loadLocalProfile();

    const unsubscribe =
      auth.onAuthStateChanged((currentUser) => {
        if (!mounted) return;

        console.log(
          "[EditProfile] Auth user:",
          currentUser?.uid
        );

        setUser(currentUser);

        if (!currentUser) {
          setLoading(false);

          Alert.alert(
            "Login Required",
            "Please login first.",
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace("/login");
                },
              },
            ]
          );

          return;
        }

        if (firebaseLoadStarted.current) {
          return;
        }

        firebaseLoadStarted.current = true;

        // ------------------------------------------
        // FIREBASE BACKGROUND SYNC
        // ------------------------------------------
        void (async () => {
          try {
            console.log(
              "[EditProfile] Loading Firebase profile:",
              currentUser.uid
            );

            const userRef = doc(
              db,
              "users",
              currentUser.uid
            );

            const snapshot =
              await getDoc(userRef);

            if (snapshot.exists()) {
              const data =
                snapshot.data();

              let localProfile:
                | Partial<ProfileData>
                | null = null;

              try {
                const cached =
                  await AsyncStorage.getItem(
                    PROFILE_STORAGE_KEY
                  );

                if (cached) {
                  const parsed =
                    JSON.parse(cached);

                  if (
                    parsed?.uid ===
                    currentUser.uid
                  ) {
                    localProfile = parsed;
                  }
                }
              } catch {
                // Firebase data can still be used.
              }

              const firebaseProfile: ProfileData = {
                uid: currentUser.uid,

                name:
                  data.name ||
                  currentUser.displayName ||
                  localProfile?.name ||
                  "",

                email:
                  data.email ||
                  currentUser.email ||
                  localProfile?.email ||
                  "",

                phone:
                  data.phone ||
                  currentUser.phoneNumber ||
                  localProfile?.phone ||
                  "",

                gender:
                  data.gender ||
                  localProfile?.gender ||
                  "",

                photoURL:
                  data.photoURL ||
                  currentUser.photoURL ||
                  localProfile?.photoURL ||
                  DEFAULT_AVATAR,
              };

              applyProfile(firebaseProfile);

              await AsyncStorage.setItem(
                PROFILE_STORAGE_KEY,
                JSON.stringify(firebaseProfile)
              );

              console.log(
                "[EditProfile] Firebase profile synced to local cache"
              );
            } else {
              const newProfile: ProfileData = {
                uid: currentUser.uid,

                name:
                  currentUser.displayName || "",

                email:
                  currentUser.email || "",

                phone:
                  currentUser.phoneNumber || "",

                gender: "",

                photoURL:
                  currentUser.photoURL ||
                  DEFAULT_AVATAR,
              };

              applyProfile(newProfile);

              await AsyncStorage.setItem(
                PROFILE_STORAGE_KEY,
                JSON.stringify(newProfile)
              );

              // Create the Firebase document without blocking the UI.
              void setDoc(
                userRef,
                {
                  ...newProfile,
                  createdAt:
                    serverTimestamp(),
                  updatedAt:
                    serverTimestamp(),
                },
                { merge: true }
              )
                .then(() => {
                  console.log(
                    "[EditProfile] Firebase profile created in background"
                  );
                })
                .catch((error) => {
                  console.log(
                    "[EditProfile] Firebase background create failed:",
                    error
                  );
                });
            }

            // Pending sync is also background work.
            void syncPendingProfile(
              currentUser.uid
            );
          } catch (error) {
            // Cached profile is already visible.
            console.log(
              "[EditProfile] Firebase background load error:",
              error
            );

            void syncPendingProfile(
              currentUser.uid
            );
          }
        })();
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ==================================================
  // PICK PHOTO
  // ==================================================

  async function pickPhoto() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow gallery permission."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        setPhotoURL(
          result.assets[0].uri
        );
      }
    } catch (error) {
      console.error(
        "[EditProfile] Photo error:",
        error
      );

      Alert.alert(
        "Photo Error",
        "Unable to select photo."
      );
    }
  }

  // ==================================================
  // VALIDATION
  // ==================================================

  function validatePhone(value: string) {
    const normalized = value.replace(/[\\s()-]/g, "");
    if (!normalized) return true;

    // Accept common Indian +91 / 10-digit formats.
    return /^(?:\\+91)?[6-9]\\d{9}$/.test(normalized);
  }

  // ==================================================
  // CREATE PROFILE DATA
  // ==================================================

  function createProfileData(): ProfileData {
    return {
      uid: user.uid,

      name: name.trim(),

      email: email.trim(),

      phone: phone.trim(),

      gender: gender,

      photoURL:
        photoURL ||
        DEFAULT_AVATAR,
    };
  }

  // ==================================================
  // SAVE LOCAL
  // ==================================================

  async function saveLocalProfile(
    profileData: ProfileData
  ) {
    await AsyncStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(profileData)
    );

    console.log(
      "[EditProfile] Profile saved locally"
    );
  }

  // ==================================================
  // SAVE PENDING
  // ==================================================

  async function savePendingProfile(
    profileData: ProfileData
  ) {
    await AsyncStorage.setItem(
      PENDING_PROFILE_KEY,
      JSON.stringify(profileData)
    );

    console.log(
      "[EditProfile] Firebase sync pending"
    );
  }

  // ==================================================
  // FIREBASE SAVE
  // ==================================================

  async function syncProfileToFirebase(
    profileData: ProfileData
  ) {
    console.log(
      "[EditProfile] Firebase background write starting..."
    );

    try {
      await setDoc(
        doc(
          db,
          "users",
          profileData.uid
        ),
        {
          uid: profileData.uid,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          gender: profileData.gender,
          photoURL: profileData.photoURL,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      console.log(
        "[EditProfile] Firebase WRITE successful"
      );

      await AsyncStorage.removeItem(
        PENDING_PROFILE_KEY
      );

    } catch (error: any) {

      console.log(
        "[EditProfile] Firebase background sync failed:",
        error?.code,
        error?.message
      );

      // Firebase fail hone par bhi local profile safe hai.
      // Pending profile storage mein rahega.
    }
  }


  // ==================================================
  // PENDING FIREBASE SYNC
  // ==================================================

  async function syncPendingProfile(
    uid: string
  ) {
    try {
      const pending =
        await AsyncStorage.getItem(
          PENDING_PROFILE_KEY
        );

      if (!pending) {
        return;
      }

      const profileData: ProfileData =
        JSON.parse(pending);

      if (
        !profileData ||
        profileData.uid !== uid
      ) {
        return;
      }

      console.log(
        "[EditProfile] Trying pending Firebase sync..."
      );

      await syncProfileToFirebase(
        profileData
      );
    } catch (error) {
      console.log(
        "[EditProfile] Pending sync skipped:",
        error
      );
    }
  }

  // ==================================================
  // SAVE PROFILE
  // ==================================================

  async function saveProfile() {
    // ------------------------------------------
    // USER CHECK
    // ------------------------------------------

    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login first."
      );

      return;
    }

    // ------------------------------------------
    // NAME CHECK
    // ------------------------------------------

    if (!name.trim()) {
      Alert.alert(
        "Name Required",
        "Please enter your name."
      );

      return;
    }

    if (
      phone.trim() &&
      !validatePhone(phone.trim())
    ) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid Indian mobile number."
      );

      return;
    }

    // ------------------------------------------
    // PREVENT DOUBLE CLICK
    // ------------------------------------------

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const profileData =
        createProfileData();

      // ========================================
      // LOCAL SAVE FIRST
      // ========================================

      await saveLocalProfile(
        profileData
      );

      // Keep a pending copy until Firebase confirms.
      await savePendingProfile(
        profileData
      );

      // ========================================
      // FIREBASE BACKGROUND SYNC
      // ========================================

      const currentAuthUser =
        auth.currentUser;

      if (currentAuthUser) {
        const authProfileUpdate: {
          displayName?: string;
          photoURL?: string;
        } = {};

        if (profileData.name) {
          authProfileUpdate.displayName =
            profileData.name;
        }

        // Local file:// URI cannot be used as a remote Auth photo URL.
        if (
          /^https?:\/\//i.test(
            profileData.photoURL
          )
        ) {
          authProfileUpdate.photoURL =
            profileData.photoURL;
        }

        if (
          Object.keys(authProfileUpdate)
            .length > 0
        ) {
          // Auth update is also background work.
          void updateProfile(
            currentAuthUser,
            authProfileUpdate
          )
            .then(() => {
              console.log(
                "[EditProfile] Firebase Auth profile background update successful"
              );
            })
            .catch((error) => {
              console.log(
                "[EditProfile] Firebase Auth background update failed:",
                error
              );
            });
        }
      }

      void syncProfileToFirebase(
        profileData
      );

      // The user does not need to wait for Firebase.
      setSaving(false);

      Alert.alert(
        "Profile Updated",
        "Profile phone mein save ho gaya hai. Firebase background mein sync ho raha hai.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "[EditProfile] Local save error:",
        error
      );

      setSaving(false);

      Alert.alert(
        "Save Failed",
        error?.message ||
          "Unable to save profile."
      );
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color="#2874F0"
        />

        <Text
          style={styles.loadingText}
        >
          Loading Profile...
        </Text>
      </SafeAreaView>
    );
  }

  // ==================================================
  // SCREEN
  // ==================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* ==========================================
          HEADER
      ========================================== */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          disabled={saving}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111827"
          />
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
        >
          Edit Profile
        </Text>

        <View
          style={{
            width: 28,
          }}
        />
      </View>

      {/* ==========================================
          FORM
      ========================================== */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.form
        }
      >
        {/* ========================================
            PHOTO
        ======================================== */}

        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={pickPhoto}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri:
                photoURL ||
                DEFAULT_AVATAR,
            }}
            style={styles.avatar}
          />

          <View
            style={styles.camera}
          >
            <Ionicons
              name="camera"
              size={18}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <Text
          style={styles.changePhoto}
        >
          Tap photo to change
        </Text>

        <View style={styles.syncBadge}>
          <Ionicons name="cloud-done-outline" size={15} color="#2874F0" />
          <Text style={styles.syncBadgeText}>
            Profile sync enabled
          </Text>
        </View>

        {/* ========================================
            NAME
        ======================================== */}

        <Field
          label="Full Name"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          editable={!saving}
        />

        {/* ========================================
            EMAIL
        ======================================== */}

        <Field
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          editable={false}
        />

        {/* ========================================
            PHONE
        ======================================== */}

        <Field
          label="Phone Number"
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 XXXXX XXXXX"
          keyboardType="phone-pad"
          editable={!saving}
          maxLength={15}
        />

        {/* ========================================
            GENDER
        ======================================== */}

        <Text
          style={styles.label}
        >
          Gender
        </Text>

        <View
          style={styles.genderRow}
        >
          {[
            "Male",
            "Female",
            "Other",
          ].map((item) => {
            const selected =
              gender === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.genderButton,
                  selected &&
                  styles.genderSelected,
                ]}
                onPress={() =>
                  setGender(item)
                }
                disabled={saving}
              >
                <Text
                  style={[
                    styles.genderText,
                    selected &&
                    styles.genderTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================
            SAVE BUTTON
        ======================================== */}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving &&
            styles.saveButtonDisabled,
          ]}
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={styles.saveText}
              >
                Saving...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text
                style={styles.saveText}
              >
                Save Changes
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================================================
// INPUT FIELD
// ==================================================

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  maxLength,
}: any) {
  return (
    <View
      style={styles.field}
    >
      <Text
        style={styles.label}
      >
        {label}
      </Text>

      <View
        style={[
          styles.inputBox,
          !editable &&
          styles.disabledInput,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            editable
              ? "#6B7280"
              : "#9CA3AF"
          }
        />

        <TextInput
          style={[
            styles.input,
            !editable &&
            styles.disabledText,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
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

  // ================================================
  // HEADER
  // ================================================

  header: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  // ================================================
  // FORM
  // ================================================

  form: {
    padding: 20,
    paddingBottom: 45,
  },

  // ================================================
  // PHOTO
  // ================================================

  avatarWrap: {
    alignSelf: "center",
    position: "relative",
    marginTop: 10,
  },

  avatar: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: "#E5E7EB",
  },

  camera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2874F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  changePhoto: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 25,
  },

  syncBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 22,
  },

  syncBadgeText: {
    color: "#2874F0",
    fontSize: 12,
    fontWeight: "600",
  },

  // ================================================
  // FIELD
  // ================================================

  field: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  inputBox: {
    minHeight: 53,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  disabledInput: {
    backgroundColor: "#F1F3F5",
  },

  input: {
    flex: 1,
    fontSize: 15,
    marginLeft: 11,
    color: "#111827",
  },

  disabledText: {
    color: "#6B7280",
  },

  // ================================================
  // GENDER
  // ================================================

  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },

  genderButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  genderSelected: {
    backgroundColor: "#2874F0",
    borderColor: "#2874F0",
  },

  genderText: {
    color: "#111827",
    fontWeight: "600",
  },

  genderTextSelected: {
    color: "#FFFFFF",
  },

  // ================================================
  // SAVE
  // ================================================

  saveButton: {
    minHeight: 53,
    borderRadius: 14,
    backgroundColor: "#2874F0",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 5,
  },

  saveButtonDisabled: {
    opacity: 0.75,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});