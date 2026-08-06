import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";

import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import CurrentLocationCard from "../../components/CurrentLocationCard";
import QuickActions from "../../components/QuickActions";
import NearbyPlaces from "../../components/NearbyPlaces";
import RecentSearches from "../../components/RecentSearches";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);

    // Future API Call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
       <Header />

        <SearchBar />

         <CurrentLocationCard />

        <QuickActions />

        <NearbyPlaces />

       <RecentSearches />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  scrollContent: {
    paddingBottom: 120,
  },
});