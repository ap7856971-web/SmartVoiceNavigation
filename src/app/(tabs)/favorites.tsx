import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const favorites = [
  {
    id: "1",
    title: "Home",
    address: "Connaught Place, New Delhi",
    icon: "home",
  },
  {
    id: "2",
    title: "Work",
    address: "Noida Sector 62",
    icon: "briefcase",
  },
  {
    id: "3",
    title: "India Gate",
    address: "New Delhi",
    icon: "heart",
  },
];

export default function FavoritesScreen() {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name={item.icon as any} size={26} color="#2563EB" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>❤️ Favorites</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Add New Favorite</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    padding: 20,
    paddingTop: 60,
  },

  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,

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
    marginRight: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  address: {
    color: "#777",
    marginTop: 4,
  },

  addButton: {
    marginTop: 25,
    backgroundColor: "#2563EB",
    height: 58,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  addText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
});