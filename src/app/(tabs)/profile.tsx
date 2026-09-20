import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";

const DEFAULT_AVATAR =
  "https://i.pravatar.cc/150?img=12";

const PROFILE_STORAGE_KEY =
  "smartVoiceNavigation_profile";

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [user, setUser] = useState<any>(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);
  const [authReady, setAuthReady] = useState(!!auth.currentUser);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] =
    useState(DEFAULT_AVATAR);

  const [showPhotoOptions, setShowPhotoOptions] =
    useState(false);

  // =========================
  // LOAD USER
  // =========================

  const firebaseLoadStarted = useRef(false);

  useEffect(() => {
    let mounted = true;

    const applyProfile = (profile: any) => {
      if (!mounted) return;
      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setPhotoURL(profile.photoURL || DEFAULT_AVATAR);
    };

    const currentUser = auth.currentUser;

    // Auth data is available immediately; do not wait for Firestore.
    if (currentUser && mounted) {
      setUser(currentUser);
      setAuthReady(true);
      setLoading(false);

      applyProfile({
        name: currentUser.displayName || "",
        email: currentUser.email || "",
        phone: currentUser.phoneNumber || "",
        photoURL: currentUser.photoURL || DEFAULT_AVATAR,
      });
    }

    // Local cache first.
    const loadLocalProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved && mounted) {
          applyProfile(JSON.parse(saved));
        }
      } catch (error) {
        console.log("[Profile] Local load error:", error);
      } finally {
        if (mounted && !auth.currentUser) {
          setLoading(false);
        }
      }
    };

    void loadLocalProfile();

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!mounted) return;

      setUser(currentUser);
      setAuthReady(true);
      setLoading(false);

      if (!currentUser || firebaseLoadStarted.current) return;

      firebaseLoadStarted.current = true;

      // Firestore is background-only and never blocks the profile UI.
      void (async () => {
        try {
          const ref = doc(db, "users", currentUser.uid);
          const snap = await getDoc(ref);

          if (!mounted) return;

          if (snap.exists()) {
            const data = snap.data();
            const profile = {
              name: data.name || currentUser.displayName || "",
              email: data.email || currentUser.email || "",
              phone: data.phone || currentUser.phoneNumber || "",
              photoURL:
                data.photoURL ||
                currentUser.photoURL ||
                DEFAULT_AVATAR,
            };

            applyProfile(profile);
            await AsyncStorage.setItem(
              PROFILE_STORAGE_KEY,
              JSON.stringify(profile)
            );
          } else {
            const basicProfile = {
              name: currentUser.displayName || "",
              email: currentUser.email || "",
              phone: currentUser.phoneNumber || "",
              photoURL: currentUser.photoURL || DEFAULT_AVATAR,
            };

            applyProfile(basicProfile);

            void setDoc(
              ref,
              {
                ...basicProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            ).catch((error) => {
              console.log(
                "[Profile] Background profile create error:",
                error
              );
            });

            await AsyncStorage.setItem(
              PROFILE_STORAGE_KEY,
              JSON.stringify(basicProfile)
            );
          }
        } catch (error) {
          console.log(
            "[Profile] Firebase background load error:",
            error
          );
        }
      })();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authReady && !user) {
      router.replace("/");
    }
  }, [authReady, user]);

  // =========================
  // SAVE PHOTO
  // =========================

  async function savePhoto(uri: string) {
    setPhotoURL(uri);

    // Local save first.
    try {
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          name,
          email,
          phone,
          photoURL: uri,
        })
      );
    } catch (error) {
      console.log(
        "[Profile] Local photo save error:",
        error
      );
    }

    if (!user) return;

    // Firebase sync runs in the background.
    void setDoc(
      doc(db, "users", user.uid),
      {
        photoURL: uri,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
      .then(() => {
        console.log(
          "[Profile] Firebase photo background save successful"
        );
      })
      .catch((error) => {
        console.log(
          "[Profile] Firebase photo background save error:",
          error
        );
      });
  }

  // =========================
  // GALLERY
  // =========================

  async function chooseGallery() {
    setShowPhotoOptions(false);

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery permission from phone settings."
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
      await savePhoto(
        result.assets[0].uri
      );
    }
  }

  // =========================
  // CAMERA
  // =========================

  async function chooseCamera() {
    setShowPhotoOptions(false);

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow camera permission from phone settings."
      );

      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

    if (
      !result.canceled &&
      result.assets?.[0]?.uri
    ) {
      await savePhoto(
        result.assets[0].uri
      );
    }
  }

  // =========================
  // LOGOUT
  // =========================

  async function logout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
              router.replace("/");
            } catch (error) {
              console.log("[Profile] Logout error:", error);
              Alert.alert("Logout Failed", "Please try again.");
            }
          },
        },
      ]
    );
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading Profile...
        </Text>
      </SafeAreaView>
    );
  }

  // =========================
  // NO USER
  // =========================

  if (!authReady || !user) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />
      </SafeAreaView>
    );
  }

  // =========================
  // PROFILE UI
  // =========================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scroll
        }
      >

        {/* HEADER */}

        <Text style={styles.headerTitle}>
          Profile
        </Text>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>

          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() =>
              setShowPhotoOptions(true)
            }
          >

            <Image
              source={{
                uri: photoURL,
              }}
              style={styles.avatar}
            />

            <View
              style={styles.cameraIcon}
            >
              <Ionicons
                name="camera"
                size={16}
                color="#FFFFFF"
              />
            </View>

          </TouchableOpacity>

          <View style={styles.userInfo}>

            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {name || "User"}
            </Text>

            <Text
              style={styles.profileSub}
              numberOfLines={1}
            >
              {email ||
                "Add your email"}
            </Text>

            <Text
              style={styles.profileSub}
            >
              {phone ||
                "Add your phone number"}
            </Text>

          </View>

        </View>

        {/* MENU */}

        <View style={styles.menu}>

          {/* EDIT PROFILE */}

          <MenuItem
            icon="create-outline"
            title="Edit Profile"
            onPress={() =>
              router.push(
                "/edit-profile"
              )
            }
          />

          {/* HOME WORK */}

          <MenuItem
            icon="home-outline"
            title="Home & Work"
            onPress={() =>
              router.push(
                "/home-work"
              )
            }
          />

          {/* EMERGENCY */}

          <MenuItem
            icon="call-outline"
            title="Emergency Contacts"
            onPress={() =>
              router.push(
                "/emergency-contacts"
              )
            }
          />

          {/* SETTINGS */}

          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() =>
              router.push(
                "/settings"
              )
            }
          />

          {/* HELP */}

          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() =>
              router.push(
                "/help-support"
              )
            }
          />

          {/* ABOUT */}

          <MenuItem
            icon="information-circle-outline"
            title="About Us"
            onPress={() =>
              router.push(
                "/about"
              )
            }
          />

        </View>

        {/* LOGOUT */}

        <TouchableOpacity
          style={styles.logout}
          onPress={logout}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#EF4444"
          />

          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* PHOTO MODAL */}

      <Modal
        visible={showPhotoOptions}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowPhotoOptions(false)
        }
      >

        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() =>
            setShowPhotoOptions(false)
          }
        >

          <View
            style={styles.photoSheet}
          >

            <Text
              style={styles.sheetTitle}
            >
              Profile Photo
            </Text>

            {/* CAMERA */}

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={chooseCamera}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={colors.primary}
              />

              <Text
                style={styles.sheetText}
              >
                Camera
              </Text>
            </TouchableOpacity>

            {/* GALLERY */}

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={chooseGallery}
            >
              <Ionicons
                name="images-outline"
                size={24}
                color={colors.primary}
              />

              <Text
                style={styles.sheetText}
              >
                Gallery
              </Text>
            </TouchableOpacity>

            {/* CANCEL */}

            <TouchableOpacity
              style={styles.cancelSheet}
              onPress={() =>
                setShowPhotoOptions(false)
              }
            >
              <Text
                style={styles.cancelText}
              >
                Cancel
              </Text>
            </TouchableOpacity>

          </View>

        </TouchableOpacity>

      </Modal>

    </SafeAreaView>
  );
}

