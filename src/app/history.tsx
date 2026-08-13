import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const recentSearches = [
  {
    id: "1",
    title: "India Gate",
    subtitle: "New Delhi",
    time: "Today • 10:30 AM",
  },
  {
    id: "2",
    title: "Karol Bagh",
    subtitle: "New Delhi",
    time: "Today • 9:15 AM",
  },
  {
    id: "3",
    title: "Red Fort",
    subtitle: "New Delhi",
    time: "Yesterday • 7:45 PM",
  },
  {
    id: "4",
    title: "Noida Sector 62",
    subtitle: "Noida",
    time: "Yesterday • 6:20 PM",
  },
];

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState("searches");

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons
            name="arrow-back-ios"
            size={22}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>History</Text>

        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "searches" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("searches")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "searches" && styles.activeText,
            ]}
          >
            Recent Searches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "routes" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("routes")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "routes" && styles.activeText,
            ]}
          >
            Recent Routes
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={recentSearches}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.place}>
                {item.title}
              </Text>

              <Text style={styles.city}>
                {item.subtitle}
              </Text>

              <Text style={styles.time}>
                {item.time}
              </Text>
            </View>

            <TouchableOpacity>
              <MaterialIcons
                name="delete-outline"
                size={24}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F8FAFC",
    paddingTop:60,
  },

  header:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    paddingHorizontal:20,
    marginBottom:20,
  },

  headerTitle:{
    fontSize:26,
    fontWeight:"700",
    color:"#111827",
  },

  tabs:{
    flexDirection:"row",
    marginHorizontal:20,
    backgroundColor:"#EEF2FF",
    borderRadius:12,
    padding:4,
    marginBottom:20,
  },

  tab:{
    flex:1,
    paddingVertical:12,
    borderRadius:10,
    alignItems:"center",
  },

  activeTab:{
    backgroundColor:"#fff",
  },

  tabText:{
    color:"#6B7280",
    fontWeight:"600",
  },

  activeText:{
    color:"#2563EB",
  },

  card:{
    backgroundColor:"#fff",
    marginHorizontal:20,
    marginBottom:15,
    padding:18,
    borderRadius:18,
    flexDirection:"row",
    alignItems:"center",
    elevation:3,
  },

  place:{
    fontSize:18,
    fontWeight:"700",
  },

  city:{
    color:"#6B7280",
    marginTop:3,
  },

  time:{
    color:"#9CA3AF",
    marginTop:5,
    fontSize:12,
  }

});