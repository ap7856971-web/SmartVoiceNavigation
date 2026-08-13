import React, { useEffect, useState } from "react";
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
  TextInput,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=12";

type Page =
  | "profile"
  | "edit"
  | "emergency"
  | "settings"
  | "homeWork"
  | "help"
  | "about";

type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

type SettingsData = {
  darkMode: boolean;
  voiceLanguage: string;
  voiceType: string;
  distanceUnit: string;
  trafficUpdates: boolean;
  pushNotifications: boolean;
};

const DEFAULT_SETTINGS: SettingsData = {
  darkMode: false,
  voiceLanguage: "English",
  voiceType: "Female",
  distanceUnit: "Kilometers",
  trafficUpdates: true,
  pushNotifications: true,
};

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("profile");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [photoURL, setPhotoURL] = useState(DEFAULT_AVATAR);

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [settings, setSettings] =
    useState<SettingsData>(DEFAULT_SETTINGS);

  const [homeAddress, setHomeAddress] = useState("");
  const [workAddress, setWorkAddress] = useState("");

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const isDark = settings.darkMode;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await loadData(currentUser);
      } else {
        setName("");
        setEmail("");
        setPhone("");
        setGender("");
        setPhotoURL(DEFAULT_AVATAR);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function loadData(currentUser: any) {
    try {
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        setName(data.name || currentUser.displayName || "User");
        setEmail(data.email || currentUser.email || "No Email");
        setPhone(
          data.phone || currentUser.phoneNumber || "No Phone Number"
        );
        setGender(data.gender || "");
        setPhotoURL(
          data.photoURL || currentUser.photoURL || DEFAULT_AVATAR
        );

        if (Array.isArray(data.emergencyContacts)) {
          setContacts(data.emergencyContacts);
        } else if (data.emergencyContact) {
          setContacts([
            {
              id: "default",
              name: data.emergencyContact.name || "",
              relation: data.emergencyContact.relation || "",
              phone: data.emergencyContact.phone || "",
            },
          ]);
        }

        setSettings({
          ...DEFAULT_SETTINGS,
          ...(data.settings || {}),
        });

        setHomeAddress(data.homeAddress || "");
        setWorkAddress(data.workAddress || "");
      } else {
        setName(currentUser.displayName || "User");
        setEmail(currentUser.email || "No Email");
        setPhone(currentUser.phoneNumber || "No Phone Number");
        setPhotoURL(currentUser.photoURL || DEFAULT_AVATAR);
      }
    } catch (error) {
      console.log("[Profile] Load error:", error);
      setName(currentUser.displayName || "User");
      setEmail(currentUser.email || "No Email");
      setPhone(currentUser.phoneNumber || "No Phone Number");
      setPhotoURL(currentUser.photoURL || DEFAULT_AVATAR);
    }
  }

  async function saveProfile() {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }

    setSaving(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: name.trim(),
          phone: phone.trim(),
          gender,
          email,
          photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("Success", "Profile updated successfully.");
      setPage("profile");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

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

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setPhotoURL(uri);

      if (user) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              photoURL: uri,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.log("Photo save error:", error);
        }
      }
    }
  }

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

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setPhotoURL(uri);

      if (user) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              photoURL: uri,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.log("Camera photo save error:", error);
        }
      }
    }
  }

  async function saveContacts(next: EmergencyContact[]) {
    setContacts(next);

    if (!user) return;

    await setDoc(
      doc(db, "users", user.uid),
      {
        emergencyContacts: next,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function saveSettings(next: SettingsData) {
    setSettings(next);

    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          settings: next,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.log("Settings save error:", error);
    }
  }

  async function saveHomeWork() {
    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          homeAddress: homeAddress.trim(),
          workAddress: workAddress.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("Saved", "Home & Work locations saved.");
      setPage("profile");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Unable to save locations."
      );
    }
  }

  async function logout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/");
            } catch (error) {
              console.log("[Profile] Logout error:", error);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#2874F0" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noUser}>
          <Ionicons
            name="person-outline"
            size={45}
            color="#2874F0"
          />
          <Text style={styles.noUserTitle}>
            No user is logged in
          </Text>
          <Text style={styles.noUserSub}>
            Please login to view your profile.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const theme = {
    bg: isDark ? "#0B1220" : "#F7F8FA",
    card: isDark ? "#151F2F" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#111827",
    sub: isDark ? "#AEB8C7" : "#6B7280",
    border: isDark ? "#253247" : "#EEF0F3",
    input: isDark ? "#101827" : "#F8F9FB",
  };

  function Header({
    title,
    back = true,
  }: {
    title: string;
    back?: boolean;
  }) {
    return (
      <View
        style={[
          styles.header,
          { backgroundColor: theme.bg },
        ]}
      >
        {back ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setPage("profile")}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={theme.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}

        <Text
          style={[
            styles.headerTitle,
            { color: theme.text },
          ]}
        >
          {title}
        </Text>

        <View style={styles.headerButton} />
      </View>
    );
  }

  function MenuItem({
    icon,
    title,
    onPress,
    danger = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    onPress: () => void;
    danger?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          { borderBottomColor: theme.border },
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.menuLeft}>
          <Ionicons
            name={icon}
            size={22}
            color={danger ? "#EF4444" : theme.sub}
          />

          <Text
            style={[
              styles.menuText,
              {
                color: danger
                  ? "#EF4444"
                  : theme.text,
              },
            ]}
          >
            {title}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.sub}
        />
      </TouchableOpacity>
    );
  }

  function ProfilePage() {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Header title="Profile" back={false} />

          <View
            style={[
              styles.profileCard,
              { backgroundColor: theme.card },
            ]}
          >
            <TouchableOpacity
              style={styles.avatarWrap}
              activeOpacity={0.8}
              onPress={() => setShowPhotoOptions(true)}
            >
              <Image
                source={{ uri: photoURL }}
                style={styles.avatar}
              />

              <View style={styles.cameraIcon}>
                <Ionicons
                  name="camera"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <Text
                style={[
                  styles.name,
                  { color: theme.text },
                ]}
                numberOfLines={1}
              >
                {name || "User"}
              </Text>

              <Text
                style={[
                  styles.profileSub,
                  { color: theme.sub },
                ]}
                numberOfLines={1}
              >
                {email || "No Email"}
              </Text>

              <Text
                style={[
                  styles.profileSub,
                  { color: theme.sub },
                ]}
              >
                {phone || "No Phone Number"}
              </Text>

              {!!gender && (
                <Text
                  style={[
                    styles.profileSub,
                    { color: theme.sub },
                  ]}
                >
                  {gender}
                </Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.menu,
              { backgroundColor: theme.card },
            ]}
          >
            <MenuItem
              icon="create-outline"
              title="Edit Profile"
              onPress={() => setPage("edit")}
            />

            <MenuItem
              icon="home-outline"
              title="Home & Work"
              onPress={() => setPage("homeWork")}
            />

            <MenuItem
              icon="call-outline"
              title="Emergency Contacts"
              onPress={() => setPage("emergency")}
            />

            <MenuItem
              icon="settings-outline"
              title="Settings"
              onPress={() => setPage("settings")}
            />

            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => setPage("help")}
            />

            <MenuItem
              icon="information-circle-outline"
              title="About Us"
              onPress={() => setPage("about")}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.logout,
              { backgroundColor: theme.card },
            ]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={21}
              color="#EF4444"
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.version,
              { color: theme.sub },
            ]}
          >
            SmartVoiceNavigation • v1.0.0
          </Text>
        </ScrollView>

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
            onPress={() => setShowPhotoOptions(false)}
          >
            <View
              style={[
                styles.photoSheet,
                { backgroundColor: theme.card },
              ]}
            >
              <Text
                style={[
                  styles.sheetTitle,
                  { color: theme.text },
                ]}
              >
                Profile Photo
              </Text>

              <TouchableOpacity
                style={styles.sheetOption}
                onPress={chooseCamera}
              >
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color="#2874F0"
                />
                <Text
                  style={[
                    styles.sheetText,
                    { color: theme.text },
                  ]}
                >
                  Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetOption}
                onPress={chooseGallery}
              >
                <Ionicons
                  name="images-outline"
                  size={24}
                  color="#2874F0"
                />
                <Text
                  style={[
                    styles.sheetText,
                    { color: theme.text },
                  ]}
                >
                  Gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelSheet}
                onPress={() =>
                  setShowPhotoOptions(false)
                }
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  function EditProfilePage() {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg },
        ]}
      >
        <Header title="Edit Profile" />

        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.editAvatarWrap}
            onPress={() => setShowPhotoOptions(true)}
          >
            <Image
              source={{ uri: photoURL }}
              style={styles.editAvatar}
            />
            <View style={styles.editCamera}>
              <Ionicons
                name="camera"
                size={18}
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          <Field
            label="Full Name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            theme={theme}
          />

          <Field
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            editable={false}
            theme={theme}
          />

          <Field
            label="Phone Number"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
            theme={theme}
          />

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.text },
            ]}
          >
            Gender
          </Text>

          <View style={styles.genderRow}>
            {["Male", "Female", "Other"].map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.genderButton,
                    {
                      backgroundColor:
                        gender === item
                          ? "#2874F0"
                          : theme.card,
                      borderColor:
                        gender === item
                          ? "#2874F0"
                          : theme.border,
                    },
                  ]}
                  onPress={() => setGender(item)}
                >
                  <Text
                    style={{
                      color:
                        gender === item
                          ? "#FFFFFF"
                          : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  function EmergencyPage() {
    const [emName, setEmName] = useState("");
    const [emRelation, setEmRelation] = useState("");
    const [emPhone, setEmPhone] = useState("");

    async function addContact() {
      if (!emName.trim() || !emPhone.trim()) {
        Alert.alert(
          "Required",
          "Please enter contact name and number."
        );
        return;
      }

      const cleaned = emPhone.replace(/[\s-]/g, "");
      let normalized = "";

      if (/^\+91\d{10}$/.test(cleaned)) {
        normalized = cleaned;
      } else if (/^91\d{10}$/.test(cleaned)) {
        normalized = `+${cleaned}`;
      } else if (/^\d{10}$/.test(cleaned)) {
        normalized = `+91${cleaned}`;
      } else {
        Alert.alert(
          "Invalid Number",
          "Enter a valid 10 digit mobile number."
        );
        return;
      }

      const next = [
        ...contacts,
        {
          id: Date.now().toString(),
          name: emName.trim(),
          relation: emRelation.trim() || "Emergency Contact",
          phone: normalized,
        },
      ];

      try {
        await saveContacts(next);
        setEmName("");
        setEmRelation("");
        setEmPhone("");
        Alert.alert("Success", "Emergency contact added.");
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.message || "Unable to save contact."
        );
      }
    }

    async function deleteContact(id: string) {
      const next = contacts.filter((item) => item.id !== id);
      await saveContacts(next);
    }

    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg },
        ]}
      >
        <Header title="Emergency Contacts" />

        <ScrollView contentContainerStyle={styles.formScroll}>
          <View
            style={[
              styles.emergencyInfo,
              { backgroundColor: theme.card },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={30}
              color="#EF4444"
            />
            <Text
              style={[
                styles.emergencyInfoText,
                { color: theme.sub },
              ]}
            >
              Add trusted people who can be contacted
              during an emergency.
            </Text>
          </View>

          {contacts.map((contact) => (
            <View
              key={contact.id}
              style={[
                styles.contactCard,
                { backgroundColor: theme.card },
              ]}
            >
              <View style={styles.contactAvatar}>
                <Ionicons
                  name="person"
                  size={22}
                  color="#2874F0"
                />
              </View>

              <View style={styles.contactInfo}>
                <Text
                  style={[
                    styles.contactName,
                    { color: theme.text },
                  ]}
                >
                  {contact.name}
                </Text>
                <Text
                  style={[
                    styles.contactRelation,
                    { color: theme.sub },
                  ]}
                >
                  {contact.relation}
                </Text>
                <Text
                  style={[
                    styles.contactPhone,
                    { color: theme.sub },
                  ]}
                >
                  {contact.phone}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => deleteContact(contact.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color="#EF4444"
                />
              </TouchableOpacity>
            </View>
          ))}

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.text },
            ]}
          >
            Add Emergency Contact
          </Text>

          <Field
            label="Contact Name"
            icon="person-outline"
            value={emName}
            onChangeText={setEmName}
            placeholder="e.g. Father"
            theme={theme}
          />

          <Field
            label="Relation"
            icon="people-outline"
            value={emRelation}
            onChangeText={setEmRelation}
            placeholder="e.g. Father, Mother"
            theme={theme}
          />

          <Field
            label="Mobile Number"
            icon="call-outline"
            value={emPhone}
            onChangeText={setEmPhone}
            placeholder="10 digit mobile number"
            keyboardType="phone-pad"
            theme={theme}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={addContact}
          >
            <Ionicons name="add" size={21} color="#fff" />
            <Text style={styles.primaryText}>
              Add Contact
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  function SettingsPage() {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg },
        ]}
      >
        <Header title="Settings" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 35 }}
        >
          <SectionTitle title="Appearance" color={theme.sub} />

          <SettingSwitch
            title="Dark Mode"
            icon="moon-outline"
            value={settings.darkMode}
            onChange={(value: boolean) =>
              saveSettings({
                ...settings,
                darkMode: value,
              })
            }
            theme={theme}
          />

          <SectionTitle
            title="Voice & Language"
            color={theme.sub}
          />

          <SettingRow
            title="Voice Language"
            icon="language-outline"
            value={settings.voiceLanguage}
            onPress={() => setShowLanguagePicker(true)}
            theme={theme}
          />

          <SettingRow
            title="Voice Type"
            icon="mic-outline"
            value={settings.voiceType}
            onPress={() => setShowVoicePicker(true)}
            theme={theme}
          />

          <SectionTitle
            title="Navigation"
            color={theme.sub}
          />

          <SettingRow
            title="Distance Unit"
            icon="speedometer-outline"
            value={settings.distanceUnit}
            onPress={() => setShowUnitPicker(true)}
            theme={theme}
          />

          <SettingSwitch
            title="Traffic Updates"
            icon="car-outline"
            value={settings.trafficUpdates}
            onChange={(value: boolean) =>
              saveSettings({
                ...settings,
                trafficUpdates: value,
              })
            }
            theme={theme}
          />

          <SectionTitle
            title="Notifications"
            color={theme.sub}
          />

          <SettingSwitch
            title="Push Notifications"
            icon="notifications-outline"
            value={settings.pushNotifications}
            onChange={(value: boolean) =>
              saveSettings({
                ...settings,
                pushNotifications: value,
              })
            }
            theme={theme}
          />

          <SectionTitle title="About" color={theme.sub} />

          <View
            style={[
              styles.settingRow,
              {
                backgroundColor: theme.card,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={theme.sub}
              />
              <Text
                style={[
                  styles.settingText,
                  { color: theme.text },
                ]}
              >
                App Version
              </Text>
            </View>

            <Text
              style={[
                styles.settingValue,
                { color: theme.sub },
              ]}
            >
              1.0.0
            </Text>
          </View>
        </ScrollView>

        <PickerModal
          visible={showLanguagePicker}
          title="Voice Language"
          options={["English", "Hindi", "Hinglish"]}
          selected={settings.voiceLanguage}
          onSelect={(value: string) => {
            saveSettings({
              ...settings,
              voiceLanguage: value,
            });
            setShowLanguagePicker(false);
          }}
          onClose={() => setShowLanguagePicker(false)}
          theme={theme}
        />

        <PickerModal
          visible={showVoicePicker}
          title="Voice Type"
          options={["Female", "Male"]}
          selected={settings.voiceType}
          onSelect={(value: string) => {
            saveSettings({
              ...settings,
              voiceType: value,
            });
            setShowVoicePicker(false);
          }}
          onClose={() => setShowVoicePicker(false)}
          theme={theme}
        />

        <PickerModal
          visible={showUnitPicker}
          title="Distance Unit"
          options={["Kilometers", "Miles"]}
          selected={settings.distanceUnit}
          onSelect={(value: string) => {
            saveSettings({
              ...settings,
              distanceUnit: value,
            });
            setShowUnitPicker(false);
          }}
          onClose={() => setShowUnitPicker(false)}
          theme={theme}
        />
      </SafeAreaView>
    );
  }

  function HomeWorkPage() {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg },
        ]}
      >
        <Header title="Home & Work" />

        <ScrollView contentContainerStyle={styles.formScroll}>
          <Text
            style={[
              styles.homeWorkHint,
              { color: theme.sub },
            ]}
          >
            Save your frequently used Home and Work
            locations for faster navigation.
          </Text>

          <Field
            label="Home Address"
            icon="home-outline"
            value={homeAddress}
            onChangeText={setHomeAddress}
            placeholder="Enter home address"
            theme={theme}
          />

          <Field
            label="Work Address"
            icon="briefcase-outline"
            value={workAddress}
            onChangeText={setWorkAddress}
            placeholder="Enter work address"
            theme={theme}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={saveHomeWork}
          >
            <Text style={styles.primaryText}>
              Save Locations
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  function HelpPage() {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg },
        ]}
      >
        <Header title="Help & Support" />

        <ScrollView contentContainerStyle={styles.formScroll}>
          <InfoCard
            icon="help-circle-outline"
            title="How can we help?"
            text="For navigation problems, voice issues, account problems or other app-related support, please contact the SmartVoiceNavigation support team."
            theme={theme}
          />

          <InfoCard
            icon="navigate-outline"
            title="Navigation Help"
            text="Make sure location permission and GPS are enabled before starting navigation."
            theme={theme}
          />

          <InfoCard
            icon="mic-outline"
            title="Voice Assistant"
            text="Use the Voice screen to give navigation commands and receive spoken instructions."
            theme={theme}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  function AboutPage() {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.bg },
        ]}
      >
        <Header title="About Us" />

        <View style={styles.aboutPage}>
          <View style={styles.aboutLogo}>
            <Ionicons
              name="navigate"
              size={42}
              color="#2874F0"
            />
          </View>

          <Text
            style={[
              styles.aboutTitle,
              { color: theme.text },
            ]}
          >
            SmartVoiceNavigation
          </Text>

          <Text
            style={[
              styles.aboutVersion,
              { color: theme.sub },
            ]}
          >
            Version 1.0.0
          </Text>

          <Text
            style={[
              styles.aboutDescription,
              { color: theme.sub },
            ]}
          >
            Smart voice-powered navigation designed
            to make your journey simple, safe and
            convenient.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (page === "edit") return <EditProfilePage />;
  if (page === "emergency") return <EmergencyPage />;
  if (page === "settings") return <SettingsPage />;
  if (page === "homeWork") return <HomeWorkPage />;
  if (page === "help") return <HelpPage />;
  if (page === "about") return <AboutPage />;

  return <ProfilePage />;
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  theme,
}: any) {
  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
          { color: theme.text },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: theme.input,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={theme.sub}
        />

        <TextInput
          style={[
            styles.input,
            { color: theme.text },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.sub}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize="words"
        />
      </View>
    </View>
  );
}