// =========================
// MENU ITEM
// =========================

function MenuItem({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >

      <View style={styles.menuLeft}>

        <Ionicons
          name={icon}
          size={22}
          color={colors.secondary}
        />

        <Text
          style={styles.menuText}
        >
          {title}
        </Text>

      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.secondary}
      />

    </TouchableOpacity>
  );
}

// =========================
// STYLES
// =========================

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) => StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: colors.secondary,
  },

  noUserTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.text,
    marginTop: 15,
  },

  loginButton: {
    marginTop: 22,
    height: 50,
    paddingHorizontal: 35,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  scroll: {
    paddingBottom: 35,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },

  profileCard: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 18,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    elevation: 3,
  },

  avatarWrap: {
    position: "relative",
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: isDark ? "#243044" : "#E5E7EB",
  },

  cameraIcon: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.card,
  },

  userInfo: {
    flex: 1,
    marginLeft: 18,
  },

  name: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 5,
  },

  profileSub: {
    fontSize: 13,
    color: colors.secondary,
    marginBottom: 4,
  },

  menu: {
    marginHorizontal: 18,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.card,
    elevation: 3,
  },

  menuItem: {
    minHeight: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  menuText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 14,
    color: colors.text,
  },

  logout: {
    height: 58,
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 18,
    backgroundColor: colors.card,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },

  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },

  photoSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 35,
  },

  sheetTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  sheetOption: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  sheetText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },

  cancelSheet: {
    height: 50,
    borderRadius: 13,
    backgroundColor: isDark ? "#243044" : "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  cancelText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },

});