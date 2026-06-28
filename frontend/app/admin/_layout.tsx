import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";

export default function AdminLayout() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F4F0" } }} />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