function SectionTitle({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <Text
      style={[
        styles.sectionTitle,
        { color },
      ]}
    >
      {title}
    </Text>
  );
}

function SettingRow({
  title,
  icon,
  value,
  onPress,
  theme,
}: any) {
  return (
    <TouchableOpacity
      style={[
        styles.settingRow,
        {
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={theme.sub}
        />

        <Text
          style={[
            styles.settingText,
            { color: theme.text },
          ]}
        >
          {title}
        </Text>
      </View>

      <View style={styles.settingRight}>
        <Text
          style={[
            styles.settingValue,
            { color: theme.sub },
          ]}
        >
          {value}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.sub}
        />
      </View>
    </TouchableOpacity>
  );
}

function SettingSwitch({
  title,
  icon,
  value,
  onChange,
  theme,
}: any) {
  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={theme.sub}
        />

        <Text
          style={[
            styles.settingText,
            { color: theme.text },
          ]}
        >
          {title}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  theme,
}: any) {
  const safeTheme = theme || {
    bg: "#F7F8FA",
    card: "#FFFFFF",
    text: "#111827",
    sub: "#6B7280",
    border: "#EEF0F3",
    input: "#F8F9FB",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.pickerBox,
            { backgroundColor: theme.card },
          ]}
        >
          <Text
            style={[
              styles.pickerTitle,
              { color: theme.text },
            ]}
          >
            {title}
          </Text>

          {options.map((option: string) => (
            <TouchableOpacity
              key={option}
              style={styles.pickerOption}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  {
                    color:
                      selected === option
                        ? "#2874F0"
                        : theme.text,
                  },
                ]}
              >
                {option}
              </Text>

              {selected === option && (
                <Ionicons
                  name="checkmark"
                  size={22}
                  color="#2874F0"
                />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelPicker}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function InfoCard({
  icon,
  title,
  text,
  theme,
}: any) {
  return (
    <View
      style={[
        styles.infoCard,
        { backgroundColor: theme.card },
      ]}
    >
      <Ionicons
        name={icon}
        size={26}
        color="#2874F0"
      />

      <View style={styles.infoCardText}>
        <Text
          style={[
            styles.infoCardTitle,
            { color: theme.text },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.infoCardDescription,
            { color: theme.sub },
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loading: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  scroll: {
    paddingBottom: 35,
  },

  formScroll: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  profileCard: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 18,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  avatarWrap: {
    position: "relative",
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#E5E7EB",
  },

  cameraIcon: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#2874F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  userInfo: {
    flex: 1,
    marginLeft: 18,
  },

  name: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 5,
  },

  profileSub: {
    fontSize: 13,
    marginBottom: 4,
  },

  menu: {
    marginHorizontal: 18,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  menuItem: {
    minHeight: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
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
  },

  logout: {
    height: 58,
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },

  version: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },

  photoSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 35,
  },

  sheetTitle: {
    fontSize: 19,
    fontWeight: "700",
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
  },

  cancelSheet: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  cancelText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },

  editAvatarWrap: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 20,
  },

  editAvatar: {
    width: 105,
    height: 105,
    borderRadius: 53,
  },

  editCamera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#2874F0",
    alignItems: "center",
    justifyContent: "center",
  },

  field: {
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  inputBox: {
    minHeight: 53,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: 15,
    marginLeft: 11,
  },

  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },

  genderButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButton: {
    minHeight: 53,
    borderRadius: 14,
    backgroundColor: "#2874F0",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
  },

  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  emergencyInfo: {
    borderRadius: 16,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  emergencyInfoText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
    fontSize: 14,
  },

  contactCard: {
    minHeight: 78,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },

  contactName: {
    fontSize: 16,
    fontWeight: "700",
  },

  contactRelation: {
    fontSize: 12,
    marginTop: 2,
  },

  contactPhone: {
    fontSize: 13,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 7,
    marginHorizontal: 18,
    textTransform: "none",
  },

  settingRow: {
    minHeight: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  settingText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 13,
  },

  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  settingValue: {
    fontSize: 13,
  },

  pickerBox: {
    margin: 22,
    borderRadius: 20,
    padding: 20,
  },

  pickerTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 10,
  },

  pickerOption: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F3",
  },

  pickerOptionText: {
    fontSize: 15,
    fontWeight: "500",
  },

  cancelPicker: {
    height: 48,
    backgroundColor: "#F1F3F5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  homeWorkHint: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },

  infoCard: {
    borderRadius: 17,
    padding: 18,
    flexDirection: "row",
    marginBottom: 12,
  },

  infoCardText: {
    flex: 1,
    marginLeft: 13,
  },

  infoCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  infoCardDescription: {
    fontSize: 13,
    lineHeight: 20,
  },

  aboutPage: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 80,
  },

  aboutLogo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  aboutTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  aboutVersion: {
    fontSize: 13,
    marginTop: 5,
  },

  aboutDescription: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 18,
  },

  noUser: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  noUserTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
    marginTop: 15,
  },

  noUserSub: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 7,
    textAlign: "center",
  },

  loginButton: {
    marginTop: 22,
    height: 50,
    paddingHorizontal: 35,
    borderRadius: 13,
    backgroundColor: "#2874F0",
    justifyContent: "center",
    alignItems: "center",
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});