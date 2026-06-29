import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F4F0" } }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
