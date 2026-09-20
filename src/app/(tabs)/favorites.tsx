import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

type Favorite = {
  id: string;
  title: string;
  address: string;
  icon: string;
  latitude?: number;
  longitude?: number;
};

const FAVORITES_STORAGE_KEY = "smartVoiceNavigation_favorites";

const DEFAULT_FAVORITES: Favorite[] = [
  {
    id: "home",
    title: "Home",
    address: "Set your home address",
    icon: "home",
  },
  {
    id: "work",
    title: "Work",
    address: "Set your work address",
    icon: "briefcase",
  },
];

export default function FavoritesScreen() {
  const [favorites, setFavorites] =
    useState<Favorite[]>([]);

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const user = auth.currentUser;

    if (!user) {
      setFavorites(DEFAULT_FAVORITES);
      setLoading(false);
      return;
    }

    const storageKey = `${FAVORITES_STORAGE_KEY}:${user.uid}`;

    // Local-first: show cached favorites immediately.
    try {
      const cached = await AsyncStorage.getItem(storageKey);

      if (cached) {
        const parsed = JSON.parse(cached);

        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (error) {
      console.warn("[Favorites] Cache load error:", error);
    } finally {
      // Do not block the screen on Firebase.
      setLoading(false);
    }

    // Firebase sync happens in the background.
    try {
      const ref = collection(
        db,
        "users",
        user.uid,
        "favorites"
      );

      const snapshot = await getDocs(ref);

      const items: Favorite[] = snapshot.docs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          title: data.title || "Favorite",
          address: data.address || "",
          icon: data.icon || "heart",
          latitude: data.latitude,
          longitude: data.longitude,
        };
      });

      setFavorites(items);
      await AsyncStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.error("[Favorites] Background sync error:", error);
      // Keep cached data visible if Firebase is unavailable.
    }
  }

  function openFavorite(item: Favorite) {
    // Home and Work are handled by the voice/navigation
    // layer using their saved destinations.
    if (
      item.id === "home" ||
      item.id === "work"
    ) {
      router.push({
        pathname: "/(tabs)/map",
        params: {
          destination: item.title,
        },
      } as any);

      return;
    }

    router.push({
      pathname: "/(tabs)/map",
      params: {
        destination:
          item.address || item.title,
      },
    } as any);
  }

  async function addFavorite() {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login before adding favorites."
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        "Name Required",
        "Please enter a name for this favorite."
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        "Address Required",
        "Please enter the place address."
      );
      return;
    }

    const id = `${Date.now()}`;

    const favorite: Favorite = {
      id,
      title: title.trim(),
      address: address.trim(),
      icon: "heart",
    };

    const storageKey = `${FAVORITES_STORAGE_KEY}:${user.uid}`;

    // Local-first: update the UI and cache immediately.
    setFavorites((current) => {
      const updated = [...current, favorite];

      AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(
        (error) => console.warn("[Favorites] Cache save error:", error)
      );

      return updated;
    });

    setTitle("");
    setAddress("");
    setModalVisible(false);
    setSaving(false);

    // Firebase write runs in the background.
    try {
      await setDoc(
        doc(db, "users", user.uid, "favorites", id),
        favorite
      );
    } catch (error: any) {
      console.error("[Favorites] Background add error:", error);

      // Roll back local state/cache if cloud save fails.
      setFavorites((current) => {
        const updated = current.filter((item) => item.id !== id);

        AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(
          (cacheError) =>
            console.warn("[Favorites] Cache rollback error:", cacheError)
        );

        return updated;
      });

      Alert.alert(
        "Sync Error",
        error?.message || "Favorite was not saved to the cloud."
      );
    }
  }

  function deleteFavorite(item: Favorite) {
    if (
      item.id === "home" ||
      item.id === "work"
    ) {
      Alert.alert(
        "Protected Favorite",
        "Home and Work can be edited from their dedicated settings."
      );
      return;
    }

    Alert.alert(
      "Delete Favorite",
      `Remove ${item.title} from favorites?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const user = auth.currentUser;

            if (!user) return;

            const storageKey = `${FAVORITES_STORAGE_KEY}:${user.uid}`;

            // Optimistic delete: remove locally first.
            setFavorites((current) => {
              const updated = current.filter(
                (favorite) => favorite.id !== item.id
              );

              AsyncStorage.setItem(
                storageKey,
                JSON.stringify(updated)
              ).catch((error) =>
                console.warn(
                  "[Favorites] Cache delete error:",
                  error
                )
              );

              return updated;
            });

            // Delete from Firebase in the background.
            deleteDoc(
              doc(
                db,
                "users",
                user.uid,
                "favorites",
                item.id
              )
            ).catch((error: any) => {
              console.error(
                "[Favorites] Background delete error:",
                error
              );

              // Restore if cloud deletion fails.
              setFavorites((current) => {
                const exists = current.some(
                  (favorite) => favorite.id === item.id
                );

                if (exists) return current;

                const restored = [...current, item];

                AsyncStorage.setItem(
                  storageKey,
                  JSON.stringify(restored)
                ).catch((cacheError) =>
                  console.warn(
                    "[Favorites] Cache restore error:",
                    cacheError
                  )
                );

                return restored;
              });

              Alert.alert(
                "Sync Error",
                error?.message ||
                  "Unable to delete favorite from the cloud."
              );
            });
          },
        },
      ]
    );
  }

  function renderItem({
    item,
  }: {
    item: Favorite;
  }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openFavorite(item)}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Ionicons
            name={item.icon as any}
            size={26}
            color="#2563EB"
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>
            {item.title}
          </Text>

          <Text
            style={styles.address}
            numberOfLines={2}
          >
            {item.address}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteFavorite(item)}
          hitSlop={8}
        >
          <Ionicons
            name="trash-outline"
            size={21}
            color="#EF4444"
          />
        </TouchableOpacity>

        <Ionicons
          name="chevron-forward"
          size={22}
          color="#999"
        />
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading favorites...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111827"
          />
        </TouchableOpacity>

        <Text style={styles.header}>
          ❤️ Favorites
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          favorites.length === 0
            ? styles.emptyList
            : styles.list
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="heart-outline"
              size={58}
              color="#CBD5E1"
            />

            <Text style={styles.emptyTitle}>
              No favorites yet
            </Text>

            <Text style={styles.emptyText}>
              Add places you visit frequently
              for quick access.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add"
          size={24}
          color="#fff"
        />

        <Text style={styles.addText}>
          Add New Favorite
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add Favorite
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#111827"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              Place Name
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. College"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>
              Address
            </Text>

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Muzaffarnagar, Uttar Pradesh"
              placeholderTextColor="#9CA3AF"
              style={[
                styles.input,
                styles.addressInput,
              ]}
              multiline
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={addFavorite}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="heart"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={styles.saveText}
                  >
                    Save Favorite
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 20,
    paddingTop: 45,
  },

  center: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 3,
  },

  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  list: {
    paddingBottom: 100,
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 110,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 15,
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  info: {
    flex: 1,
    paddingRight: 7,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  address: {
    color: "#777",
    marginTop: 4,
    lineHeight: 18,
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    marginRight: 4,
  },

  addButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "#2563EB",
    height: 58,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    elevation: 5,
  },

  addText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },

  empty: {
    alignItems: "center",
    paddingHorizontal: 35,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 15,
  },

  emptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 7,
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 30,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 7,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 15,
    backgroundColor: "#F9FAFB",
  },

  addressInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 13,
  },

  saveButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
